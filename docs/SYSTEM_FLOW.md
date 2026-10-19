# System Flow

## 1. Account and preferences flow

1. User registers or signs in (no selfie or face registration required).
2. Backend creates/loads the profile and returns a session.
3. Dashboard shows rooms and available actions.
4. AI face clustering is enabled as an optional photo organization feature.
5. If the user opts out of clustering, ordinary photo sharing and rooms remain fully available.

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

## 4. AI processing flow (3-Level Architecture)

1. Worker claims a queued job.
2. Worker verifies room clustering policy and settings.
3. Validate and decode image safely; create temporary working copy.
4. Detect faces and compute facial embeddings within the room boundary.
5. **Level 1 — Confident Clustering:**
   - Compare face embeddings with existing anonymous person clusters in the room.
   - If distance is below the calibrated confident threshold, assign the photo to that person collection automatically.
   - If a confident face does not match existing clusters, spawn a new anonymous person collection (e.g., "Person 1").
6. **Level 2 — Uncertain Matches:**
   - If distance or similarity between clusters/faces falls in an uncertain margin, generate an Uncertain Match suggestion for user review.
   - Never merge person collections automatically.
7. **Level 3 — Unsorted:**
   - If no face is detected, or image quality is too low, or embeddings fail confidence thresholds, assign the photo to the "Unsorted" collection.
8. Store processing status and diagnostic metadata (model/version, cluster IDs).
9. Notify/update the client when processing is complete.
10. On failure, retry safely with backoff and send exhausted jobs to a failure queue for investigation.

## 5. Cluster naming & match review flow

1. Member opens a room and views anonymous collections (e.g., "Person 1", "Person 2").
2. User can rename an anonymous collection to a human name (e.g., "Samira" or "Rafiqul").
3. Member opens the "Uncertain Matches" section (Level 2).
4. UI presents side-by-side thumbnails of the two suggested groups.
5. Member chooses **Confirm Merge** (merging them into a single collection) or **Keep Separate** (dismissing the suggestion).
6. API records the decision and updates cluster memberships atomically.
7. Member can view the "Unsorted" collection (Level 3) and manually drag/assign photos to a collection.

## 6. Deletion flow

1. User or room owner requests deletion of a photo, room, or cluster data.
2. API verifies identity and room permissions.
3. Mark the resource as pending deletion to prevent new processing.
4. Cancel or invalidate queued jobs where possible.
5. Delete associated cluster mappings, vector embeddings, derived thumbnails, and stored media according to policy.
6. Record a non-sensitive audit event.
7. Confirm completion only after the required deletion steps succeed; explain any backup expiry period.

## 7. Failure and recovery

- Use idempotency keys or unique job identifiers.
- Separate upload state from AI-processing state.
- Make retries safe.
- Do not expose internal storage paths or stack traces to clients.
- Log correlation IDs, not passwords, access tokens, raw face embeddings, or image contents.
