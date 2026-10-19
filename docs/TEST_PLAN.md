# Test Plan

## Authentication and authorization
- Logged-out requests to protected endpoints are denied.
- Room A member cannot access Room B media, people, jobs, or collections.
- Removed members lose access.
- Room ID alone does not grant access.
- Join attempts are rate-limited.

## Uploads and storage
- Valid images upload successfully.
- Oversized, malformed, unsupported, and spoofed MIME files are rejected.
- Expired upload/download links fail.
- Unauthorized users cannot access object keys directly.
- Retry does not create duplicate media records.
- EXIF/location metadata policy is applied consistently.

## AI pipeline (3-Level Architecture)
- Job retry is idempotent.
- Level 1: Confident clustering correctly groups visually similar faces into anonymous person collections without mandatory face registration.
- Level 2: Uncertain matches generate review suggestions and are never merged automatically.
- Level 3: Unmatched faces and photos without usable faces remain in the Unsorted collection.
- Group photos can map to multiple person clusters without duplicating the original photo.
- Clusters can be named, edited, merged, and manual assignments can be undone.
- Face clustering can be toggled per room.
- Deletion handles queued jobs and derived cluster records.

## Privacy and deletion
- No mandatory face registration or selfie requirements.
- Opting out of AI clustering does not block ordinary room photo sharing.
- Cluster purge requests remove vectors and assignments cleanly.
- Logs do not contain passwords, tokens, raw embeddings, or photo bytes.

## Reliability and usability
- Empty/loading/error states exist in the UI.
- Upload interruptions can recover safely.
- Processing failures are visible and retryable.
- Pagination handles large rooms.
- Basic accessibility and responsive layout are tested.
