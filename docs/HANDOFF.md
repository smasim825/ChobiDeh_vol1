# Agent and Teammate Handoff

Update this file when starting or handing off a multi-file task. Keep entries short and current.

## Active work
- Task: Review Round 1 & Round 2 Hardening + CI Migration Fixes
  - Owner: Senior Full-Stack Engineer
  - Status: Completed (Merged into `main`)
  - Branch: `main`
  - Scope: Additive security hardening migrations (`20261021000000`, `20261022000000`), isolated `room_passcodes` table with zero client access, non-rollback rate limiting for `join_room`, role-checked purge / member consent withdrawal, safe storage policies, profiles trigger protections, 22 Vitest client tests, 24 pgTAP database security tests, and CI GitHub Actions workflow running on `supabase/setup-cli@v3`.
  - Tests run: All 22 Vitest tests pass, `oxlint` 0 errors, `tsc -b` 0 errors, `npm run build` succeeds, CI GitHub Actions on `main` passed completely (Client checks + pgTAP 24/24).

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
