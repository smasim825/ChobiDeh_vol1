# ChobiDeh

ChobiDeh is a room-based, AI-assisted photo organization platform. Members create or join a room, upload photos they choose to share, and the system organizes room photos into person-based collections using an anonymous Three-Level Photo Matching & Grouping workflow:
- **Level 1 — High Confidence:** Automatically matches faces to person collections. If multiple people appear in one photo, links that single photo reference to every matched person's collection (original stored only once).
- **Level 2 — Close Match Suggestions:** Presents borderline matches in a Review Suggestions section with closest candidate people. Enables confirming, correcting (A → B), rejecting without auto-assigning, and undoing mistakes. Never retrains the model from user corrections.
- **Level 3 — Rest Photos:** Organizes unassigned photos into three distinct filters: **Unknown Faces** (detected but unassigned; manually taggable), **No People** (scenery, sunsets, food), and **Other Unassigned** (processing exceptions/blur). Never confuses unknown faces with scenery.

## Start here

Every human contributor and AI agent must read these files before changing code:

1. [`AGENTS.md`](AGENTS.md) — shared rules, roles, and restrictions.
2. [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) — product goal and MVP boundaries.
3. [`docs/PRODUCT_REQUIREMENTS.md`](docs/PRODUCT_REQUIREMENTS.md) — user requirements and acceptance criteria.
4. [`docs/SYSTEM_FLOW.md`](docs/SYSTEM_FLOW.md) — main application and AI-processing flows.
5. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture principles.
6. [`docs/SECURITY_PRIVACY.md`](docs/SECURITY_PRIVACY.md) — security and biometric-data requirements.
7. [`docs/AI_MATCHING.md`](docs/AI_MATCHING.md) — Three-Level Photo Matching & Grouping specification.
8. [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — Database schema, entities, and audit history.
9. [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) — Endpoint specifications for galleries, suggestions, and rest photos.
10. [`docs/STORAGE_IMPLEMENTATION_PLAN.md`](docs/STORAGE_IMPLEMENTATION_PLAN.md) — Cloudflare R2 media pipeline & Dual Export implementation plan.
11. [`docs/TASKS.md`](docs/TASKS.md) and [`docs/HANDOFF.md`](docs/HANDOFF.md) — current work and agent handoffs.

## Current status

This repository starts as a documentation-first project workspace. Technology choices and implementation details that are confirmed are documented in `docs/ARCHITECTURE.md`, `docs/AI_MATCHING.md`, and `docs/STORAGE_IMPLEMENTATION_PLAN.md`.

## Product boundary

The MVP is for shared rooms, selected photo uploads directly to Cloudflare R2, secure access, anonymous visual face clustering into person collections, Review Suggestions for close matches, a categorized Rest Photos area (Unknown Faces, No People, Other Unassigned), Dual Exports (Save to Phone & Google Drive Export), and manual tagging. Travel planning and expense splitting are future extensions, not MVP requirements.

## Working agreement

- One task has one named owner at a time.
- Work on a feature branch; use a pull request for review.
- Read the current documentation before making changes.
- Update documentation when behavior or contracts change.
- Never claim a test, deployment, or feature succeeded unless it was actually run and verified.
