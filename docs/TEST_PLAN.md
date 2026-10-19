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

## AI pipeline
- Job retry is idempotent.
- Level 1 threshold is validated on a held-out test set.
- Level 2 contextual matches require review.
- Level 3 uncertain cases remain Unsorted.
- Group photos can map to multiple people without duplicating the original.
- False matches can be corrected and undone.
- No biometric processing occurs after consent withdrawal.
- Deletion handles queued jobs and derived records.

## Privacy and deletion
- Consent is recorded with policy version and timestamp.
- Declining enrollment does not block ordinary app use.
- Deletion requests prevent new processing and trigger cleanup.
- Logs do not contain passwords, tokens, raw embeddings, or photo bytes.

## Reliability and usability
- Empty/loading/error states exist in the UI.
- Upload interruptions can recover safely.
- Processing failures are visible and retryable.
- Pagination handles large rooms.
- Basic accessibility and responsive layout are tested.
