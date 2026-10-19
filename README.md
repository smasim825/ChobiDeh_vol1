# ChobiDeh

ChobiDeh is a room-based, AI-assisted photo organization platform. Members create or join a room, upload photos they choose to share, and the system organizes room photos into person-based collections using an anonymous 3-level AI face clustering workflow (Level 1: Confident Clustering, Level 2: Uncertain Matches, Level 3: Unsorted).

## Start here

Every human contributor and AI agent must read these files before changing code:

1. [`AGENTS.md`](AGENTS.md) — shared rules, roles, and restrictions.
2. [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) — product goal and MVP boundaries.
3. [`docs/PRODUCT_REQUIREMENTS.md`](docs/PRODUCT_REQUIREMENTS.md) — user requirements and acceptance criteria.
4. [`docs/SYSTEM_FLOW.md`](docs/SYSTEM_FLOW.md) — main application and AI-processing flows.
5. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture principles.
6. [`docs/SECURITY_PRIVACY.md`](docs/SECURITY_PRIVACY.md) — security and biometric-data requirements.
7. [`docs/AI_MATCHING.md`](docs/AI_MATCHING.md) — 3-level AI face clustering and uncertainty handling.
8. [`docs/TASKS.md`](docs/TASKS.md) and [`docs/HANDOFF.md`](docs/HANDOFF.md) — current work and agent handoffs.

## Current status

This repository starts as a documentation-first project workspace. Technology choices and implementation details that are not confirmed are explicitly marked **PROPOSED** or **OPEN DECISION**. Do not treat them as already implemented.

## Product boundary

The MVP is for shared rooms, selected photo uploads, secure access, anonymous visual face clustering into person collections, suggested uncertain matches, an Unsorted collection, and manual editing/naming. Travel planning and expense splitting are future extensions, not MVP requirements.

## Working agreement

- One task has one named owner at a time.
- Work on a feature branch; use a pull request for review.
- Read the current documentation before making changes.
- Update documentation when behavior or contracts change.
- Never claim a test, deployment, or feature succeeded unless it was actually run and verified.
