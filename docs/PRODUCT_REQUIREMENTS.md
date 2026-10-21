# Product Requirements Document (PRD)

**Product:** ChobiDeh  
**Target Market:** Group travelers, friends, and family trip organizers.  
**Core Mission:** Effortless, privacy-centric shared trip photo organization with anonymous 3-level AI face clustering and permanent personal backup.

---

## 1. Feature Specifications & Requirements

### Feature 1: Three-Level Photo Matching & Grouping

#### Level 1 — High Confidence (Automatic Clustering)
- **FR-1.1:** System shall automatically match detected faces to room person collections when confidence meets or exceeds $T_{\text{high}}$.
- **FR-1.2:** If multiple known people appear in one photo, system shall link the **single photo reference** to every matched person's collection.
- **FR-1.3:** The original image shall be stored **only once** in Cloudflare R2; multiple person associations shall be maintained relationally.

#### Level 2 — Close Match Suggestions (Human-in-the-Loop)
- **FR-2.1:** When face similarity falls in the uncertain band ($T_{\text{low}} \le \text{Similarity} < T_{\text{high}}$), system shall generate a pending suggestion and **never automatically confirm it**.
- **FR-2.2:** System shall display uncertain photos in a dedicated **Review Suggestions** UI showing only the closest candidate people.
- **FR-2.3:** System shall permit an authorized member to explicitly correct an assignment (e.g. select "This is B" when suggested for A).
- **FR-2.4:** On correction (A → B), system shall resolve and remove the suggestion for A and confirm assignment to B.
- **FR-2.5:** System shall support confirming multiple people in a single group photo.
- **FR-2.6:** System shall permit rejecting suggestions and undoing recent review mistakes.
- **FR-2.7:** System shall **never treat a rejection alone as proof that another candidate is the correct match**.
- **FR-2.8:** Individual user corrections shall **never retrain or modify the recognition model weights**.

#### Level 3 — Unsorted / Rest Photos
- **FR-3.1:** Photos not confidently assigned to known people shall be organized in a **Rest Photos** section with three distinct filters:
  - **Unknown Faces:** Human faces detected but not identified.
  - **No People:** Scenery, sunsets, nature, food, and architecture with zero detected faces.
  - **Other Unassigned:** Processing failures, severe blur, or low-light images.
- **FR-3.2:** System shall **never classify unknown human faces as non-person scenery**.
- **FR-3.3:** Authorized room members shall be permitted to manually tag faces or photos to any person collection.

---

### Feature 2: Room Quotas & Storage Architecture
- **FR-4.1:** Each trip room shall have a maximum capacity of **1,000 photos** to guarantee predictable free-tier operation.
- **FR-4.2:** Photos shall be compressed client-side to WebP (~400 KB) prior to upload.
- **FR-4.3:** Uploads and downloads shall execute directly against Cloudflare R2 edge via pre-signed S3 URLs.

---

### Feature 3: Dual Export System
- **FR-5.1:** Users shall be able to download the entire album (or filtered person collection) directly to their phone/device as a ZIP archive.
- **FR-5.2:** Users shall be able to 1-click export the room album directly into their personal Google Drive folder using the non-sensitive `drive.file` scope.
