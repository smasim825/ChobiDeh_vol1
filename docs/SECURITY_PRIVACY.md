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

## Biometric data
- Explicit, informed opt-in before creating face embeddings.
- Provide a clear purpose and retention policy.
- Minimize what is collected and stored.
- Encrypt data in transit and at rest; tightly restrict access.
- Never place raw embeddings in application logs or analytics.
- Support withdrawal and deletion, including derived match records and queued jobs.
- Define how backups expire and explain any unavoidable delay.
- Do not use uploaded photos or embeddings to train unrelated models by default.
- Provide an alternative experience for users who decline enrollment.

## Multi-tenant isolation
- All media, person records, jobs, and collections must include or resolve to an authorized room scope.
- Test cross-room access denial.
- Ensure object storage access cannot bypass API authorization.
- Re-check membership when issuing download links and processing jobs.

## Secure development
- Keep secrets in environment/secret management, never source control.
- Commit an `.env.example` with placeholders only.
- Pin and review dependencies; run dependency and secret scans where practical.
- Use least-privilege service accounts.
- Maintain audit events for sensitive changes without recording sensitive payloads.
- Document incident response and backup/restore procedures before public launch.
