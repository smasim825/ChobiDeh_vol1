# API Contract (Draft)

Status: Proposed route map only. Do not implement blindly; finalize request/response schemas and error conventions before parallel client/server work. Prefix routes with `/api/v1`.

## Authentication
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /me`
- `PATCH /me`

## Consent and enrollment
- `GET /me/biometric-consent`
- `POST /me/biometric-consent`
- `DELETE /me/biometric-enrollment`

Consent endpoints must require authentication and record policy version and timestamp. Exact schema is an open decision.

## Rooms
- `POST /rooms`
- `GET /rooms`
- `GET /rooms/:roomId`
- `POST /rooms/:roomId/join`
- `POST /rooms/:roomId/rotate-join-credential`
- `DELETE /rooms/:roomId/members/:userId`

## Media
- `POST /rooms/:roomId/uploads`
- `POST /rooms/:roomId/uploads/:uploadId/complete`
- `GET /rooms/:roomId/photos`
- `GET /rooms/:roomId/photos/:photoId`
- `DELETE /rooms/:roomId/photos/:photoId`

Upload authorization and completion must validate membership, limits, storage object ownership, and expected content. Never trust client-supplied storage paths.

## Collections and review
- `GET /rooms/:roomId/collections`
- `GET /rooms/:roomId/people/:personId/photos`
- `GET /rooms/:roomId/unsorted`
- `GET /rooms/:roomId/match-suggestions`
- `POST /rooms/:roomId/photos/:photoId/assignments`
- `PATCH /rooms/:roomId/assignments/:assignmentId`
- `DELETE /rooms/:roomId/assignments/:assignmentId`

## Error conventions
Choose a consistent JSON error shape with a stable error code, safe user-facing message, and request/correlation ID. Never return stack traces, secrets, or internal storage details.

## Contract rules
- Document authentication requirements per route.
- Document room membership/role requirements per route.
- Use pagination for photo lists.
- Define idempotency for uploads, job creation, and assignment operations.
- Add schema validation and contract tests.
- Update this document in the same PR as breaking API changes.
