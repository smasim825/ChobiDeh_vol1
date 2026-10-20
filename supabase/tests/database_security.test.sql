-- ==============================================================================
-- ChobiDeh pgTAP Database Security & Isolation Tests
-- Run via: supabase test db
-- ==============================================================================
BEGIN;
SELECT plan(14);

-- 1. Extensions check
SELECT has_extension('pgcrypto', 'Extension pgcrypto must be installed for security functions');

-- 2. Tables existence check
SELECT has_table('public', 'face_embeddings', 'Table face_embeddings must exist');
SELECT has_table('public', 'join_attempts', 'Table join_attempts must exist');

-- 3. RLS Enabled checks
SELECT table_privs_are(
    'public', 'processing_jobs', 'anon', ARRAY[]::text[],
    'anon has no privileges on processing_jobs'
);
SELECT table_privs_are(
    'public', 'processing_jobs', 'authenticated', ARRAY[]::text[],
    'authenticated has no privileges on processing_jobs'
);
SELECT table_privs_are(
    'public', 'face_embeddings', 'anon', ARRAY[]::text[],
    'anon has no privileges on face_embeddings'
);
SELECT table_privs_are(
    'public', 'face_embeddings', 'authenticated', ARRAY[]::text[],
    'authenticated has no privileges on face_embeddings'
);
SELECT table_privs_are(
    'public', 'join_attempts', 'anon', ARRAY[]::text[],
    'anon has no privileges on join_attempts'
);
SELECT table_privs_are(
    'public', 'join_attempts', 'authenticated', ARRAY[]::text[],
    'authenticated has no privileges on join_attempts'
);

-- 4. Check function signatures exist with SECURITY DEFINER
SELECT has_function('public', 'create_room', ARRAY['text', 'text'], 'Function create_room(text, text) exists');
SELECT has_function('public', 'join_room', ARRAY['text', 'text'], 'Function join_room(text, text) exists');
SELECT has_function('public', 'purge_room_face_data', ARRAY['uuid'], 'Function purge_room_face_data(uuid) exists');
SELECT has_function('public', 'create_upload', ARRAY['uuid', 'text', 'bigint'], 'Function create_upload(uuid, text, bigint) exists');
SELECT has_function('public', 'complete_onboarding', ARRAY['text'], 'Function complete_onboarding(text) exists');

SELECT * FROM finish();
ROLLBACK;
