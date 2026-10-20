# API Contract (Superseded / Aspirational)

> [!NOTE]
> **Architecture Update (DEC-0013):** The custom REST route map listed below is superseded/aspirational.
> ChobiDeh's active backend architecture is implemented directly via **Supabase Row-Level Security (RLS)** for authenticated table access and **PostgreSQL `SECURITY DEFINER` Remote Procedure Calls (RPCs)** for sensitive operations (e.g., `create_room`, `join_room`, `create_upload`, `rename_cluster`, `resolve_uncertain_match`, `purge_room_face_data`, `set_room_face_consent`).
> Clients interact with the backend directly through the `@supabase/supabase-js` client SDK.

Status: Proposed route map only (retained for reference or future API gateway extraction). Prefix routes with `/api/v1`.

## Authentication
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /me`
- `PATCH /me`

## Preferences and cluster controls
- `GET /me/preferences`
- `PATCH /me/preferences`
- `DELETE /rooms/:roomId/clusters` (purge generated face clusters and vectors for a room)

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

## Collections and 3-Level Review
- `GET /rooms/:roomId/clusters` (Level 1: list anonymous & named person collections)
- `PATCH /rooms/:roomId/clusters/:clusterId` (rename/edit anonymous cluster label)
- `GET /rooms/:roomId/clusters/:clusterId/photos` (get photos for a specific cluster)
- `GET /rooms/:roomId/uncertain-matches` (Level 2: list suggested candidate merges)
- `POST /rooms/:roomId/uncertain-matches/:id/resolve` (body: `{ action: "merge" | "dismiss" }`)
- `GET /rooms/:roomId/unsorted` (Level 3: list unsorted/unmatched photos)
- `POST /rooms/:roomId/photos/:photoId/assignments` (manual assignment to a cluster)
- `DELETE /rooms/:roomId/photos/:photoId/assignments/:clusterId` (remove photo from a cluster)

## Error conventions
Choose a consistent JSON error shape with a stable error code, safe user-facing message, and request/correlation ID. Never return stack traces, secrets, or internal storage details.

## Contract rules
- Document authentication requirements per route.
- Document room membership/role requirements per route.
- Use pagination for photo lists.
- Define idempotency for uploads, job creation, and assignment operations.
- Add schema validation and contract tests.
- Update this document in the same PR as breaking API changes.
