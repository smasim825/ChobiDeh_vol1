# Architecture

Status: Proposed architecture; validate choices before implementation.

## Recommended starting point

Use a modular monolith for the API and a separate background AI worker. Do not start with microservices unless a concrete scaling or deployment need appears.

## Proposed components

- Client: Flutter mobile app OR React/TypeScript web app. Choose one for MVP.
- API: Node.js + Express + TypeScript.
- Database: PostgreSQL.
- Object storage: private S3-compatible storage.
- Queue: start with a durable database-backed job table if volume is low; adopt a managed queue when operationally justified.
- AI worker: Python service/library for image decoding, face detection, embeddings, matching, and contextual suggestions.
- Delivery: GitHub repository, pull requests, CI, staging, and production environments.

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
