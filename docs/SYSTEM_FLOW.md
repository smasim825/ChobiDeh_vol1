# System Flow

## 1. Account and consent flow

1. User registers or signs in.
2. Backend creates/loads the profile and returns a session.
3. Dashboard shows rooms and available actions.
4. Face enrollment is offered as an optional feature with a clear explanation.
5. If the user consents, the enrollment flow asks for an appropriate reference image or images and processes them securely.
6. Store only the data required for the approved matching design; document retention and deletion behavior.
7. If the user declines, account and ordinary room/photo features remain available.

## 2. Room creation and joining

1. Creator submits room name and creation request.
2. API authenticates creator, creates room, and assigns owner membership.
3. System generates a non-guessable joining secret or secure credential.
4. Share room ID plus joining credential out of band.
5. Joining user submits both values to the API.
6. API validates credential, applies rate limits, creates membership, and returns room access.
7. Every later room operation checks current membership and permissions server-side.

Security note: room ID is an identifier, not a secret. Store joining secrets as hashes when feasible, rate-limit attempts, and support credential rotation.

## 3. Photo upload flow

1. Member selects specific photos through the app.
2. Client requests an upload authorization for each file or batch.
3. API verifies membership, file constraints, and quota.
4. API issues a short-lived upload URL or accepts a streamed upload.
5. Client uploads to private object storage.
6. Client/API confirms completion.
7. API records media metadata and queues an AI processing job.
8. Gallery shows upload complete and processing pending/complete separately.

## 4. AI processing flow

1. Worker claims a queued job.
2. Worker checks consent and room policy before biometric processing.
3. Validate and decode image safely; create a temporary working copy if needed.
4. Detect faces and compute embeddings only under the approved consent policy.
5. Compare candidate embeddings only with people eligible for matching in that room.
6. If a match passes a calibrated high-confidence threshold, create an automatic assignment.
7. If face evidence is weak but contextual clues suggest a candidate, create a review suggestion.
8. If no suitable candidate exists, keep the photo/person instance Unsorted.
9. Store processing status and minimal diagnostic metadata.
10. Notify/update the client when processing is complete.
11. On failure, retry safely with backoff and send exhausted jobs to a failure queue for investigation.

## 5. Match correction flow

1. Member opens a suggestion or photo.
2. UI shows the proposed person and lets the user confirm/reject or choose another person.
3. API verifies membership and permission to edit the assignment.
4. API records the correction and updates collection membership.
5. If the correction changes future matching, update the room's person reference carefully.
6. Do not silently train or alter a global identity model from corrections.

## 6. Deletion flow

1. User requests deletion of a photo, enrollment, or account.
2. API verifies identity and scope.
3. Mark the resource as pending deletion to prevent new processing.
4. Cancel or invalidate queued jobs where possible.
5. Delete associated embeddings, assignments, derived files, and stored media according to policy.
6. Record a non-sensitive audit event.
7. Confirm completion only after the required deletion steps succeed; explain any backup expiry period.

## 7. Failure and recovery

- Use idempotency keys or unique job identifiers.
- Separate upload state from AI-processing state.
- Make retries safe.
- Do not expose internal storage paths or stack traces to clients.
- Log correlation IDs, not passwords, access tokens, raw face embeddings, or image contents.
