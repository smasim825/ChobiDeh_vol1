# Feature Catalog

Status values: `MVP`, `LATER`, `OPEN`.

## Identity
- [MVP] Signup, login, logout.
- [MVP] User profile and dashboard.
- [MVP] Room-scoped AI face clustering toggle (no mandatory selfies or face registration).
- [MVP] Cluster vector deletion / purge request.
- [LATER] Social sign-in providers, if needed.

## Rooms
- [MVP] Create room.
- [MVP] Join room using room ID and secure joining credential.
- [MVP] Room membership and owner permissions.
- [MVP] Rotate joining credential and remove member.
- [MVP] Room photo gallery.
- [LATER] Room roles beyond owner/member, such as moderator.

## Media
- [MVP] Explicit photo selection and upload.
- [MVP] Private object storage.
- [MVP] Upload progress, retries, and processing status.
- [MVP] Photo detail and authorized download.
- [MVP] Photo deletion.
- [LATER] Duplicate detection, quality ranking, video support, bulk export.

## AI organization (3-Level Architecture)
- [MVP] Face detection and room-scoped embedding computation.
- [MVP] Level 1: Confident Clustering into anonymous person collections (e.g., Person 1, Person 2).
- [MVP] Level 2: Uncertain Match suggestions between similar person groups for user review (never auto-merged).
- [MVP] Level 3: Unsorted collection for unmatched faces or photos without usable faces.
- [MVP] User naming, editing, and manual assignment of person collections.
- [MVP] Job retries and processing status.
- [LATER] Semantic photo search and smart album summaries.

## Collections
- [MVP] Person collections within a room.
- [MVP] A photo can belong to multiple person collections.
- [MVP] One stored original referenced from many collections.
- [MVP] Review and undo match decisions.

## Future travel platform
- [LATER] Trip destinations and dates.
- [LATER] Itinerary and activities.
- [LATER] Expense tracking and split calculations.
- [LATER] Settlement tracking.
- [LATER] Maps, reminders, and travel recommendations.

## Release gate

A feature cannot be considered complete unless its acceptance criteria, tests, privacy implications, failure states, and documentation are addressed.
