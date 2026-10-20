# ChobiDeh Database Architecture & Migrations

This directory contains the database migrations, security hardening scripts, and pgTAP automated test suites for ChobiDeh.

## Migration Files

1. `migrations/20261020000000_init_auth_and_rooms.sql`
   - Initial foundational schema: profiles, rooms, room_members, media, 3-level face clustering tables, and processing_jobs.
2. `migrations/20261021000000_security_hardening.sql`
   - Security hardening:
     - Isolates raw embeddings into `face_embeddings` table with client access revoked.
     - Enables RLS on `processing_jobs` and `join_attempts` with client access revoked.
     - Implements public random `join_slug` (>=10 chars) and bcrypt-hashed room passcode semantics.
     - Implements SECURITY DEFINER RPCs (`create_room`, `join_room`, `leave_room`, `remove_member`, `create_upload`, `purge_room_face_data`, `set_room_face_consent`, `rename_cluster`, `resolve_uncertain_match`, `assign_photo_to_cluster`, `unassign_photo_from_cluster`, `complete_onboarding`).
     - Tightens `profiles` SELECT policy to self or room co-members.
     - Defaults face clustering consent to `false` everywhere (opt-in).
     - Fixes ON DELETE foreign keys on `rooms.created_by` and `media.uploaded_by` to `ON DELETE SET NULL` so user account deletion cannot fail.

## Running Database Tests (pgTAP)

Database tests are written using PostgreSQL `pgTAP` and located in `supabase/tests/`.

### Prerequisites
- Supabase CLI installed:
  ```bash
  brew install supabase/tap/supabase
  # or
  npm install -g supabase
  ```
- Docker Desktop running.

### Execution Command
To start the local stack and run all pgTAP tests:
```bash
supabase test db
```

To reset the database and re-apply all migrations from scratch:
```bash
supabase db reset
```
