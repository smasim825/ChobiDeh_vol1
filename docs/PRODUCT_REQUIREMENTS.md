# Product Requirements

Status: Initial requirements draft. Validate with real users before treating as final.

## Accounts and dashboard

- Users can register, log in, log out, and manage a basic profile.
- The dashboard lists rooms the user belongs to and provides create/join actions.
- Face enrollment is optional for general account use and requires explicit informed consent before biometric processing.
- Users can see enrollment status and request withdrawal/deletion.

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

- A room may have collections for people recognized or manually identified in that room.
- A photo may be associated with multiple people.
- A face match in one room must not automatically reveal a person's photos in another room.
- Users can confirm, reject, correct, or remove a person assignment.
- Users can leave a photo Unsorted.

Acceptance:
- Correcting a match updates all affected collection views consistently.
- No duplicate original image is created merely because multiple people appear in it.

## AI organization

- Processing runs asynchronously.
- Level 1: high-confidence face match may be assigned automatically after validation.
- Level 2: contextual clues produce suggestions for review, not definitive identity claims.
- Level 3: uncertain or unidentified media remains Unsorted.
- Thresholds must be calibrated against a representative validation dataset.
- System records model/version and decision status sufficient for debugging, while minimizing retained sensitive data.

Acceptance:
- Failed processing can be retried safely.
- A job is idempotent; retries do not create duplicate assignments.
- A user can undo an incorrect match.

## Privacy and deletion

- Explain what biometric data is processed and why before enrollment.
- Provide opt-out without blocking ordinary photo sharing.
- Support deletion requests for embeddings, face templates, derived match records, and related data, with clearly documented backups/retention limitations.
- Provide room/photo deletion behavior and communicate its effects to members.
- Do not use user photos to train unrelated models by default.

Acceptance:
- Deletion is auditable and propagated to derived records and storage according to the retention policy.
- Consent status is checked before biometric processing.

## Future features (not MVP)

- Trip itinerary, destinations, and activities.
- Expense tracking and settlement calculations.
- Notifications and reminders.
- Search, duplicate detection, quality filtering, and additional photo tools.
