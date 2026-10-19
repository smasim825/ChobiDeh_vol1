# AI Matching Design

## Goal

Organize photos uploaded to a specific room into useful person collections while minimizing false assignments and protecting biometric data.

## Terms

- Face detection: locates a face in an image.
- Face embedding: numeric representation produced by a model for comparing faces.
- Identity match: comparison of an embedding to an enrolled/confirmed room person.
- Contextual suggestion: a non-definitive recommendation based on metadata or nearby photos.
- Assignment: an explicit relationship between a photo and a person in a room.

Detection alone does not identify a person.

## Three levels

### Level 1 — High-confidence face match
- Compare face embeddings with eligible room-scoped reference embeddings.
- Use thresholds calibrated on a representative validation dataset.
- Automatically assign only when the validated policy allows it.
- Keep provenance: model/version, score or band, and decision source, with sensitive-data minimization.
- Make correction and undo possible.

### Level 2 — Contextual suggestion
- Candidate clues may include timestamp proximity, event sequence, clothing similarity, or neighboring confirmed photos.
- Treat these as weak evidence.
- Present suggestions for human review; do not automatically label identity based only on context.
- Avoid relying on EXIF timestamps alone because device clocks and metadata may be wrong or missing.

### Level 3 — Unsorted
- If no candidate passes the policy, leave the image or face instance Unsorted.
- Support manual tagging, dismissing, or leaving unresolved.
- Do not force a match just to achieve a complete gallery.

## Enrollment

- Explain purpose, processing location, retention, and deletion before consent.
- Consent must be specific and recorded with timestamp and policy/version.
- Enrollment is optional for general app usage.
- Restrict matching to the product's approved scope, initially the room.
- Do not assume a profile photo automatically grants consent for biometric enrollment.
- Define deletion behavior for embeddings, cached copies, derived metadata, and backups.

## Model evaluation

Before choosing thresholds:
- Build a legally and ethically collected test set with appropriate consent.
- Include varied lighting, pose, occlusion, image quality, skin tones, and group sizes.
- Measure false matches and missed matches separately.
- Review performance by relevant conditions and avoid unsupported accuracy claims.
- Calibrate thresholds and document the trade-off between precision and recall.
- Test correction, deletion, and retry behavior.

## Operational requirements

- Process asynchronously.
- Use idempotent jobs.
- Track `queued`, `processing`, `completed`, `failed`, and `needs_review` states.
- Do not log image content or raw embeddings.
- Version model outputs and support reprocessing if a model changes.
- Keep cross-room matching disabled unless separately designed, justified, and consented to.
