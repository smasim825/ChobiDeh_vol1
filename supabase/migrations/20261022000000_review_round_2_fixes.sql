-- Migration: 20261022000000_review_round_2_fixes.sql
-- Description: Fixes for code review round 2:
-- 1. Add updated_at column to photo_assignments.
-- 2. Isolate passcode_hash in private room_passcodes table (RLS enabled, zero client policies) to prevent hash leakage.
-- 3. Drop leftover permissive INSERT policy on rooms.
-- 4. Cryptographic join slugs via gen_random_bytes.
-- 5. Return structured jsonb from join_room so failed attempts commit and rate limiting is reliable.
-- 6. Restrict purge_room_face_data strictly to owner/admin, and add withdraw_member_face_consent for individual members.
-- 7. Fix regex on storage object path to prevent malformed UUID cast crashes.
-- 8. Enforce that storage uploads match an authorized pending media row.
-- 9. Protect profiles.onboarding_completed against direct client tampering via trigger.
-- 10. Revoke EXECUTE from PUBLIC and anon on all definer RPCs.

-- ============================================================================
-- 1. ADD updated_at TO photo_assignments
-- ============================================================================
ALTER TABLE public.photo_assignments
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ============================================================================
-- 2. ISOLATE passcode_hash IN PRIVATE room_passcodes TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.room_passcodes (
  room_id uuid PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
  passcode_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.room_passcodes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.room_passcodes FROM anon, authenticated, public;

-- Migrate existing hashes if column exists on rooms, then drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'passcode_hash'
  ) THEN
    INSERT INTO public.room_passcodes (room_id, passcode_hash)
    SELECT id, passcode_hash 
    FROM public.rooms 
    WHERE passcode_hash IS NOT NULL
    ON CONFLICT (room_id) DO UPDATE SET passcode_hash = EXCLUDED.passcode_hash;

    ALTER TABLE public.rooms DROP COLUMN passcode_hash;
  END IF;
END $$;

-- Drop leftover permissive INSERT policy on rooms (only create_room RPC may create rooms)
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;

-- ============================================================================
-- 3. CRYPTOGRAPHIC JOIN SLUGS & create_room RPC
-- ============================================================================
DROP FUNCTION IF EXISTS public.create_room(text, text);
CREATE OR REPLACE FUNCTION public.create_room(
  room_name text,
  passcode text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_room_id uuid;
  v_slug text;
  v_hash text;
  v_tries int := 0;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF room_name IS NULL OR length(trim(room_name)) < 1 THEN
    RAISE EXCEPTION 'Room name cannot be empty.';
  END IF;

  -- Generate cryptographic random URL-safe slug (12 hex characters)
  LOOP
    BEGIN
      v_slug := lower(encode(extensions.gen_random_bytes(6), 'hex'));
    EXCEPTION WHEN OTHERS THEN
      -- Fallback if extensions schema is not in default search path
      v_slug := lower(encode(public.gen_random_bytes(6), 'hex'));
    END;

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

  -- Store hashed passcode securely in private room_passcodes table
  IF passcode IS NOT NULL AND length(trim(passcode)) > 0 THEN
    v_hash := extensions.crypt(trim(passcode), extensions.gen_salt('bf', 10));
    INSERT INTO public.room_passcodes (room_id, passcode_hash)
    VALUES (v_room_id, v_hash);
  END IF;

  -- Creator joins as owner
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
  );

  RETURN jsonb_build_object(
    'id', v_room_id,
    'join_slug', v_slug
  );
END;
$$;

-- ============================================================================
-- 4. NON-ROLLBACK join_room RPC (RELIABLE RATE LIMITING)
-- ============================================================================
DROP FUNCTION IF EXISTS public.join_room(text, text);
CREATE OR REPLACE FUNCTION public.join_room(
  slug text,
  passcode text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_cleaned_slug text;
  v_room record;
  v_stored_hash text;
  v_recent_failures int;
  v_is_valid boolean := false;
BEGIN
  v_user_id := (SELECT auth.uid());
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
    -- Record this blocked attempt and return error without rolling back
    INSERT INTO public.join_attempts (user_id, room_slug, success, attempted_at)
    VALUES (v_user_id, v_cleaned_slug, false, now());

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Too many failed join attempts. Please wait 10 minutes before retrying.'
    );
  END IF;

  -- Locate room (exclude soft-deleted rooms)
  SELECT id INTO v_room
  FROM public.rooms
  WHERE join_slug = v_cleaned_slug
    AND deleted_at IS NULL;

  IF v_room.id IS NULL THEN
    INSERT INTO public.join_attempts (user_id, room_slug, success, attempted_at)
    VALUES (v_user_id, v_cleaned_slug, false, now());

    RETURN jsonb_build_object('success', false, 'error', 'Invalid room invite code or passcode.');
  END IF;

  -- Fetch passcode hash from isolated room_passcodes table
  SELECT passcode_hash INTO v_stored_hash
  FROM public.room_passcodes
  WHERE room_id = v_room.id;

  -- Verify passcode
  IF v_stored_hash IS NULL THEN
    -- Room has no passcode
    v_is_valid := true;
  ELSE
    IF passcode IS NOT NULL AND length(trim(passcode)) > 0 THEN
      v_is_valid := (extensions.crypt(trim(passcode), v_stored_hash) = v_stored_hash);
    ELSE
      v_is_valid := false;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    -- Record failed attempt (this transaction commits!)
    INSERT INTO public.join_attempts (user_id, room_slug, success, attempted_at)
    VALUES (v_user_id, v_cleaned_slug, false, now());

    RETURN jsonb_build_object('success', false, 'error', 'Invalid room invite code or passcode.');
  END IF;

  -- If already a member, return success directly
  IF EXISTS (
    SELECT 1 FROM public.room_members 
    WHERE room_id = v_room.id AND user_id = v_user_id
  ) THEN
    INSERT INTO public.join_attempts (user_id, room_slug, success, attempted_at)
    VALUES (v_user_id, v_cleaned_slug, true, now());

    RETURN jsonb_build_object('success', true, 'room_id', v_room.id);
  END IF;

  -- Add to room_members with opt-in consent default false
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
  );

  -- Record successful attempt
  INSERT INTO public.join_attempts (user_id, room_slug, success, attempted_at)
  VALUES (v_user_id, v_cleaned_slug, true, now());

  RETURN jsonb_build_object('success', true, 'room_id', v_room.id);
END;
$$;

-- ============================================================================
-- 5. STRICT ROLE CHECK ON purge_room_face_data
-- ============================================================================
DROP FUNCTION IF EXISTS public.purge_room_face_data(uuid);
CREATE OR REPLACE FUNCTION public.purge_room_face_data(target_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_deleted_embeddings int;
  v_deleted_instances int;
  v_deleted_clusters int;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- Check caller is an active room member with owner or admin role
  SELECT role INTO v_role
  FROM public.room_members
  WHERE room_id = target_room_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permission denied. Not a member of the room.';
  END IF;

  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Permission denied. Only room owners and admins can purge all room face data.';
  END IF;

  -- Cancel pending processing jobs
  UPDATE public.processing_jobs pj
  SET status = 'cancelled', updated_at = now()
  FROM public.media m
  WHERE pj.media_id = m.id
    AND m.room_id = target_room_id
    AND pj.status IN ('pending', 'processing');

  -- Delete face data
  DELETE FROM public.face_embeddings WHERE room_id = target_room_id;
  GET DIAGNOSTICS v_deleted_embeddings = ROW_COUNT;

  DELETE FROM public.uncertain_matches WHERE room_id = target_room_id;
  DELETE FROM public.photo_assignments WHERE room_id = target_room_id;

  DELETE FROM public.face_instances WHERE room_id = target_room_id;
  GET DIAGNOSTICS v_deleted_instances = ROW_COUNT;

  DELETE FROM public.clusters WHERE room_id = target_room_id;
  GET DIAGNOSTICS v_deleted_clusters = ROW_COUNT;

  -- Reset room face clustering toggle
  UPDATE public.rooms
  SET face_clustering_enabled = false, updated_at = now()
  WHERE id = target_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'purged_embeddings', v_deleted_embeddings,
    'purged_instances', v_deleted_instances,
    'purged_clusters', v_deleted_clusters
  );
END;
$$;

-- ============================================================================
-- 6. MEMBER-SCOPED CONSENT WITHDRAWAL RPC
-- ============================================================================
DROP FUNCTION IF EXISTS public.withdraw_member_face_consent(uuid);
CREATE OR REPLACE FUNCTION public.withdraw_member_face_consent(target_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_deleted_embeddings int;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- Verify membership
  IF NOT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = target_room_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Permission denied. Not a member of this room.';
  END IF;

  -- Set member consent to false
  UPDATE public.room_members
  SET face_clustering_consent = false
  WHERE room_id = target_room_id AND user_id = v_user_id;

  -- Delete embeddings and instances detected on media uploaded by this user
  DELETE FROM public.face_embeddings fe
  USING public.face_instances fi, public.media m
  WHERE fe.face_instance_id = fi.id
    AND fi.media_id = m.id
    AND m.room_id = target_room_id
    AND m.uploaded_by = v_user_id;
  GET DIAGNOSTICS v_deleted_embeddings = ROW_COUNT;

  DELETE FROM public.face_instances fi
  USING public.media m
  WHERE fi.media_id = m.id
    AND m.room_id = target_room_id
    AND m.uploaded_by = v_user_id;

  -- Cancel pending processing jobs on photos uploaded by this member
  UPDATE public.processing_jobs pj
  SET status = 'cancelled', updated_at = now()
  FROM public.media m
  WHERE pj.media_id = m.id
    AND m.room_id = target_room_id
    AND m.uploaded_by = v_user_id
    AND pj.status IN ('pending', 'processing');

  RETURN jsonb_build_object(
    'success', true,
    'withdrawn_embeddings', v_deleted_embeddings
  );
END;
$$;

-- ============================================================================
-- 7. FIX assign_photo_to_cluster & resolve_uncertain_match
-- ============================================================================
DROP FUNCTION IF EXISTS public.assign_photo_to_cluster(uuid, uuid);
DROP FUNCTION IF EXISTS public.assign_photo_to_cluster(uuid, uuid, uuid, uuid);
CREATE OR REPLACE FUNCTION public.assign_photo_to_cluster(
  target_room_id uuid,
  target_media_id uuid,
  target_cluster_id uuid,
  target_face_instance_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_assignment_id uuid;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- Verify membership
  IF NOT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = target_room_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Permission denied.';
  END IF;

  -- Verify media belongs to room
  IF NOT EXISTS (
    SELECT 1 FROM public.media
    WHERE id = target_media_id AND room_id = target_room_id
  ) THEN
    RAISE EXCEPTION 'Media does not belong to the specified room.';
  END IF;

  -- Verify cluster belongs to room (if not null)
  IF target_cluster_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.clusters
    WHERE id = target_cluster_id AND room_id = target_room_id
  ) THEN
    RAISE EXCEPTION 'Cluster does not belong to the specified room.';
  END IF;

  -- Upsert photo assignment with updated_at column
  INSERT INTO public.photo_assignments (
    room_id,
    media_id,
    face_instance_id,
    cluster_id,
    assignment_level,
    assigned_by,
    updated_at
  ) VALUES (
    target_room_id,
    target_media_id,
    target_face_instance_id,
    target_cluster_id,
    'manual',
    v_user_id,
    now()
  )
  ON CONFLICT (room_id, media_id, cluster_id)
  DO UPDATE SET
    face_instance_id = EXCLUDED.face_instance_id,
    assignment_level = 'manual',
    assigned_by = v_user_id,
    updated_at = now()
  RETURNING id INTO v_assignment_id;

  RETURN jsonb_build_object('success', true, 'assignment_id', v_assignment_id);
END;
$$;

DROP FUNCTION IF EXISTS public.resolve_uncertain_match(uuid, text);
CREATE OR REPLACE FUNCTION public.resolve_uncertain_match(
  match_id uuid,
  action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_match record;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF action NOT IN ('merge', 'dismiss') THEN
    RAISE EXCEPTION 'Action must be merge or dismiss.';
  END IF;

  SELECT * INTO v_match
  FROM public.uncertain_matches
  WHERE id = match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Uncertain match not found.';
  END IF;

  IF v_match.status <> 'pending_review' THEN
    RAISE EXCEPTION 'Match has already been resolved.';
  END IF;

  -- Verify caller is room member
  IF NOT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = v_match.room_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Permission denied.';
  END IF;

  IF action = 'dismiss' THEN
    UPDATE public.uncertain_matches
    SET status = 'dismissed', reviewed_by = v_user_id, reviewed_at = now()
    WHERE id = match_id;
  ELSIF action = 'merge' THEN
    -- Reassign face instances from source_cluster_id to target_cluster_id
    UPDATE public.face_instances
    SET cluster_id = v_match.target_cluster_id
    WHERE cluster_id = v_match.source_cluster_id;

    -- Reassign photo assignments with updated_at column
    UPDATE public.photo_assignments
    SET cluster_id = v_match.target_cluster_id,
        assignment_level = 'confirmed_merge',
        assigned_by = v_user_id,
        updated_at = now()
    WHERE cluster_id = v_match.source_cluster_id;

    -- Update match record
    UPDATE public.uncertain_matches
    SET status = 'merged', reviewed_by = v_user_id, reviewed_at = now()
    WHERE id = match_id;

    -- Delete old cluster if no faces remain
    DELETE FROM public.clusters
    WHERE id = v_match.source_cluster_id
      AND NOT EXISTS (SELECT 1 FROM public.face_instances WHERE cluster_id = v_match.source_cluster_id);
  END IF;

  RETURN jsonb_build_object('success', true, 'action', action);
END;
$$;

-- ============================================================================
-- 8. HARDEN STORAGE POLICIES & TIE UPLOAD TO PENDING MEDIA ROW
-- ============================================================================
-- Drop previous policies
DROP POLICY IF EXISTS "Members can upload to room folder" ON storage.objects;
DROP POLICY IF EXISTS "Members can view room photos" ON storage.objects;
DROP POLICY IF EXISTS "Uploader or owner can delete media in room" ON storage.objects;

-- Recreate storage policies with safe regex matching and pending media validation
CREATE POLICY "Members can upload to room folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'room-media'
  AND name ~ '^rooms/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}'
  AND EXISTS (
    SELECT 1 FROM public.media m
    JOIN public.room_members rm ON rm.room_id = m.room_id
    WHERE m.storage_key = name
      AND m.uploaded_by = (SELECT auth.uid())
      AND m.upload_status = 'pending'
      AND rm.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Members can view room photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'room-media'
  AND name ~ '^rooms/[0-9a-fA-F-]{36}/'
  AND EXISTS (
    SELECT 1 FROM public.room_members rm
    WHERE rm.room_id = substring(name from '^rooms/([0-9a-fA-F-]{36})/')::uuid
      AND rm.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Uploader or owner can delete media in room"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'room-media'
  AND name ~ '^rooms/[0-9a-fA-F-]{36}/'
  AND EXISTS (
    SELECT 1 FROM public.media m
    LEFT JOIN public.room_members rm ON rm.room_id = m.room_id AND rm.user_id = (SELECT auth.uid())
    WHERE m.storage_key = name
      AND (m.uploaded_by = (SELECT auth.uid()) OR rm.role = 'owner')
  )
);

-- ============================================================================
-- 9. TAMPER-PROOF profiles.onboarding_completed VIA TRIGGER
-- ============================================================================
DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_profile_fields() CASCADE;
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.onboarding_completed IS DISTINCT FROM OLD.onboarding_completed THEN
    -- Only allow if session variable chobideh.complete_onboarding is set by the definer function
    IF current_setting('chobideh.complete_onboarding', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Field onboarding_completed cannot be updated directly.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_fields();

-- Update complete_onboarding to set session variable
DROP FUNCTION IF EXISTS public.complete_onboarding(text);
CREATE OR REPLACE FUNCTION public.complete_onboarding(display_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_cleaned_name text;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  v_cleaned_name := substring(trim(display_name) from 1 for 50);
  IF length(v_cleaned_name) = 0 THEN
    v_cleaned_name := 'Member';
  END IF;

  -- Set session flag for trigger
  PERFORM set_config('chobideh.complete_onboarding', 'true', true);

  UPDATE public.profiles
  SET
    display_name = v_cleaned_name,
    onboarding_completed = true,
    updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'display_name', v_cleaned_name,
    'onboarding_completed', true
  );
END;
$$;

-- ============================================================================
-- 10. REVOKE EXECUTE ON RPCs FROM PUBLIC AND anon
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.create_room(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_room(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.join_room(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_room(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.leave_room(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_room(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.remove_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_member(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_upload(uuid, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_upload(uuid, text, bigint) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rename_cluster(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rename_cluster(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.resolve_uncertain_match(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_uncertain_match(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.assign_photo_to_cluster(uuid, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_photo_to_cluster(uuid, uuid, uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.unassign_photo_from_cluster(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unassign_photo_from_cluster(uuid, uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.purge_room_face_data(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_room_face_data(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.withdraw_member_face_consent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_member_face_consent(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.set_room_face_consent(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_room_face_consent(uuid, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.complete_onboarding(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(text) TO authenticated;
