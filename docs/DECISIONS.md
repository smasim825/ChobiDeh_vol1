# Architecture and Product Decisions

Record decisions that affect architecture, data, security, cost, or product behavior.

Use this format:

## DEC-0001 — <short title>
- Status: Proposed / Accepted / Superseded
- Date:
- Context:
- Decision:
- Alternatives considered:
- Consequences:
- Owner:

## Initial open decisions

### DEC-0001 — First client platform
- Status: Accepted
- Date: 2026-10-20
- Decision: Adopted React web client (`client/` built with Vite, TypeScript, and Tailwind CSS v3) for the initial MVP. Implemented complete authentication flows based on Warm Editorial Archival design specifications.
- Alternatives considered: Flutter mobile app.
- Consequences: Focus initially on web responsive layouts (mobile viewport + desktop) before introducing a native mobile client.

### DEC-0002 — Authentication
- Status: Open
- Compare a managed auth provider with self-managed authentication.
- Consider cost, security, integration, and user experience.

### DEC-0003 — Object storage
- Status: Open
- Compare cost, private access controls, signed URLs, egress, lifecycle policies, and regional availability.

### DEC-0004 — Face model and execution
- Status: Open
- Evaluate licensing, quality, inference cost, latency, privacy, and deployment complexity.
- Do not select solely from a demo or an unverified accuracy claim.

### DEC-0005 — Biometric retention
- Status: Open
- Define retention, withdrawal, deletion, backups, and derived-data policy before production enrollment.

### DEC-0006 — Queue
- Status: Open
- Start with the simplest reliable background-job mechanism suitable for expected traffic; upgrade when requirements justify it.

### DEC-0007 — 3-Level AI Face Clustering Architecture
- Status: Accepted
- Date: 2026-10-20
- Context: Photo organization in shared rooms originally contemplated optional biometric face enrollment linked to registered user accounts. To preserve maximum user privacy, eliminate user friction, and avoid holding account-level biometric profiles, an anonymous visual face clustering approach was proposed.
- Decision: Adopted a 3-Level AI Face Clustering model:
  1. Level 1 (Confident Clustering): Automatically group visually similar faces from uploaded photos into anonymous person collections within the room. Users can name and edit these collections.
  2. Level 2 (Uncertain Matches): Suggest potentially similar person groups for user review. Never merge them automatically.
  3. Level 3 (Unsorted): Keep unmatched faces and photos without usable faces in an Unsorted collection for manual organization.
  Mandatory face registration, selfie enrollment, and linking faces to user accounts are completely eliminated.
- Alternatives considered: User selfie enrollment, account-wide biometric template matching.
- Consequences: Eliminates storage of user identity biometric profiles; models cluster purely on visual features anonymously per room. Ensures zero false automated merges by enforcing user review for Level 2 suggestions.

### DEC-0008 — Supabase Managed Backend (PostgreSQL + RLS + GoTrue + Storage)
- Status: Proposed (Pending User Review)
- Date: 2026-10-20
- Context: Evaluated custom Node.js/Express monolith vs. Supabase managed stack for initial MVP.
- Decision: Adopt Supabase as the managed foundation for PostgreSQL 16, Row-Level Security, Auth (GoTrue), and private object storage.
- Alternatives considered: Fully custom Node.js Express monolith with self-managed PostgreSQL and custom JWT auth.
- Consequences: Shared SDK compatibility across both current React web client and future Flutter mobile client; database-enforced multi-tenant room isolation via RLS; zero auth boilerplate.

### DEC-0009 — Direct-to-Storage Presigned Uploads
- Status: Proposed (Pending User Review)
- Date: 2026-10-20
- Context: Avoid proxying heavy photo payloads through the API application tier.
- Decision: Clients upload directly to S3-compatible private storage using short-lived HMAC presigned PUT URLs, followed by an API confirmation RPC.
- Alternatives considered: Streaming binary files through Express multipart/form-data.
- Consequences: Web server memory remains constant even under 50 simultaneous photo uploads; zero API thread-pool starvation.

### DEC-0010 — PostgreSQL `FOR UPDATE SKIP LOCKED` Durable Queue
- Status: Proposed (Pending User Review)
- Date: 2026-10-20
- Context: Need an asynchronous background job processing queue for AI tasks without introducing unnecessary Day-1 distributed infrastructure.
- Decision: Use a relational `processing_jobs` table in PostgreSQL leveraging `FOR UPDATE SKIP LOCKED` for task dispatch to workers.
- Alternatives considered: Redis/BullMQ, RabbitMQ, Apache Kafka, AWS SQS.
- Consequences: Zero additional infrastructure to operate or pay for; ACID transactional consistency between photo insertion and job creation. Milestone 2 scaling trigger documented for high queue throughput.

### DEC-0011 — Standalone Python Worker for AI Processing
- Status: Proposed (Pending User Review)
- Date: 2026-10-20
- Context: Image decoding, thumbnail generation, face detection, and vector clustering require mature machine learning and computer vision libraries.
- Decision: Implement the background worker as an independent Python service/container polling the PostgreSQL job queue.
- Alternatives considered: In-process Node.js worker using TensorFlow.js or child process spawning.
- Consequences: Access to OpenCV, PyTorch/ONNX, and MediaPipe; independent horizontal scaling and CPU/memory quotas without impacting user-facing web traffic.

### DEC-0012 — Keyset (Cursor-Based) Gallery Pagination
- Status: Proposed (Pending User Review)
- Date: 2026-10-20
- Context: Photo galleries grow to thousands of items per room; traditional `OFFSET / LIMIT` pagination leads to severe `O(N)` query degradation and duplicate items during live uploads.
- Decision: Enforce keyset pagination using `(created_at, id) < (cursor_created_at, cursor_id)` with B-tree compound indexing.
- Alternatives considered: Traditional offset pagination (`OFFSET 5000 LIMIT 30`).
- Consequences: Consistent `O(1)` index seek performance; rock-solid infinite scrolling feeds for both web and mobile.
