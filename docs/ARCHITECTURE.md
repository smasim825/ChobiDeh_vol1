# Architecture

Status: Proposed architecture; validate choices before implementation.  
Detailed Blueprint: [`docs/SCALABLE_ARCHITECTURE_PLAN.md`](SCALABLE_ARCHITECTURE_PLAN.md) (comprehensive system design primer mapping, schema DDL, RLS policies, request flows, and scaling milestones).

## Recommended starting point

Use a modular monolith with managed backend services (Supabase PostgreSQL with Row-Level Security, GoTrue Auth, private S3-compatible storage) and an independent asynchronous Python AI worker. Do not start with microservices unless a concrete scaling or deployment bottleneck appears.

## Proposed components

- **Client:** React/Vite web client (current MVP UI) with architecture designed for native Flutter mobile client reuse without backend modification.
- **Backend Core:** Supabase / PostgreSQL 16+ with Row-Level Security (RLS) for automated room isolation.
- **API Gateway & Auth:** Managed JWT authentication (GoTrue) + PostgREST / Node.js modular endpoints.
- **Object Storage:** Private S3-compatible storage (raw original bucket + derived thumbnails bucket) accessed via short-lived presigned URLs.
- **Queue:** Relational `processing_jobs` table using PostgreSQL `FOR UPDATE SKIP LOCKED` for transactional, durable background task coordination.
- **AI Worker:** Standalone Python service/container for image normalization, WebP thumbnail generation, face detection, ephemeral vector extraction, and 3-level face clustering.
- **Delivery:** GitHub repository, pull requests, automated CI, staging, and production environments.

## Module boundaries

- `identity`: accounts, sessions, profile, consent state.
- `rooms`: room creation, membership, roles, joining credentials.
- `media`: upload authorization, metadata, storage lifecycle, downloads.
- `ai-processing`: jobs, model adapters, embeddings, match candidates, retries.
- `collections`: person collections, assignments, review decisions.
- `notifications`: future module.
- `trips`: future module.
- `expenses`: future module.

## Data ownership rules

- Database stores structured metadata, relationships, processing state, and storage keys.
- Object storage holds image bytes and optional derived thumbnails.
- Do not store raw image blobs in ordinary relational rows by default.
- A collection is a relationship between a room/person and a media record, not a duplicate file.
- A face/person identity is scoped to a room unless a separate, explicit product and privacy design approves cross-room identity.
- Store model/version and decision source to support explainability and debugging.

## Scalability path

1. Begin with one API deployment, PostgreSQL, private object storage, and one worker.
2. Add indexes, pagination, caching only where measurements justify them.
3. Increase worker concurrency independently of API instances.
4. Add a dedicated durable queue when job volume or reliability requirements justify it.
5. Separate high-load modules into services only when ownership, scaling, or reliability benefits exceed added complexity.
6. Use CDN delivery only with private authorization/signing appropriate to the privacy model.

## Observability

Track request errors, latency, queue depth, processing duration, failed jobs, upload failures, and authorization denials. Never log passwords, access tokens, raw embeddings, or photo bytes.

## Open decisions

- Mobile-first Flutter or web-first React.
- Authentication provider or self-managed auth.
- Object-storage provider and expected cost.
- Face model/license, on-device vs server processing, and consent UX.
- Queue technology.
- Data retention and backup deletion timelines.
