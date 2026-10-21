-- ==============================================================================
-- ChobiDeh: Clean Wipe of All Rooms & Media Data
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/arogfjfaakgbjtxtlvlj/sql/new
-- ==============================================================================

-- 1. Remove all photo images from storage bucket
DELETE FROM storage.objects
WHERE bucket_id = 'room-media';

-- 2. Remove all background processing jobs
DELETE FROM public.processing_jobs;

-- 3. Remove all AI biometric embeddings, face instances, and person clusters
DELETE FROM public.face_embeddings;
DELETE FROM public.face_instances;
DELETE FROM public.room_person_clusters;

-- 4. Remove all room media records
DELETE FROM public.media;

-- 5. Remove all room passcodes and failed join rate-limit attempts
DELETE FROM public.join_attempts;
DELETE FROM public.room_passcodes;

-- 6. Remove all room memberships
DELETE FROM public.room_members;

-- 7. Remove all rooms
DELETE FROM public.rooms;
