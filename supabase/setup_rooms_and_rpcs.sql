-- ==============================================================================
-- ChobiDeh Production Room Setup & RPC Functions
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/arogfjfaakgbjtxtlvlj/sql/new
-- ==============================================================================

-- 1. Ensure required cryptographic extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure public.profiles has avatar_url and face_clustering_enabled
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS face_clustering_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT true;

-- 3. Upgrade public.rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS join_slug TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS face_clustering_enabled BOOLEAN NOT NULL DEFAULT false;

-- If join_code_hash exists from initial migration, make it nullable so modern rooms can use join_slug
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'join_code_hash'
  ) THEN
    ALTER TABLE public.rooms ALTER COLUMN join_code_hash DROP NOT NULL;
  END IF;
END $$;

-- Populate join_slug for any legacy rooms that don't have one
UPDATE public.rooms
SET join_slug = lower(encode(gen_random_bytes(6), 'hex'))
WHERE join_slug IS NULL;

-- Enforce unique index on join_slug
CREATE UNIQUE INDEX IF NOT EXISTS uq_rooms_join_slug ON public.rooms(join_slug);

-- 4. Isolated table for room passcodes (hashed, inaccessible to client directly)
CREATE TABLE IF NOT EXISTS public.room_passcodes (
  room_id UUID PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
  passcode_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.room_passcodes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.room_passcodes FROM anon, authenticated, public;

-- 5. Upgrade public.room_members table
ALTER TABLE public.room_members ADD COLUMN IF NOT EXISTS face_clustering_consent BOOLEAN NOT NULL DEFAULT false;

-- 6. Rate-limiting table for room join attempts
CREATE TABLE IF NOT EXISTS public.join_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_slug TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.join_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.join_attempts FROM anon, authenticated, public;

-- 7. Ensure is_room_member helper function exists
CREATE OR REPLACE FUNCTION public.is_room_member(check_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = check_room_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 8. RPC: create_room (Cryptographic join slug, atomic creator membership)
DROP FUNCTION IF EXISTS public.create_room(text, text);
CREATE OR REPLACE FUNCTION public.create_room(
  room_name text,
  passcode text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_room_id uuid;
  v_slug text;
  v_hash text;
  v_tries int := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF room_name IS NULL OR length(trim(room_name)) < 1 THEN
    RAISE EXCEPTION 'Room name cannot be empty.';
  END IF;

  -- Generate unique random 12-character hex slug
  LOOP
    v_slug := lower(encode(gen_random_bytes(6), 'hex'));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.rooms WHERE join_slug = v_slug);
    v_tries := v_tries + 1;
    IF v_tries > 10 THEN
      RAISE EXCEPTION 'Failed to generate a unique room slug. Please try again.';
    END IF;
  END LOOP;

  -- Create room
  INSERT INTO public.rooms (
    name,
    join_slug,
    created_by,
    face_clustering_enabled
  ) VALUES (
    trim(room_name),
    v_slug,
    v_user_id,
    false
  ) RETURNING id INTO v_room_id;

  -- Store hashed passcode securely if provided
  IF passcode IS NOT NULL AND length(trim(passcode)) > 0 THEN
    v_hash := crypt(trim(passcode), gen_salt('bf', 10));
    INSERT INTO public.room_passcodes (room_id, passcode_hash)
    VALUES (v_room_id, v_hash)
    ON CONFLICT (room_id) DO UPDATE SET passcode_hash = EXCLUDED.passcode_hash;
  END IF;

  -- Creator automatically joins as room owner
  INSERT INTO public.room_members (
    room_id,
    user_id,
    role,
    face_clustering_consent
  ) VALUES (
    v_room_id,
    v_user_id,
    'owner',
    false
  )
  ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'owner';

  RETURN jsonb_build_object(
    'id', v_room_id,
    'join_slug', v_slug
  );
END;
$$;

-- 9. RPC: join_room (Verifies passcode and rate-limits failed attempts)
DROP FUNCTION IF EXISTS public.join_room(text, text);
CREATE OR REPLACE FUNCTION public.join_room(
  slug text,
  passcode text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_cleaned_slug text;
  v_room record;
  v_stored_hash text;
  v_recent_failures int;
  v_is_valid boolean := false;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
  END IF;

  v_cleaned_slug := lower(trim(slug));
  IF v_cleaned_slug = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid room invite code or passcode.');
  END IF;

  -- Check rate limit: max 5 failed attempts in the last 10 minutes
  SELECT count(*) INTO v_recent_failures
  FROM public.join_attempts
  WHERE user_id = v_user_id
    AND success = false
    AND attempted_at > (now() - interval '10 minutes');

  IF v_recent_failures >= 5 THEN
    INSERT INTO public.join_attempts (user_id, room_slug, success, attempted_at)
    VALUES (v_user_id, v_cleaned_slug, false, now());

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Too many failed join attempts. Please wait 10 minutes before retrying.'
    );
  END IF;

  -- Find room
  SELECT id INTO v_room
  FROM public.rooms
  WHERE join_slug = v_cleaned_slug
    AND deleted_at IS NULL;

  IF v_room.id IS NULL THEN
    INSERT INTO public.join_attempts (user_id, room_slug, success, attempted_at)
    VALUES (v_user_id, v_cleaned_slug, false, now());

    RETURN jsonb_build_object('success', false, 'error', 'Invalid room invite code or passcode.');
  END IF;

  -- Check if already a member
  IF EXISTS (SELECT 1 FROM public.room_members WHERE room_id = v_room.id AND user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', true, 'room_id', v_room.id, 'already_member', true);
  END IF;

  -- Check passcode
  SELECT passcode_hash INTO v_stored_hash
  FROM public.room_passcodes
  WHERE room_id = v_room.id;

  IF v_stored_hash IS NULL THEN
    v_is_valid := true;
  ELSE
    IF passcode IS NOT NULL AND length(trim(passcode)) > 0 THEN
      v_is_valid := (crypt(trim(passcode), v_stored_hash) = v_stored_hash);
    ELSE
      v_is_valid := false;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    INSERT INTO public.join_attempts (user_id, room_slug, success, attempted_at)
    VALUES (v_user_id, v_cleaned_slug, false, now());

    RETURN jsonb_build_object('success', false, 'error', 'Invalid room passcode.');
  END IF;

  -- Record success and add member
  INSERT INTO public.join_attempts (user_id, room_slug, success, attempted_at)
  VALUES (v_user_id, v_cleaned_slug, true, now());

  INSERT INTO public.room_members (
    room_id,
    user_id,
    role,
    face_clustering_consent
  ) VALUES (
    v_room.id,
    v_user_id,
    'member',
    false
  )
  ON CONFLICT (room_id, user_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'room_id', v_room.id);
END;
$$;

-- 10. Grant Execution Rights
GRANT EXECUTE ON FUNCTION public.create_room(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_room(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_member(UUID) TO authenticated;

-- 11. Row Level Security Policies
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rooms viewable by active members" ON public.rooms;
CREATE POLICY "Rooms viewable by active members"
ON public.rooms FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL AND (
    created_by = auth.uid() OR
    public.is_room_member(id)
  )
);

DROP POLICY IF EXISTS "Room members viewable by fellow members" ON public.room_members;
CREATE POLICY "Room members viewable by fellow members"
ON public.room_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  public.is_room_member(room_id)
);

-- ==============================================================================
-- 12. Public Media Table & Capacity Enforcement
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    storage_key TEXT NOT NULL UNIQUE,
    thumbnail_key TEXT,
    display_key TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif')),
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 26214400), -- 25MB max
    width INT,
    height INT,
    upload_status TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploaded', 'failed')),
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Media viewable by room members" ON public.media;
CREATE POLICY "Media viewable by room members"
ON public.media FOR SELECT
TO authenticated
USING (public.is_room_member(room_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Media insertable by room members" ON public.media;
CREATE POLICY "Media insertable by room members"
ON public.media FOR INSERT
TO authenticated
WITH CHECK (public.is_room_member(room_id) AND uploaded_by = auth.uid());

CREATE OR REPLACE FUNCTION public.check_room_media_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  IF (
    SELECT count(*)
    FROM public.media
    WHERE room_id = NEW.room_id
      AND upload_status IN ('pending', 'uploaded')
      AND deleted_at IS NULL
  ) >= 1000 THEN
    RAISE EXCEPTION 'Room has reached the maximum capacity of 1,000 photos.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_room_media_cap ON public.media;
CREATE TRIGGER trg_enforce_room_media_cap
BEFORE INSERT ON public.media
FOR EACH ROW
EXECUTE FUNCTION public.check_room_media_cap();

-- ==============================================================================
-- 13. Direct Upload RPC: create_upload
-- ==============================================================================
DROP FUNCTION IF EXISTS public.create_upload(uuid, text, bigint);
CREATE OR REPLACE FUNCTION public.create_upload(
    target_room_id uuid,
    content_type text,
    size_bytes bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
    v_user_id uuid;
    v_media_id uuid;
    v_storage_key text;
    v_count int;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF NOT public.is_room_member(target_room_id) THEN
        RAISE EXCEPTION 'Access denied: not a member of this room.';
    END IF;

    -- Enforce 1,000 photo cap
    SELECT count(*) INTO v_count
    FROM public.media
    WHERE room_id = target_room_id
      AND upload_status IN ('pending', 'uploaded')
      AND deleted_at IS NULL;

    IF v_count >= 1000 THEN
        RAISE EXCEPTION 'Room has reached the maximum capacity of 1,000 photos.';
    END IF;

    IF content_type NOT IN ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif') THEN
        RAISE EXCEPTION 'Unsupported content type.';
    END IF;

    IF size_bytes <= 0 OR size_bytes > 26214400 THEN
        RAISE EXCEPTION 'File size must be between 1 byte and 25MB.';
    END IF;

    v_media_id := gen_random_uuid();
    v_storage_key := 'rooms/' || target_room_id::text || '/' || v_media_id::text || '.webp';

    INSERT INTO public.media (
        id, room_id, uploaded_by, storage_key, content_type, size_bytes, upload_status, processing_status
    )
    VALUES (
        v_media_id, target_room_id, v_user_id, v_storage_key, content_type, size_bytes, 'pending', 'pending'
    );

    RETURN jsonb_build_object(
        'media_id', v_media_id,
        'storage_key', v_storage_key
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_upload(uuid, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_upload(uuid, text, bigint) TO authenticated;

-- ==============================================================================
-- 14. Confirm Upload RPC: confirm_upload
-- ==============================================================================
DROP FUNCTION IF EXISTS public.confirm_upload(uuid, bigint, text);
CREATE OR REPLACE FUNCTION public.confirm_upload(
    target_media_id uuid,
    actual_size_bytes bigint DEFAULT NULL,
    actual_content_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
    v_user_id uuid;
    v_media record;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT * INTO v_media
    FROM public.media
    WHERE id = target_media_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Media not found.';
    END IF;

    IF v_media.uploaded_by <> v_user_id THEN
        RAISE EXCEPTION 'Permission denied.';
    END IF;

    UPDATE public.media
    SET upload_status = 'uploaded',
        size_bytes = COALESCE(actual_size_bytes, size_bytes),
        content_type = COALESCE(actual_content_type, content_type),
        deleted_at = NULL
    WHERE id = target_media_id;

    RETURN jsonb_build_object('success', true, 'media_id', target_media_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_upload(uuid, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_upload(uuid, bigint, text) TO authenticated;

-- ==============================================================================
-- 15. Storage Bucket (room-media) & Row Level Security
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('room-media', 'room-media', false)
        ON CONFLICT (id) DO UPDATE SET public = false;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        DROP POLICY IF EXISTS "Room media viewable by room members" ON storage.objects;
        CREATE POLICY "Room media viewable by room members"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
            bucket_id = 'room-media'
            AND public.is_room_member((split_part(name, '/', 2))::uuid)
        );

        DROP POLICY IF EXISTS "Room media uploadable by room members" ON storage.objects;
        CREATE POLICY "Room media uploadable by room members"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'room-media'
            AND name LIKE 'rooms/%/%'
            AND public.is_room_member((split_part(name, '/', 2))::uuid)
        );

        DROP POLICY IF EXISTS "Room media deletable by uploader or admin" ON storage.objects;
        CREATE POLICY "Room media deletable by uploader or admin"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'room-media'
            AND (
                owner = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.room_members rm
                    WHERE rm.room_id = (split_part(name, '/', 2))::uuid
                      AND rm.user_id = auth.uid()
                      AND rm.role IN ('owner', 'admin')
                )
            )
        );
    END IF;
END $$;

