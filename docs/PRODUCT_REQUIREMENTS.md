# Product Requirements

Status: Initial requirements draft. Validate with real users before treating as final.

## Accounts and dashboard

- Users can register, log in, log out, and manage a basic profile.
- The dashboard lists rooms the user belongs to and provides create/join actions.
- No mandatory face registration or selfie enrollment is required. AI face clustering is an optional feature for organizing room photos.
- Users can view and manage their room cluster preferences and purge cluster data.

Acceptance:
- Unauthenticated users cannot access private room content.
- Dashboard states include loading, empty, error, and populated views.

## Room management

- A member can create a room with a name and unique ID.
- Room creator can manage membership and room settings.
- A member can join with the room ID and a joining secret/password or approved invite flow.
- Joining credentials must not be stored or logged in plaintext.
- Room owner can rotate joining credentials and remove members.
- Joining a room does not grant access to any device gallery.

Acceptance:
- A non-member cannot list, view, download, or upload room photos.
- A removed member loses access according to the documented removal policy.
- Room ID alone is not treated as authorization.

## Photo upload and gallery

- Users explicitly select images to upload.
- Server validates file size, allowed media type, and actual file content.
- Photos are stored in private object storage; database stores metadata and object keys.
- Uploads support visible progress and recoverable errors.
- A shared room gallery displays uploaded photos to authorized members.
- Original media is stored once; collections reference the same media record.
- Duplicate detection may be added, but must not silently delete user content.

Acceptance:
- Unauthorized storage access is denied.
- Upload failures are reported and retryable.
- Upload status is distinguishable from AI processing status.

## Person collections

- A room organizes photos into person collections based on unsupervised AI visual clustering.
- Collections start as anonymous clusters (e.g. "Person 1", "Person 2"). Room members can name, rename, or edit them.
- A photo may be associated with multiple people if multiple faces are present.
- Face clusters are strictly room-scoped and never shared across different rooms.
- Users can confirm, reject, correct, or remove a person assignment.
- Photos with no confident cluster remain in an Unsorted collection.

Acceptance:
- Correcting or merging a cluster updates all affected collection views consistently.
- No duplicate original image is created merely because multiple people appear in it.

## AI organization (3-Level Architecture)

- Processing runs asynchronously via background worker jobs.
- **Level 1 — Confident Clustering:** Automatically group visually similar faces from uploaded photos into anonymous person collections. Users can name and edit these collections.
- **Level 2 — Uncertain Matches:** Suggest potentially similar person groups for user review. Never merge them automatically.
- **Level 3 — Unsorted:** Keep unmatched faces and photos without usable faces in an Unsorted collection for manual organization.
- Thresholds must be calibrated against a representative validation dataset.
- System records model/version and decision status sufficient for debugging, while minimizing retained sensitive data.

Acceptance:
- Failed processing can be retried safely.
- A job is idempotent; retries do not create duplicate assignments or clusters.
- Uncertain matches require explicit user confirmation to merge.
- A user can undo an incorrect cluster assignment.

## Privacy and deletion

- Explain that face clustering groups visual similarities anonymously within the room.
- No mandatory face registration, selfie enrollment, or account-linked identity profiles.
- Support deletion requests for room clusters, vector embeddings, derived match records, and related data.
- Provide room/photo deletion behavior and communicate its effects to members.
- Do not use user photos to train unrelated models by default.

Acceptance:
- Deletion of room clusters/vectors is auditable and propagated to derived records according to retention policy.
- Clustering preferences can be toggled without blocking standard room photo sharing.

## Future features (not MVP)

- Trip itinerary, destinations, and activities.
- Expense tracking and settlement calculations.
- Notifications and reminders.
- Search, duplicate detection, quality filtering, and additional photo tools.
