-- ==============================================================================
-- ChobiDeh Security Hardening, RLS Tightening & Consent Architecture
-- Migration: 20261021000000_security_hardening.sql
-- ==============================================================================

-- 1. Ensure pgcrypto extension is available for password hashing and random bytes
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Processing Jobs Hardening
-- ==============================================================================
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.processing_jobs FROM anon, authenticated;

-- ==============================================================================
-- 3. Isolated Face Embeddings Table (No Client Access)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.face_embeddings (
    face_instance_id UUID PRIMARY KEY REFERENCES public.face_instances(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    embedding REAL[512] CHECK (array_length(embedding, 1) = 512), -- TODO: migrate to vector(512) when pgvector extension is enabled
    model_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.face_embeddings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.face_embeddings FROM anon, authenticated;

-- Move embedding_vector out of face_instances to prevent room member leakage
ALTER TABLE public.face_instances DROP COLUMN IF EXISTS embedding_vector;

-- ==============================================================================
-- 4. Profiles Hardening & Consent Default (Opt-In False Everywhere)
-- ==============================================================================
ALTER TABLE public.profiles ALTER COLUMN face_clustering_enabled SET DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Replace permissive profile SELECT policy with self or shared-room co-members
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by self or room co-members" ON public.profiles;
CREATE POLICY "Profiles viewable by self or room co-members"
ON public.profiles FOR SELECT
TO authenticated
USING (
    id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1
        FROM public.room_members m1
        JOIN public.room_members m2 ON m1.room_id = m2.room_id
        WHERE m1.user_id = (SELECT auth.uid())
          AND m2.user_id = profiles.id
    )
);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- Hardened handle_new_user trigger function: SET search_path = '', safe parsing, false consent default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_name TEXT;
    clean_name TEXT;
    consent_val BOOLEAN := false;
BEGIN
    raw_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1));
    IF raw_name IS NULL OR trim(raw_name) = '' THEN
        clean_name := 'Member';
    ELSE
        clean_name := substring(trim(raw_name) from 1 for 50);
    END IF;

    -- Safely parse consent: default to false, only true if explicitly 'true'
    BEGIN
        IF (NEW.raw_user_meta_data->>'face_clustering_enabled') IS NOT NULL THEN
            consent_val := (NEW.raw_user_meta_data->>'face_clustering_enabled')::boolean;
        ELSE
            consent_val := false;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        consent_val := false;
    END;

    INSERT INTO public.profiles (id, display_name, face_clustering_enabled, onboarding_completed)
    VALUES (NEW.id, clean_name, consent_val, false)
    ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ==============================================================================
-- 5. Rooms & Join Flow Hardening (join_slug, passcode_hash, Rate Limiting)
-- ==============================================================================
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS join_slug TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS face_clustering_enabled BOOLEAN NOT NULL DEFAULT false;

-- Populate join_slug for any existing rooms
UPDATE public.rooms
SET join_slug = lower(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12))
WHERE join_slug IS NULL;

ALTER TABLE public.rooms ALTER COLUMN join_slug SET NOT NULL;
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS uq_rooms_join_slug;
ALTER TABLE public.rooms ADD CONSTRAINT uq_rooms_join_slug UNIQUE (join_slug);

-- Rename join_code_hash to passcode_hash and make it nullable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'join_code_hash'
    ) THEN
        ALTER TABLE public.rooms RENAME COLUMN join_code_hash TO passcode_hash;
    END IF;
END $$;
ALTER TABLE public.rooms ALTER COLUMN passcode_hash DROP NOT NULL;

-- Fix ON DELETE behavior so deleting a user does not block auth.users deletion
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_created_by_fkey;
ALTER TABLE public.rooms ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Per-room face clustering consent in room_members
ALTER TABLE public.room_members ADD COLUMN IF NOT EXISTS face_clustering_consent BOOLEAN NOT NULL DEFAULT false;

-- Rate-limiting table for room join attempts
CREATE TABLE IF NOT EXISTS public.join_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    room_slug TEXT NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    success BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.join_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.join_attempts FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_join_attempts_user_time ON public.join_attempts (user_id, attempted_at DESC);

-- Update is_room_member with SET search_path = '' and (SELECT auth.uid())
CREATE OR REPLACE FUNCTION public.is_room_member(check_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.room_members
        WHERE room_id = check_room_id AND user_id = (SELECT auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update handle_new_room with SET search_path = ''
CREATE OR REPLACE FUNCTION public.handle_new_room()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.room_members (room_id, user_id, role, face_clustering_consent)
    VALUES (NEW.id, NEW.created_by, 'owner', false)
    ON CONFLICT (room_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix Rooms SELECT RLS policy
DROP POLICY IF EXISTS "Rooms viewable by active members" ON public.rooms;
CREATE POLICY "Rooms viewable by active members"
ON public.rooms FOR SELECT
TO authenticated
USING ((public.is_room_member(id) OR created_by = (SELECT auth.uid())) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Rooms updatable by owner or admin" ON public.rooms;
CREATE POLICY "Rooms updatable by owner or admin"
ON public.rooms FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.room_members
        WHERE room_id = rooms.id AND user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.room_members
        WHERE room_id = rooms.id AND user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin')
    )
);

-- RPC: create_room
CREATE OR REPLACE FUNCTION public.create_room(
    room_name TEXT,
    passcode TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_room_id UUID;
    v_slug TEXT;
    v_passcode_hash TEXT := NULL;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF room_name IS NULL OR char_length(trim(room_name)) < 2 OR char_length(trim(room_name)) > 80 THEN
        RAISE EXCEPTION 'Room name must be between 2 and 80 characters';
    END IF;

    -- Generate random URL-safe slug >= 10 chars
    LOOP
        v_slug := lower(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.rooms WHERE join_slug = v_slug);
    END LOOP;

    IF passcode IS NOT NULL AND trim(passcode) <> '' THEN
        v_passcode_hash := extensions.crypt(passcode, extensions.gen_salt('bf', 10));
    END IF;

    INSERT INTO public.rooms (name, created_by, join_slug, passcode_hash, face_clustering_enabled)
    VALUES (trim(room_name), v_user_id, v_slug, v_passcode_hash, false)
    RETURNING id INTO v_room_id;

    -- Ensure creator is owner
    INSERT INTO public.room_members (room_id, user_id, role, face_clustering_consent)
    VALUES (v_room_id, v_user_id, 'owner', false)
    ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'owner';

    RETURN jsonb_build_object(
        'id', v_room_id,
        'name', trim(room_name),
        'join_slug', v_slug
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- RPC: join_room
CREATE OR REPLACE FUNCTION public.join_room(
    slug TEXT,
    passcode TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_room RECORD;
    v_failure_count INT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Rate-limit: max 5 failures per user in last 10 minutes
    SELECT COUNT(*) INTO v_failure_count
    FROM public.join_attempts
    WHERE user_id = v_user_id
      AND attempted_at > timezone('utc', now()) - interval '10 minutes'
      AND success = false;

    IF v_failure_count >= 5 THEN
        RAISE EXCEPTION 'Invalid join request or incorrect passcode.';
    END IF;

    -- Find room by slug
    SELECT id, passcode_hash, deleted_at
    INTO v_room
    FROM public.rooms
    WHERE join_slug = lower(trim(slug))
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
        INSERT INTO public.join_attempts (user_id, room_slug, success)
        VALUES (v_user_id, lower(trim(slug)), false);
        RAISE EXCEPTION 'Invalid join request or incorrect passcode.';
    END IF;

    -- Verify passcode if room has one set
    IF v_room.passcode_hash IS NOT NULL THEN
        IF passcode IS NULL OR extensions.crypt(passcode, v_room.passcode_hash) <> v_room.passcode_hash THEN
            INSERT INTO public.join_attempts (user_id, room_slug, success)
            VALUES (v_user_id, lower(trim(slug)), false);
            RAISE EXCEPTION 'Invalid join request or incorrect passcode.';
        END IF;
    END IF;

    -- Success: insert member if not already a member
    INSERT INTO public.room_members (room_id, user_id, role, face_clustering_consent)
    VALUES (v_room.id, v_user_id, 'member', false)
    ON CONFLICT (room_id, user_id) DO NOTHING;

    INSERT INTO public.join_attempts (user_id, room_slug, success)
    VALUES (v_user_id, lower(trim(slug)), true);

    RETURN jsonb_build_object(
        'room_id', v_room.id,
        'joined', true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- RPC: leave_room
CREATE OR REPLACE FUNCTION public.leave_room(target_room_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_role TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT role INTO v_role
    FROM public.room_members
    WHERE room_id = target_room_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'You are not a member of this room';
    END IF;

    IF v_role = 'owner' THEN
        RAISE EXCEPTION 'Owner cannot leave room without transferring ownership or deleting the room.';
    END IF;

    DELETE FROM public.room_members
    WHERE room_id = target_room_id AND user_id = v_user_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- RPC: remove_member
CREATE OR REPLACE FUNCTION public.remove_member(target_room_id UUID, target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_target_role TEXT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF v_caller_id = target_user_id THEN
        RAISE EXCEPTION 'Cannot remove yourself using remove_member; use leave_room instead';
    END IF;

    SELECT role INTO v_caller_role
    FROM public.room_members
    WHERE room_id = target_room_id AND user_id = v_caller_id;

    IF v_caller_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Permission denied: owner or admin role required';
    END IF;

    SELECT role INTO v_target_role
    FROM public.room_members
    WHERE room_id = target_room_id AND user_id = target_user_id;

    IF NOT FOUND THEN
        RETURN true;
    END IF;

    IF v_target_role = 'owner' THEN
        RAISE EXCEPTION 'Cannot remove the room owner';
    END IF;

    IF v_caller_role = 'admin' AND v_target_role = 'admin' THEN
        RAISE EXCEPTION 'Admins cannot remove other admins';
    END IF;

    DELETE FROM public.room_members
    WHERE room_id = target_room_id AND user_id = target_user_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ==============================================================================
-- 6. Media Hardening & Storage Access
-- ==============================================================================
-- Allow uploaded_by to be SET NULL when a user is deleted
ALTER TABLE public.media DROP CONSTRAINT IF EXISTS media_uploaded_by_fkey;
ALTER TABLE public.media ALTER COLUMN uploaded_by DROP NOT NULL;
ALTER TABLE public.media ADD CONSTRAINT media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Strict INSERT policy: client may only insert with pending status and scoped storage_key
DROP POLICY IF EXISTS "Media insertable by room members" ON public.media;
CREATE POLICY "Media insertable by room members"
ON public.media FOR INSERT
TO authenticated
WITH CHECK (
    public.is_room_member(room_id)
    AND uploaded_by = (SELECT auth.uid())
    AND upload_status = 'pending'
    AND processing_status = 'pending'
    AND storage_key LIKE ('rooms/' || room_id || '/%')
);

-- Media soft delete path for uploader or room owner/admin
DROP POLICY IF EXISTS "Media soft deletable by uploader or room admin" ON public.media;
CREATE POLICY "Media soft deletable by uploader or room admin"
ON public.media FOR UPDATE
TO authenticated
USING (
    public.is_room_member(room_id)
    AND (
        uploaded_by = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.room_members rm
            WHERE rm.room_id = media.room_id
              AND rm.user_id = (SELECT auth.uid())
              AND rm.role IN ('owner', 'admin')
        )
    )
)
WITH CHECK (deleted_at IS NOT NULL);

-- RPC: create_upload (Server generates storage key: rooms/<room_id>/<uuid>)
CREATE OR REPLACE FUNCTION public.create_upload(
    target_room_id UUID,
    content_type TEXT,
    size_bytes BIGINT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_media_id UUID;
    v_storage_key TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT public.is_room_member(target_room_id) THEN
        RAISE EXCEPTION 'Access denied: not a member of this room';
    END IF;

    IF content_type NOT IN ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif') THEN
        RAISE EXCEPTION 'Unsupported content type';
    END IF;

    IF size_bytes <= 0 OR size_bytes > 26214400 THEN
        RAISE EXCEPTION 'File size must be between 1 byte and 25MB';
    END IF;

    v_media_id := extensions.gen_random_uuid();
    v_storage_key := 'rooms/' || target_room_id::text || '/' || v_media_id::text;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Storage policies for private 'room-media' bucket
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
                owner = (SELECT auth.uid())
                OR EXISTS (
                    SELECT 1 FROM public.room_members rm
                    WHERE rm.room_id = (split_part(name, '/', 2))::uuid
                      AND rm.user_id = (SELECT auth.uid())
                      AND rm.role IN ('owner', 'admin')
                )
            )
        );
    END IF;
END $$;

-- ==============================================================================
-- 7. Cluster & Uncertain Match Hardening (RPC-Only Writes)
-- ==============================================================================
DROP POLICY IF EXISTS "Clusters editable by room members" ON public.room_person_clusters;
DROP POLICY IF EXISTS "Uncertain matches updatable by room members" ON public.uncertain_matches;

-- Storage key for thumbnails rather than permanent URLs
ALTER TABLE public.room_person_clusters ADD COLUMN IF NOT EXISTS thumbnail_face_key TEXT;
ALTER TABLE public.room_person_clusters DROP COLUMN IF EXISTS thumbnail_face_url;

-- Add face_instance_id to photo_assignments
ALTER TABLE public.photo_assignments ADD COLUMN IF NOT EXISTS face_instance_id UUID REFERENCES public.face_instances(id) ON DELETE CASCADE;

-- RPC: rename_cluster
CREATE OR REPLACE FUNCTION public.rename_cluster(
    target_cluster_id UUID,
    new_display_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_room_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT room_id INTO v_room_id
    FROM public.room_person_clusters
    WHERE id = target_cluster_id AND deleted_at IS NULL;

    IF NOT FOUND OR NOT public.is_room_member(v_room_id) THEN
        RAISE EXCEPTION 'Access denied or cluster not found';
    END IF;

    UPDATE public.room_person_clusters
    SET display_name = substring(trim(new_display_name) from 1 for 50)
    WHERE id = target_cluster_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- RPC: resolve_uncertain_match
CREATE OR REPLACE FUNCTION public.resolve_uncertain_match(
    match_id UUID,
    action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_match RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF action NOT IN ('merge', 'dismiss') THEN
        RAISE EXCEPTION 'Invalid action: must be merge or dismiss';
    END IF;

    SELECT * INTO v_match
    FROM public.uncertain_matches
    WHERE id = match_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match not found';
    END IF;

    IF NOT public.is_room_member(v_match.room_id) THEN
        RAISE EXCEPTION 'Access denied: not a member of this room';
    END IF;

    IF v_match.status <> 'pending_review' THEN
        RAISE EXCEPTION 'Match has already been resolved';
    END IF;

    IF action = 'merge' THEN
        -- Reassign face instances from source cluster to target cluster
        UPDATE public.face_instances
        SET cluster_id = v_match.target_cluster_id
        WHERE cluster_id = v_match.source_cluster_id
          AND room_id = v_match.room_id;

        -- Record confirmed merge assignment
        INSERT INTO public.photo_assignments (
            media_id, cluster_id, assignment_level, assigned_by
        )
        VALUES (
            v_match.candidate_media_id, v_match.target_cluster_id, 'level_2_confirmed_merge', v_user_id
        )
        ON CONFLICT (media_id, cluster_id) DO UPDATE
        SET assignment_level = 'level_2_confirmed_merge',
            assigned_by = v_user_id,
            updated_at = timezone('utc', now());

        UPDATE public.uncertain_matches
        SET status = 'merged',
            reviewed_by = v_user_id,
            reviewed_at = timezone('utc', now())
        WHERE id = match_id;
    ELSE
        UPDATE public.uncertain_matches
        SET status = 'dismissed',
            reviewed_by = v_user_id,
            reviewed_at = timezone('utc', now())
        WHERE id = match_id;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- RPC: assign_photo_to_cluster
CREATE OR REPLACE FUNCTION public.assign_photo_to_cluster(
    target_media_id UUID,
    target_cluster_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_media_room UUID;
    v_cluster_room UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT room_id INTO v_media_room FROM public.media WHERE id = target_media_id AND deleted_at IS NULL;
    SELECT room_id INTO v_cluster_room FROM public.room_person_clusters WHERE id = target_cluster_id AND deleted_at IS NULL;

    IF v_media_room IS NULL OR v_cluster_room IS NULL OR v_media_room <> v_cluster_room THEN
        RAISE EXCEPTION 'Media and cluster must exist and belong to the same room';
    END IF;

    IF NOT public.is_room_member(v_media_room) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    INSERT INTO public.photo_assignments (
        media_id, cluster_id, assignment_level, assigned_by
    )
    VALUES (
        target_media_id, target_cluster_id, 'level_3_manual', v_user_id
    )
    ON CONFLICT (media_id, cluster_id) DO UPDATE
    SET assignment_level = 'level_3_manual',
        assigned_by = v_user_id,
        updated_at = timezone('utc', now());

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- RPC: unassign_photo_from_cluster
CREATE OR REPLACE FUNCTION public.unassign_photo_from_cluster(
    target_media_id UUID,
    target_cluster_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_media_room UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT room_id INTO v_media_room FROM public.media WHERE id = target_media_id;
    IF v_media_room IS NULL OR NOT public.is_room_member(v_media_room) THEN
        RAISE EXCEPTION 'Access denied or media not found';
    END IF;

    DELETE FROM public.photo_assignments
    WHERE media_id = target_media_id AND cluster_id = target_cluster_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ==============================================================================
-- 8. Purge & Consent Withdrawal RPCs
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.purge_room_face_data(target_room_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_role TEXT;
    v_deleted_embeddings INT := 0;
    v_deleted_instances INT := 0;
    v_deleted_clusters INT := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT role INTO v_role
    FROM public.room_members
    WHERE room_id = target_room_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Access denied: not a room member';
    END IF;

    -- Delete embeddings for room
    DELETE FROM public.face_embeddings WHERE room_id = target_room_id;
    GET DIAGNOSTICS v_deleted_embeddings = ROW_COUNT;

    -- Delete uncertain matches
    DELETE FROM public.uncertain_matches WHERE room_id = target_room_id;

    -- Delete photo assignments
    DELETE FROM public.photo_assignments
    WHERE media_id IN (SELECT id FROM public.media WHERE room_id = target_room_id);

    -- Delete face instances
    DELETE FROM public.face_instances WHERE room_id = target_room_id;
    GET DIAGNOSTICS v_deleted_instances = ROW_COUNT;

    -- Delete clusters
    DELETE FROM public.room_person_clusters WHERE room_id = target_room_id;
    GET DIAGNOSTICS v_deleted_clusters = ROW_COUNT;

    -- Cancel pending and processing background jobs for this room
    UPDATE public.processing_jobs
    SET status = 'failed',
        last_error_code = 'PURGED_BY_USER',
        updated_at = timezone('utc', now())
    WHERE media_id IN (SELECT id FROM public.media WHERE room_id = target_room_id)
      AND status IN ('pending', 'processing');

    RETURN jsonb_build_object(
        'room_id', target_room_id,
        'deleted_embeddings', v_deleted_embeddings,
        'deleted_instances', v_deleted_instances,
        'deleted_clusters', v_deleted_clusters,
        'purged', true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.set_room_face_consent(
    target_room_id UUID,
    consent BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    UPDATE public.room_members
    SET face_clustering_consent = COALESCE(consent, false)
    WHERE room_id = target_room_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room membership not found';
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- RPC: complete_onboarding (sets profiles.onboarding_completed via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.complete_onboarding(display_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_clean_name TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF display_name IS NULL OR trim(display_name) = '' THEN
        RAISE EXCEPTION 'Display name is required';
    END IF;

    v_clean_name := substring(trim(display_name) from 1 for 50);

    UPDATE public.profiles
    SET display_name = v_clean_name,
        onboarding_completed = true,
        updated_at = timezone('utc', now())
    WHERE id = v_user_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ==============================================================================
-- 9. Hygiene & Query Performance Compound Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_face_instances_room_cluster ON public.face_instances (room_id, cluster_id);
CREATE INDEX IF NOT EXISTS idx_face_instances_media ON public.face_instances (media_id);
CREATE INDEX IF NOT EXISTS idx_photo_assignments_cluster ON public.photo_assignments (cluster_id);
CREATE INDEX IF NOT EXISTS idx_uncertain_matches_source ON public.uncertain_matches (source_cluster_id);
CREATE INDEX IF NOT EXISTS idx_uncertain_matches_target ON public.uncertain_matches (target_cluster_id);
CREATE INDEX IF NOT EXISTS idx_uncertain_matches_media ON public.uncertain_matches (candidate_media_id);
