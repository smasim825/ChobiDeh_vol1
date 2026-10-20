# Database Schema (Active Schema & Three-Level Matching Specification)

This document specifies the database schema for ChobiDeh, including the finalized Three-Level Photo Matching, Grouping, and Rest Photos architecture.

---

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
- `max_photos` (int, default 1000 - room capacity cap)
- `deleted_at` (timestamptz, nullable - soft deletion)
- `created_at`, `updated_at` (timestamptz)

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
- `storage_key` (text, unique, not null - single physical storage path in Cloudflare R2)
- `thumbnail_storage_key` (text, nullable - 300x300 micro-thumbnail path)
- `content_type` (text, not null)
- `size_bytes` (bigint, not null)
- `width` (int, nullable)
- `height` (int, nullable)
- `upload_status` (`pending`, `uploaded`, `failed`, `deleted`)
- `processing_status` (`pending`, `processing`, `completed`, `failed`)
- `rest_category` (`unknown_faces`, `no_people`, `other_unassigned` - Level 3 categorization, nullable if assigned)
- `deleted_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

### `public.clusters` (Level 1 Confident Person Collections)
- `id` (uuid, pk)
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `cluster_code` (text, not null - e.g. "person_1")
- `display_name` (text, nullable - user editable name e.g. "Rafiqul")
- `thumbnail_storage_key` (text, nullable - face crop preview storage key)
- `face_count` (int, default 0)
- `created_at`, `updated_at` (timestamptz)

### `public.face_instances`
- `id` (uuid, pk)
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `media_id` (uuid, references `media.id` on delete cascade)
- `cluster_id` (uuid, nullable, references `clusters.id` on delete set null)
- `bounding_box` (jsonb, not null - normalized `{x, y, width, height}`)
- `detection_confidence` (real, not null)
- `is_identified` (boolean, default false)
- `created_at` (timestamptz)

### `public.face_embeddings` (Strictly Isolated - Internal AI Worker Only)
- `face_instance_id` (uuid, pk, references `face_instances.id` on delete cascade)
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `embedding` (`vector(512)` or `real[512]`)
- `model_version` (text, not null)
- `created_at` (timestamptz)
- *Security: RLS enabled, NO client policies, ALL privileges REVOKED from `anon` and `authenticated`.*

### `public.uncertain_matches` (Level 2 Suggestions for User Confirmation)
- `id` (uuid, pk)
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `media_id` (uuid, references `media.id` on delete cascade)
- `face_instance_id` (uuid, references `face_instances.id` on delete cascade)
- `suggested_cluster_id` (uuid, references `clusters.id` on delete cascade - initial AI suggestion)
- `candidate_clusters` (jsonb, not null - array of `{cluster_id, display_name, similarity_score}` for top candidate people)
- `similarity_score` (real, not null - score for suggested_cluster_id)
- `status` (`pending_review`, `confirmed`, `rejected`, `corrected`)
- `resolved_cluster_id` (uuid, nullable, references `clusters.id` on delete set null - if corrected A -> B)
- `reviewed_by` (uuid, nullable, references `auth.users.id` on delete set null)
- `reviewed_at` (timestamptz, nullable)
- `created_at` (timestamptz)

### `public.photo_assignments` (Many-to-Many Person Collections)
- `id` (uuid, pk)
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `media_id` (uuid, references `media.id` on delete cascade)
- `cluster_id` (uuid, not null, references `clusters.id` on delete cascade)
- `face_instance_id` (uuid, nullable, references `face_instances.id` on delete set null)
- `assignment_level` (`confident` [L1], `confirmed_suggestion` [L2], `manual` [L3])
- `is_confirmed` (boolean, default true)
- `assigned_by` (uuid, nullable, references `auth.users.id` on delete set null)
- `created_at`, `updated_at` (timestamptz)
- Unique constraint: `(media_id, cluster_id, face_instance_id)` - prevents duplicate assignment of same face instance to same person collection.

### `public.assignment_history` (Audit Log & Undo Support)
- `id` (uuid, pk)
- `room_id` (uuid, references `rooms.id` on delete cascade)
- `media_id` (uuid, references `media.id` on delete cascade)
- `face_instance_id` (uuid, nullable, references `face_instances.id` on delete set null)
- `previous_cluster_id` (uuid, nullable, references `clusters.id` on delete set null)
- `new_cluster_id` (uuid, nullable, references `clusters.id` on delete set null)
- `action` (`assigned`, `corrected`, `rejected`, `undone`)
- `performed_by` (uuid, references `auth.users.id` on delete set null)
- `details` (jsonb, nullable)
- `performed_at` (timestamptz DEFAULT NOW())

---

## Core Schema Rules & Guarantees

1. **Single Storage, Multiple Relations:**
   - `public.media` contains the only reference to the physical image storage key (`storage_key`).
   - Group photos containing multiple people have **one row** in `public.media` and **multiple rows** in `public.photo_assignments`.
2. **Explicit Disassociation of Rejections:**
   - Rejecting an uncertain match marks `public.uncertain_matches.status = 'rejected'`. It NEVER creates a fallback assignment to another candidate.
3. **Safe A → B Corrections:**
   - Correcting an assignment from Person A to Person B updates `uncertain_matches.status = 'corrected'`, sets `resolved_cluster_id = B`, inserts a confirmed row in `photo_assignments` for B, and logs the action in `assignment_history` for rollback.
4. **Rest Photos Organization:**
   - Photos with no high-confidence face assignments have `rest_category` set to:
     - `'unknown_faces'`: `face_instances` exist, but no cluster assigned.
     - `'no_people'`: zero `face_instances` detected.
     - `'other_unassigned'`: blur/processing failure.
5. **Model Non-Retraining Guarantee:**
   - `assignment_history` and `photo_assignments` exist purely at the application database layer. They do not trigger automated retraining or model weight updates.
