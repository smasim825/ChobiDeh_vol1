# Database Schema (Conceptual Draft)

This is a logical starting point, not a final migration. Review relationships, constraints, retention, and indexes before implementation.

## Entities (Active Schema)

### `public.profiles`
- `id` (uuid, pk, references `auth.users.id` on delete cascade)
- `display_name` (varchar(50), not null, sanitized default 'Member')
- `avatar_storage_key` (text, nullable)
- `face_clustering_enabled` (boolean, default false - user's global default preference)
- `onboarding_completed` (boolean, default false - set only via `complete_onboarding` RPC)
- `created_at`, `updated_at` (timestamptz)

### `public.rooms`
- `id` (uuid, pk)
- `name` (text, not null)
- `join_slug` (text, unique, not null - 12 char cryptographic hex identifier)
- `created_by` (uuid, references `auth.users.id` on delete set null)
- `face_clustering_enabled` (boolean, default false - room owner control)
- `deleted_at` (timestamptz, nullable - soft deletion)
- `created_at`, `updated_at` (timestamptz)
- *(Note: room passcode hashes are isolated in `public.room_passcodes` to prevent exposure)*

### `public.room_passcodes` (Strictly Isolated - Internal Authentication Only)
- `room_id` (uuid, pk, references `rooms.id` on delete cascade)
- `passcode_hash` (text, not null - bcrypt hash of room passcode)
- `created_at` (timestamptz)
- *Security: RLS enabled, NO client policies, ALL privileges REVOKED from `anon` and `authenticated`.*

### `public.room_members`
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `user_id` (uuid, references `auth.users.id` on delete cascade)
- `role` (`owner`, `admin`, `member`)
- `face_clustering_consent` (boolean, default false - member's per-room opt-in consent)
- `joined_at` (timestamptz)
- Primary key: `(room_id, user_id)`

### `public.media`
- `id` (uuid, pk)
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `uploaded_by` (uuid, references `auth.users.id` on delete set null)
- `storage_key` (text, unique, not null - format: `rooms/<room_id>/<uuid>`)
- `content_type` (text, not null)
- `size_bytes` (bigint, not null)
- `upload_status` (`pending`, `uploaded`, `failed`, `deleted`)
- `processing_status` (`pending`, `processing`, `completed`, `failed`)
- `deleted_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

### `public.clusters` (Level 1 Confident Person Collections)
- `id` (uuid, pk)
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `cluster_code` (text, not null)
- `display_name` (text, nullable - editable user label)
- `thumbnail_storage_key` (text, nullable - private storage path, no permanent URLs)
- `face_count` (int, default 0)
- `created_at`, `updated_at` (timestamptz)

### `public.face_instances`
- `id` (uuid, pk)
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `media_id` (uuid, references `media.id` on delete cascade)
- `cluster_id` (uuid, nullable, references `clusters.id` on delete set null)
- `bounding_box` (jsonb, not null - normalized {x, y, width, height})
- `detection_confidence` (real, not null)
- `created_at` (timestamptz)
- *(Note: embeddings are strictly isolated in `face_embeddings` table)*

### `public.face_embeddings` (Strictly Isolated - Internal AI Worker Only)
- `face_instance_id` (uuid, pk, references `face_instances.id` on delete cascade)
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `embedding` (`vector(512)` if pgvector available, or `real[]` with check length = 512)
- `model_version` (text, not null)
- `created_at` (timestamptz)
- *Security: RLS enabled, NO client policies, ALL privileges REVOKED from `anon` and `authenticated`.*

### `public.uncertain_matches` (Level 2 Suggestions for User Confirmation)
- `id` (uuid, pk)
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `source_cluster_id` (uuid, references `clusters.id` on delete cascade)
- `target_cluster_id` (uuid, references `clusters.id` on delete cascade)
- `similarity_score` (real, not null)
- `status` (`pending_review`, `merged`, `dismissed`)
- `reviewed_by` (uuid, nullable, references `auth.users.id` on delete set null)
- `reviewed_at` (timestamptz, nullable)
- `created_at` (timestamptz)

### `public.photo_assignments`
- `id` (uuid, pk)
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `media_id` (uuid, references `media.id` on delete cascade)
- `face_instance_id` (uuid, nullable, references `face_instances.id` on delete set null)
- `cluster_id` (uuid, nullable, references `clusters.id` on delete set null - null = unsorted)
- `assignment_level` (`confident` [L1], `confirmed_merge` [L2], `manual` [L3])
- `assigned_by` (uuid, nullable, references `auth.users.id` on delete set null)
- `created_at`, `updated_at` (timestamptz)

### `public.processing_jobs` (Internal Background Processing Queue)
- `id` (uuid, pk)
- `media_id` (uuid, references `media.id` on delete cascade)
- `job_type` (`face_detection`, `embedding_extraction`, `clustering`)
- `status` (`pending`, `processing`, `completed`, `failed`, `cancelled`)
- `attempts` (int, default 0)
- `error_message` (text, nullable)
- `created_at`, `updated_at` (timestamptz)
- *Security: RLS enabled, NO client policies, ALL privileges REVOKED from `anon` and `authenticated`.*

### `public.join_attempts` (Rate Limiting)
- `id` (uuid, pk)
- `user_id` (uuid, references `auth.users.id` on delete cascade)
- `room_slug` (text, not null)
- `success` (boolean, not null)
- `attempted_at` (timestamptz)
- *Security: RLS enabled, NO client policies, ALL privileges REVOKED from `anon` and `authenticated`.*

## Rules
- Every protected query must be scoped to authorized room membership.
- Use foreign keys and deletion policies deliberately.
- Do not store image bytes in these rows by default.
- Never use a face template as a user login credential.
- Keep a photo's room and uploader immutable unless an explicit transfer flow is designed.
- Decide whether room deletion removes media immediately or enters a documented deletion workflow.
- Add indexes based on measured query patterns, including room/time pagination.
