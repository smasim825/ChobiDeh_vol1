# Security and Privacy Requirements

This is a working checklist, not a legal opinion. Before public launch, assess applicable privacy and biometric laws for the countries where the service and users operate.

## Authentication and authorization
- Authenticate every protected request.
- Authorize against current room membership and role on every operation.
- Treat room IDs as identifiers, not credentials.
- Rate-limit login, room join attempts, uploads, and sensitive actions.
- Use secure password/session handling or a reputable identity provider.
- Never store joining passwords in plaintext; rotate/revoke credentials.
- Avoid leaking whether private rooms, users, or media exist.

## Media security
- Use private buckets/containers.
- Use short-lived signed URLs where appropriate.
- Validate file size, actual content, MIME type, and supported formats.
- Consider image decoder vulnerabilities, decompression bombs, EXIF metadata, malware scanning, and resource limits.
- Strip location metadata from derivatives where appropriate and disclose policy.
- Do not expose internal object keys or permanent public URLs.
- Apply quotas and rate limits to prevent storage abuse.

## Biometric data & Face Clustering
- No mandatory face registration, selfie enrollment, or account-linked face templates.
- AI face clustering operates solely on photos explicitly uploaded to a shared room.
- Clear user transparency and controls for room clustering.
- Minimize what is collected and stored: only anonymous cluster assignments and ephemeral vectors.
- Encrypt data in transit and at rest; tightly restrict access to room members only.
- Never place raw embeddings or face crops in application logs or analytics.
- Support withdrawal and deletion, including room-level cluster purges and queued jobs.
- Define how backups expire and explain any unavoidable delay.
- Do not use uploaded photos or embeddings to train unrelated models by default.
- Provide a full standard room experience for users who disable AI clustering.

## Multi-tenant isolation
- All media, person records, jobs, and collections must include or resolve to an authorized room scope.
- Test cross-room access denial.
- Ensure object storage access cannot bypass API authorization.
- Re-check membership when issuing download links and processing jobs.

## Third-party Assets & External Network Requests
- **Google Fonts & Material Symbols:** The client currently loads webfonts (Plus Jakarta Sans, Manrope) and icon glyphs (Material Symbols Outlined) via `fonts.googleapis.com` and `fonts.gstatic.com`. Client IP addresses and user agent headers are transmitted to Google during browser stylesheet and font file fetching. For zero-external-network privacy compliance or air-gapped deployments, these font files should be self-hosted statically in `client/public/fonts/`.
- **Zero Third-Party Image Hotlinking:** All UI sample photos, avatars, and icons are bundled locally as static SVGs in `client/public/` to prevent tracking or external referer leakage.

## Secure development
- Keep secrets in environment/secret management, never source control.
- Commit an `.env.example` with placeholders only.
- Pin and review dependencies; run dependency and secret scans where practical.
- Use least-privilege service accounts.
- Maintain audit events for sensitive changes without recording sensitive payloads.
- Document incident response and backup/restore procedures before public launch.
