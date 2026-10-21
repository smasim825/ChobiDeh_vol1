# Feature Catalog & Status

This document catalogs ChobiDeh's user-facing capabilities, architectural boundaries, and implementation status.

---

## 1. Feature Status Matrix

| Module | Feature | Level / Details | Status |
| :--- | :--- | :--- | :---: |
| **Media** | Cloudflare R2 Direct Upload | Pre-signed S3 URLs, zero server proxying, 1,000 photo cap | **Approved Plan** |
| **Media** | Client-Side WebP Compression | 12 MB camera files compressed to ~400 KB 2K WebP | **Approved Plan** |
| **AI Matching** | **Level 1: Confident Clustering** | Auto-matches faces $\ge T_{\text{high}}$, multi-person group photo links, single storage | **Approved Spec** |
| **AI Matching** | **Level 2: Review Suggestions** | Uncertain matches ($T_{\text{low}} \le \text{Sim} < T_{\text{high}}$), closest candidates, A → B correction, undo | **Approved Spec** |
| **AI Matching** | **Level 3: Rest Photos** | 3 Subsections: Unknown Faces, No People (scenic), Other Unassigned (blur/errors) | **Approved Spec** |
| **Exports** | **Save to Phone (ZIP)** | In-browser multi-photo streaming ZIP download | **Approved Plan** |
| **Exports** | **Export to Google Drive** | 1-click cloud-to-cloud copy to user's Google Drive (`drive.file` scope) | **Approved Plan** |
| **Rooms** | Room Passcode & Invite Link | Cryptographic room codes, invite modal | **Implemented** |
| **Auth** | Supabase JWT & Onboarding | Complete profile, display names | **Implemented** |

---

## 2. Three-Level AI Matching Specifications

* **Level 1 (Confident):** Automatically groups faces meeting calibrated similarity. When multiple people appear in one photo, the photo is linked to each person's collection without duplicating files.
* **Level 2 (Review Suggestions):** Displays ambiguous matches with top candidate people. Allows authorized users to confirm, reject, or correct A to B. Rejecting does not auto-assign to other candidates. User corrections do not retrain the AI model. Undo supported.
* **Level 3 (Rest Photos):** Organizes unassigned photos into Unknown Faces, No People, and Other Unassigned. Allows manual tagging of unknown faces.
