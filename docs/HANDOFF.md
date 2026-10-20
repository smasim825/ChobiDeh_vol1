# Agent and Teammate Handoff

Update this file when starting or handing off a multi-file task. Keep entries short and current.

## Active work
- Task: Fix SQLSTATE 42P13 in 20261022000000 migration for Supabase CI
  - Owner: Senior Full-Stack Engineer
  - Status: In progress
  - Branch: `fix/ci-migration-return-type`
  - Scope: Added `DROP FUNCTION IF EXISTS` statements before replacing functions in `20261022000000_review_round_2_fixes.sql` (`resolve_uncertain_match`, `assign_photo_to_cluster`, `create_room`, `join_room`, `purge_room_face_data`, etc.) to prevent Postgres error 42P13 ("cannot change return type of existing function") during `supabase start` migration playback.
  - Files modified: `supabase/migrations/20261022000000_review_round_2_fixes.sql`, `docs/HANDOFF.md`.
  - Tests run: 22/22 Vitest tests passed, `oxlint` 0 errors / 0 warnings, `tsc -b` 0 errors, `npm run build` passed.

## Handoff template

### Task / issue
- Owner:
- Branch:
- Status: Planned / In progress / Review requested / Blocked
- Goal:
- Scope:
- Files being changed:
- Files explicitly not to touch:
- API/schema assumptions:
- Tests run:
- Current findings:
- Blockers/questions:
- Next action:
- Last updated:

## Coordination rules
- Check this file before starting overlapping work.
- One owner per task.
- If another contributor is editing a file you need, coordinate before editing.
- Record API/schema changes and update the related contract document.
- Clear or update entries when a task is merged, cancelled, or reassigned.
