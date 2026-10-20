-- ==============================================================================
-- ChobiDeh pgTAP Database Security & Behavioral Tests
-- Run via: supabase test db
-- ==============================================================================
BEGIN;
SELECT plan(24);

-- 1. Extensions check
SELECT has_extension('pgcrypto', 'Extension pgcrypto must be installed for security functions');

-- 2. Tables existence check
SELECT has_table('public', 'face_embeddings', 'Table face_embeddings must exist');
SELECT has_table('public', 'join_attempts', 'Table join_attempts must exist');
SELECT has_table('public', 'room_passcodes', 'Table room_passcodes must exist for isolated hash storage');

-- 3. Schema & Column hygiene checks
SELECT has_column('public', 'photo_assignments', 'updated_at', 'Table photo_assignments must have updated_at column');
SELECT hasnt_column('public', 'rooms', 'passcode_hash', 'Table rooms must NOT expose passcode_hash column');

-- 4. RLS & Table Privileges checks (anon / authenticated zero privileges on sensitive internal tables)
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
SELECT table_privs_are(
    'public', 'room_passcodes', 'anon', ARRAY[]::text[],
    'anon has no privileges on room_passcodes'
);
SELECT table_privs_are(
    'public', 'room_passcodes', 'authenticated', ARRAY[]::text[],
    'authenticated has no privileges on room_passcodes'
);

-- 5. Function signatures exist with SECURITY DEFINER
SELECT has_function('public', 'create_room', ARRAY['text', 'text'], 'Function create_room(text, text) exists');
SELECT has_function('public', 'join_room', ARRAY['text', 'text'], 'Function join_room(text, text) exists');
SELECT has_function('public', 'purge_room_face_data', ARRAY['uuid'], 'Function purge_room_face_data(uuid) exists');
SELECT has_function('public', 'withdraw_member_face_consent', ARRAY['uuid'], 'Function withdraw_member_face_consent(uuid) exists');
SELECT has_function('public', 'create_upload', ARRAY['uuid', 'text', 'bigint'], 'Function create_upload(uuid, text, bigint) exists');
SELECT has_function('public', 'complete_onboarding', ARRAY['text'], 'Function complete_onboarding(text) exists');

-- 6. RPC Privileges: Revoked from anon
SELECT function_privs_are(
    'public', 'create_room', ARRAY['text', 'text'], 'anon', ARRAY[]::text[],
    'anon cannot execute create_room'
);
SELECT function_privs_are(
    'public', 'join_room', ARRAY['text', 'text'], 'anon', ARRAY[]::text[],
    'anon cannot execute join_room'
);
SELECT function_privs_are(
    'public', 'purge_room_face_data', ARRAY['uuid'], 'anon', ARRAY[]::text[],
    'anon cannot execute purge_room_face_data'
);
SELECT function_privs_are(
    'public', 'withdraw_member_face_consent', ARRAY['uuid'], 'anon', ARRAY[]::text[],
    'anon cannot execute withdraw_member_face_consent'
);

SELECT * FROM finish();
ROLLBACK;
