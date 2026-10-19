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
- Status: Open
- Choose Flutter mobile-first OR React web-first for the MVP.
- Do not build both clients until one end-to-end flow works.

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
