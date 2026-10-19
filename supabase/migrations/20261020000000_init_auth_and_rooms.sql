-- ==============================================================================
-- ChobiDeh Production Schema & Supabase Auth Integration
-- Migration: 20261020000000_init_auth_and_rooms.sql
-- ==============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. User Profiles (Synced automatically with Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL CHECK (char_length(display_name) <= 50),
    avatar_url TEXT,
    face_clustering_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Trigger to automatically create public.profiles on new auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, face_clustering_enabled)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'face_clustering_enabled')::boolean, true)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. Rooms & Multi-Tenant Membership
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 80),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    join_code_hash TEXT NOT NULL, -- Hashed room join code (e.g. Argon2id / crypt)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.room_members (
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY (room_id, user_id)
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Helper security function: Check membership
CREATE OR REPLACE FUNCTION public.is_room_member(check_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.room_members
        WHERE room_id = check_room_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Room RLS Policies
CREATE POLICY "Rooms viewable by active members"
ON public.rooms FOR SELECT
TO authenticated
USING (public.is_room_member(id) AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can create rooms"
ON public.rooms FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Room members viewable by fellow members"
ON public.room_members FOR SELECT
TO authenticated
USING (public.is_room_member(room_id));

-- Trigger: When room is created, automatically add creator as 'owner'
CREATE OR REPLACE FUNCTION public.handle_new_room()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.room_members (room_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_room_created ON public.rooms;
CREATE TRIGGER on_room_created
    AFTER INSERT ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_room();

-- ==============================================================================
-- 4. Media & Photos
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

CREATE POLICY "Media viewable by room members"
ON public.media FOR SELECT
TO authenticated
USING (public.is_room_member(room_id) AND deleted_at IS NULL);

CREATE POLICY "Media insertable by room members"
ON public.media FOR INSERT
TO authenticated
WITH CHECK (public.is_room_member(room_id) AND uploaded_by = auth.uid());

-- ==============================================================================
-- 5. 3-Level AI Face Clustering Entities
-- ==============================================================================
-- Level 1: Anonymous Person Collections
CREATE TABLE IF NOT EXISTS public.room_person_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    cluster_code TEXT NOT NULL, -- e.g. "person-1"
    display_name TEXT, -- user-assigned name e.g. "Rafiqul"
    thumbnail_face_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_room_cluster_code UNIQUE (room_id, cluster_code)
);

ALTER TABLE public.room_person_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clusters viewable by room members"
ON public.room_person_clusters FOR SELECT
TO authenticated
USING (public.is_room_member(room_id));

CREATE POLICY "Clusters editable by room members"
ON public.room_person_clusters FOR UPDATE
TO authenticated
USING (public.is_room_member(room_id));

-- Internal Face Instances
CREATE TABLE IF NOT EXISTS public.face_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES public.room_person_clusters(id) ON DELETE SET NULL,
    bounding_box JSONB NOT NULL,
    embedding_vector REAL[512],
    confidence_score REAL NOT NULL,
    model_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.face_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Face instances viewable by room members"
ON public.face_instances FOR SELECT
TO authenticated
USING (public.is_room_member(room_id));

-- Photo Cluster Assignments (Level 1, 2, or 3)
CREATE TABLE IF NOT EXISTS public.photo_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES public.room_person_clusters(id) ON DELETE CASCADE,
    assignment_level TEXT NOT NULL CHECK (assignment_level IN ('level_1_confident', 'level_2_confirmed_merge', 'level_3_manual')),
    assigned_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_media_cluster UNIQUE (media_id, cluster_id)
);

ALTER TABLE public.photo_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assignments viewable by room members"
ON public.photo_assignments FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.media m WHERE m.id = media_id AND public.is_room_member(m.room_id)));

-- Level 2: Uncertain Matches (Human Review Queue)
CREATE TABLE IF NOT EXISTS public.uncertain_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    source_cluster_id UUID NOT NULL REFERENCES public.room_person_clusters(id) ON DELETE CASCADE,
    target_cluster_id UUID NOT NULL REFERENCES public.room_person_clusters(id) ON DELETE CASCADE,
    candidate_media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
    similarity_score REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'merged', 'dismissed')),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.uncertain_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Uncertain matches viewable by room members"
ON public.uncertain_matches FOR SELECT
TO authenticated
USING (public.is_room_member(room_id));

CREATE POLICY "Uncertain matches updatable by room members"
ON public.uncertain_matches FOR UPDATE
TO authenticated
USING (public.is_room_member(room_id));

-- ==============================================================================
-- 6. Background Queue for Worker
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL DEFAULT 'ai_pipeline',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    last_error_code TEXT,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 7. Performance Indexes (Keyset pagination, queue seeks)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_media_room_timeline 
ON public.media (room_id, created_at DESC, id DESC) 
WHERE deleted_at IS NULL AND upload_status = 'uploaded';

CREATE UNIQUE INDEX IF NOT EXISTS idx_room_members_lookup 
ON public.room_members (room_id, user_id);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_queue 
ON public.processing_jobs (status, attempt_count, created_at ASC) 
WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_uncertain_matches_pending 
ON public.uncertain_matches (room_id, status) 
WHERE status = 'pending_review';
