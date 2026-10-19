# Database Schema (Conceptual Draft)

This is a logical starting point, not a final migration. Review relationships, constraints, retention, and indexes before implementation.

## Proposed entities

### `users`
- `id`
- `email` or provider identity reference
- `display_name`
- `avatar_object_key` (optional)
- `created_at`, `updated_at`, `deleted_at`

### `user_preferences`
- `id`
- `user_id`
- `face_clustering_enabled` (boolean)
- `updated_at`

### `rooms`
- `id`
- `name`
- `created_by`
- `join_credential_hash`
- `created_at`, `updated_at`, `deleted_at`

### `room_members`
- `room_id`
- `user_id`
- `role` (`owner`, `member`, future roles as approved)
- `joined_at`
- unique constraint on `(room_id, user_id)`

### `media`
- `id`
- `room_id`
- `uploaded_by`
- `object_key`
- `content_type`
- `size_bytes`
- `checksum` (optional)
- `upload_status`
- `processing_status`
- `created_at`, `deleted_at`

### `room_person_clusters` (Level 1 Confident Clustering)
- `id`
- `room_id`
- `cluster_code` (e.g. "person-1", "person-2")
- `display_name` (optional user-assigned name e.g. "Rafiqul", "Samira")
- `created_at`, `deleted_at`
- Scoped strictly to the room.

### `face_instances`
- `id`
- `media_id`
- `cluster_id` nullable (null indicates Level 3 Unsorted)
- bounding box coordinates
- `embedding_vector` (protected/encrypted vector or reference)
- `confidence_score`
- `model_version`
- `created_at`

### `uncertain_matches` (Level 2 Suggestions)
- `id`
- `room_id`
- `source_cluster_id`
- `target_cluster_id` (or `face_instance_id`)
- `similarity_score`
- `status` (`pending_review`, `merged`, `dismissed`)
- `reviewed_by` nullable
- `reviewed_at` nullable
- `created_at`

### `photo_assignments`
- `id`
- `media_id`
- `cluster_id` nullable (nullable = Level 3 Unsorted)
- `assignment_level` (`level_1_confident`, `level_2_confirmed_merge`, `level_3_manual`)
- `assigned_by` nullable (null for automatic Level 1 clustering)
- `created_at`, `updated_at`
- unique constraint on `(media_id, cluster_id)`

### `processing_jobs`
- `id`
- `media_id`
- `job_type`
- `status`
- `attempt_count`
- `last_error_code` (not sensitive payload)
- `created_at`, `updated_at`

## Rules
- Every protected query must be scoped to authorized room membership.
- Use foreign keys and deletion policies deliberately.
- Do not store image bytes in these rows by default.
- Never use a face template as a user login credential.
- Keep a photo's room and uploader immutable unless an explicit transfer flow is designed.
- Decide whether room deletion removes media immediately or enters a documented deletion workflow.
- Add indexes based on measured query patterns, including room/time pagination.
