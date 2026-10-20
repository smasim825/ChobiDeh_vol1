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

### DEC-0003 — Object Storage & Media Pipeline
- Status: Accepted
- Date: 2026-10-21
- Context: Shared trip photo platforms can incur heavy egress and storage costs. Users upload large multi-megabyte camera photos. Evaluating options revealed that central storage on Cloudflare R2 with direct presigned URLs and browser-side WebP compression provides zero-cost initial operation.
- Decision: Adopted Cloudflare R2 (S3-compatible) as central media storage paired with:
  1. Zero server proxying (direct client-to-storage upload via presigned URLs and direct CDN edge reads).
  2. Browser Canvas WebP compression (max 2048px, 0.85 quality) reducing 12 MB camera files to ~400–600 KB.
  3. Strict database quota of 1,000 photos max per room enforced by `check_room_media_cap` trigger in PostgreSQL.
  4. Dual export capabilities: In-browser parallel ZIP generation (`jszip`) for direct phone/laptop download, and 1-click cloud backup to Google Drive using `drive.file` scope.
- Alternatives considered: Supabase storage exclusively, AWS S3 with CloudFront (incurs egress charges), Google Drive as primary storage (limited by quota and rate limits).
- Consequences: 10 GB free tier in Cloudflare R2 supports 20–25 active rooms with zero egress charges. 30-day retention post-trip allows natural turnover while dual export guarantees users keep their memories permanently.

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

### DEC-0013 — Backend Architecture: Supabase RLS + SECURITY DEFINER RPCs
- Status: Accepted
- Date: 2026-10-21
- Context: Need a robust, secure, and low-latency API architecture where multi-tenant data isolation and authorization are guaranteed by the database engine, avoiding redundant application layers or leaked client access.
- Decision: Backend operations are implemented directly via Supabase Row-Level Security (RLS) policies for direct reads, combined with PostgreSQL `SECURITY DEFINER` Remote Procedure Calls (RPCs) with strict `SET search_path = ''` hygiene for all state-changing or privileged operations (room creation, joins, upload initiation, cluster reviews, membership changes, purges). Client calls these via `supabase.rpc(...)`. The traditional REST route listing in `docs/API_CONTRACT.md` is superseded/aspirational.
- Alternatives considered: Custom REST API gateway proxying database calls.
- Consequences: Authorization is enforced at the database layer; impossible for client to bypass room isolation; zero API boilerplate.

### DEC-0014 — Per-Room Opt-In Biometric Consent Model
- Status: Accepted
- Date: 2026-10-21
- Context: User privacy and legal compliance require granular, revocable consent for biometric face clustering. A global account-level toggle is insufficient because users may want clustering in a family room but not in a public or professional event room.
- Decision: Biometric face clustering consent is strictly OPT-IN and defaults to FALSE everywhere:
  1. Stored per room and per member in `room_members.face_clustering_consent boolean not null default false`.
  2. Room-level master toggle is controlled by the room owner in `rooms.face_clustering_enabled boolean not null default false`.
  3. `profiles.face_clustering_enabled` is retained solely as the user's personal default preference when creating or joining new rooms (defaults to `false`).
  4. Both user consent and room enablement must be TRUE for face embeddings and clustering to run for that member's photos.
  5. Consent revocation via `set_room_face_consent(room_id, false)` triggers the immediate purge logic removing derived face records and embeddings for that user in that room.
- Alternatives considered: Global opt-in only, implied consent on upload.
- Consequences: Highest privacy standard; granular control per room; zero biometric processing without explicit affirmative opt-in.

### DEC-0015 — Room Join via Public Random Slug and Hashed Passcode
- Status: Accepted
- Date: 2026-10-21
- Context: Room join links must be URL-safe, easy to share, and resistant to enumeration and brute-force attacks. Single unhashed codes expose rooms to unauthorized enumeration.
- Decision: Rooms use a server-generated, URL-safe random `join_slug text unique not null` (>=10 alphanumeric characters) for identification, paired with an optional hashed passcode (`passcode_hash` using PostgreSQL `crypt(passcode, gen_salt('bf'))`). Joining is executed via the `join_room(slug, passcode)` RPC which:
  1. Requires an authenticated user session (`auth.uid()`).
  2. Uses rate limiting via a secure internal `join_attempts` table (max 5 failed attempts per user per 10 minutes).
  3. Returns a single generic error on any failure to prevent room existence leakage.
  4. Inserts the user into `room_members` atomically with default `face_clustering_consent = false`.
- Alternatives considered: Short 6-digit PIN codes without slugs, unhashed join codes in client URLs.
- Consequences: Completely prevents room enumeration; securely handles password verification inside PostgreSQL; protects against brute force attacks.

### DEC-0016 — Isolated Room Passcode Storage (Zero Hash Exposure in `rooms`)
- Status: Accepted
- Date: 2026-10-21
- Context: Storing `passcode_hash` directly on `public.rooms` allows room members executing `SELECT * FROM rooms` to read bcrypt hashes of passcodes.
- Decision: Relocate passcode hashes to a dedicated, strictly isolated internal table `public.room_passcodes (room_id pk fk, passcode_hash, created_at)` with Row-Level Security enabled, zero client policies, and all privileges revoked from `anon`, `authenticated`, and `public`. Drop `passcode_hash` entirely from `public.rooms`.
- Alternatives considered: Postgres column-level security on `rooms.passcode_hash`.
- Consequences: Hash leakage is structurally impossible even if a client issues `SELECT *` on `rooms`.

### DEC-0017 — Role-Differentiated Biometric Purge vs. Member Consent Revocation
- Status: Accepted
- Date: 2026-10-21
- Context: Room owners should have the authority to wipe all derived room face clusters, while regular members withdrawing consent must not wipe the host's entire room gallery.
- Decision: Partition purge operations into two distinct RPCs:
  1. `purge_room_face_data(room_id)`: Enforces `owner` or `admin` role check. Wipes all clusters, embeddings, assignments, and uncertain matches for the room.
  2. `withdraw_member_face_consent(room_id)`: Executable by any room member. Deletes only face instances and vector embeddings detected on photos uploaded by that specific member, cancels their pending jobs, and toggles `room_members.face_clustering_consent = false`.
- Alternatives considered: Single purge function with complex branching.
- Consequences: Protects room albums from accidental or malicious destruction by non-admin members.
