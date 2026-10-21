# Architecture & Engineering Principles

## Architecture Overview

ChobiDeh uses a modular architecture with managed backend services (Supabase PostgreSQL with Row-Level Security, GoTrue Auth, and Cloudflare R2 private S3-compatible storage) and an asynchronous background AI worker.

```
[ Client (React/Vite & Mobile) ]
       │                      ▲
       │ 1. Metadata          │ 2. Direct S3 Binary Stream
       ▼                      ▼
[ Supabase PostgreSQL & Auth ]   [ Cloudflare R2 Storage ]
       │                      ▲
       │ 3. Asynch Queue      │ 4. Read Originals
       ▼                      │
[ Python AI Worker (Clustering) ]
```

---

## Core Components

- **Client:** React/Vite responsive web application. Architecture designed for native Flutter mobile client reuse without backend changes.
- **Backend & Database:** Supabase PostgreSQL 16+ with Row-Level Security (RLS) enforcing strict room isolation.
- **Authentication:** Managed JWT authentication (GoTrue) + PostgREST.
- **Media Storage:** Cloudflare R2 (S3-compatible object storage) accessed via short-lived pre-signed URLs. Zero egress bandwidth charges.
- **AI Worker:** Standalone Python container for image normalization, face detection, ephemeral vector extraction, and 3-level face clustering.

---

## The Three-Level Matching & Grouping Rules

1. **Level 1 — High Confidence:**
   - Visual similarity $\ge T_{\text{high}}$ automatically groups faces into room-scoped person collections.
   - If multiple known people appear in one photo, the **same photo reference is added to every matched person's collection**.
   - **Single Storage Rule:** The original photo is uploaded and stored **only once** in Cloudflare R2.
2. **Level 2 — Close Match Suggestions:**
   - Marginal similarity ($T_{\text{low}} \le \text{Similarity} < T_{\text{high}}$) generates a suggestion for human review with top candidates.
   - **Never auto-confirm.**
   - Users can confirm, correct (e.g., "This is B" when suggested for A), or reject.
   - Correcting A → B removes the suggestion for A and creates a confirmed assignment to B.
   - Rejecting does not automatically assign to any other person.
   - Full undo support backed by `assignment_history`.
3. **Level 3 — Rest Photos:**
   - Photos that cannot be confidently assigned are organized into three dedicated filters:
     1. **Unknown Faces:** Human faces detected, but unmatched. Manual tagging supported.
     2. **No People:** Scenery, sunsets, buildings, mountains, food, nature.
     3. **Other Unassigned:** Processing exceptions, severe blur, low light.
   - Unknown faces are **never misclassified as non-person scenery**.

---

## Data Ownership & Model Stability Rules

- **Database stores metadata:** Relationships, tags, and storage keys live in PostgreSQL. Image blobs live in R2.
- **Single Source of Truth:** A collection is a relational record (`photo_assignments`), not a duplicated file.
- **Model Non-Retraining Rule:** User corrections, confirmations, and rejections **never retrain or alter the underlying recognition model weights**. All corrections update room-scoped relational records only.
- **Room Authorization Enforcement:** Every query, view, download, suggestion review, correction, and deletion strictly checks room membership.
- **Biometric Isolation:** Embeddings and clusters are strictly scoped to the room. No global biometric identities exist across rooms.
