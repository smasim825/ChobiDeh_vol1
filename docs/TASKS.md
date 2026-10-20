# Task Board

Keep this file current, but GitHub Issues should be the canonical tracker once the repository is connected.

## Backlog
- [x] Confirm client platform: React web.
- [x] Implement authentication pages (Login, Sign Up, Forgot Password, Check Email).
- [ ] Interview target users and validate the room workflow.
- [ ] Finalize MVP acceptance criteria.
- [ ] Choose authentication approach.
- [ ] Choose private object storage provider.
- [ ] Decide biometric consent, retention, and deletion behavior.
- [ ] Finalize API request/response contracts.
- [ ] Finalize database schema and migrations.
## Completed / Review Hardening (Branch: `fix/review-round-1`)
- [x] Phase 1 Database: RLS on `processing_jobs` & `join_attempts`, separate `face_embeddings`, SECURITY DEFINER `SET search_path = ''`, `create_room` / `join_room` RPCs with rate limiting and join slug, member management RPCs, media upload authorization, tightened profile SELECT, cluster RPCs, face data purge RPCs, pgTAP security tests.
- [x] Phase 2 Consent & Honest UI: Opt-in consent default false everywhere, per-room consent, honest terminology (removed false claims like "Encrypted", "End-to-End Vault"), remove fake simulation toasts.
- [x] Phase 3 Routing & Auth Boundary: Added `react-router-dom`, `RequireAuth`, `RequireCompletedProfile`, deep link preservation `/join/:slug`, dev-only navbar preview.
- [x] Phase 4 Auth Bugs: Supabase error checks on every call, DB-backed onboarding completion (`profiles.onboarding_completed`), deferred auth event handlers, `PASSWORD_RECOVERY` handling, eliminated `any` types.
- [x] Phase 5 Cleanup: Removed all external hotlinks (Unsplash, Google usercontent), created local SVGs, fixed oxlint warnings, renamed and moved design folders to `docs/design/`.
- [x] Phase 6 Tests & CI: Added Vitest Supabase mocks suite and GitHub Actions workflow `.github/workflows/ci.yml`.

## Backlog / Out of Scope (NOT Done)
- [ ] Interview target users and validate the room workflow.
- [ ] Implement secure photo upload UI and production storage signing flow.
- [ ] Implement photo gallery with lazy loading and high-res lightbox.
- [ ] Implement asynchronous AI background worker (face detection, embedding extraction, clustering).
- [ ] Implement face clustering pipeline and worker jobs.
- [ ] Run private beta and review metrics.

## In progress
- Security Review Round 1 verification & documentation.

## Blocked
- None recorded.

## Task template
- Issue:
- Owner:
- Branch:
- Goal:
- In scope:
- Out of scope:
- Files/modules owned:
- Dependencies:
- Acceptance criteria:
- Tests:
- Risks/privacy impact:
- Status:
