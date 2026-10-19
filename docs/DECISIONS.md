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
