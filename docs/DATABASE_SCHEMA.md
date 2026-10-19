# Database Schema (Conceptual Draft)

This is a logical starting point, not a final migration. Review relationships, constraints, retention, and indexes before implementation.

## Proposed entities

### `users`
- `id`
- `email` or provider identity reference
- `display_name`
- `avatar_object_key` (optional)
- `created_at`, `updated_at`, `deleted_at`

### `biometric_consents`
- `id`
- `user_id`
- `purpose`
- `policy_version`
- `consented_at`
- `withdrawn_at`
- Avoid storing more consent data than needed.

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

### `room_people`
- `id`
- `room_id`
- `display_label` or member reference when confirmed
- `created_by` / confirmation metadata
- `created_at`, `deleted_at`
- Keep identity scope room-specific initially.

### `face_templates` (sensitive)
- `id`
- `room_person_id`
- `user_id` or consent subject reference
- encrypted embedding representation or protected reference
- `model_version`
- `created_at`, `deleted_at`
- Strictly restrict access; decide whether to store embeddings or recompute them.

### `face_instances`
- `id`
- `media_id`
- face bounding box and minimal processing metadata
- `room_person_id` nullable
- `match_status`
- `model_version`
- Avoid storing unnecessary crops or raw biometric data.

### `photo_assignments`
- `id`
- `media_id`
- `room_person_id`
- `decision_source` (`automatic`, `suggested_confirmed`, `manual`)
- `confidence_band` or validated score metadata
- `created_by` nullable for automatic assignments
- `created_at`, `updated_at`
- unique constraint appropriate to `(media_id, room_person_id)`

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
