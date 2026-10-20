# Storage & Media Pipeline Implementation Plan

**Target Application:** ChobiDeh (Shared Trip-Photo Platform)  
**Status:** Approved Architecture Plan  
**Target Audience:** Engineering Team & Antigravity AI Agents  
**Decision Reference:** Evaluated and confirmed following Google Drive POC experiments (see Option B evaluation). Central photo storage uses **Cloudflare R2 (S3-compatible)** with **direct pre-signed URLs**, **browser-side WebP compression**, **room quotas**, and **dual export capabilities** (Phone Download + Google Drive Backup).

---

## 1. Architectural Blueprint & Core Principles

```
+-----------------------------------------------------------------------------------------+
|                                    CHOBIDEH CLIENT                                      |
|  1. Select Photos -> 2. Browser Canvas WebP Compression -> 3. Request Presigned PUT URL |
+-----------------------------------------------------------------------------------------+
                                   |                               |
                 1. Upload Intent  |                               | 2. Direct Binary PUT
                 (Metadata only)   |                               |    (Bypasses Server)
                                   v                               v
                     +---------------------------+    +---------------------------+
                     |   CHOBIDEH API / SERVER   |    |       CLOUDFLARE R2       |
                     |  - Validates Room Limits  |    |     (S3-Compatible)       |
                     |  - Enforces Member Auth   |    |  - Zero Egress Bandwidth  |
                     |  - Generates Signed URLs  |    |  - 10 GB Free Storage     |
                     +---------------------------+    +---------------------------+
                                   |                               ^
                                   | 3. Confirm Upload             | Direct CDN Read
                                   v                               | (Dhaka BDIX Speed)
                     +---------------------------+                 |
                     |    SUPABASE POSTGRESQL    |                 |
                     |  - Photos Table           |-----------------+
                     |  - Room Membership RLS    |
                     +---------------------------+
                                   |
                   +---------------+---------------+
                   |                               |
                   v                               v
      [ 📥 Save to Phone / ZIP ]      [ ☁️ Export to Google Drive ]
        - Direct browser stream         - 1-click cloud-to-cloud copy
        - Client-side JSZip             - Uses Google Drive `drive.file`
```

### Guiding Principles:
1. **Zero Server Proxying for Media:** The API server must NEVER handle photo byte streams. Photos upload directly from the client to Cloudflare R2 and download directly from R2 edge. This prevents server crashes and eliminates bandwidth bills.
2. **Predictable Free Operation:**
   - Client-side WebP compression reduces 12 MB camera photos to **~400 KB – 600 KB** (90% space reduction with zero human-perceptible quality loss).
   - Each trip room is capped at **1,000 photos** (~400 MB per room).
   - Up to 25 full active rooms run simultaneously inside Cloudflare R2's **10 GB 100% Free Tier**.
   - Cloudflare R2 charges **$0.00 egress fees** (unlimited free downloads).
3. **Graceful Retention & Lifecycles:**
   - Photos remain in active room storage for **30 days** post-trip.
   - Users are prompted with two primary export actions: **"Save to Phone"** and **"Export Album to Google Drive"**.

---

## 2. Technical Stack & Dependencies

### Backend / Server:
* `@aws-sdk/client-s3`: S3-compatible client for Cloudflare R2.
* `@aws-sdk/s3-request-presigner`: Generates short-lived `getSignedUrl` for PUT (upload) and GET (download).
* `googleapis`: For Google Drive OAuth 2.0 and Album Export (`drive.file` scope).
* `supabase-js`: Database operations and Row-Level Security (RLS).

### Frontend / Client:
* `browser-image-compression` (or Native Canvas API): Compresses images to WebP before upload.
* `jszip` & `file-saver`: Client-side multi-photo ZIP download directly on phone/laptop.
* `@tanstack/react-virtual`: Virtual scrolling to render 1,000-photo galleries with only 12 DOM elements.

---

## 3. Step-by-Step Implementation Tasks for Antigravity

### Phase 1: Cloudflare R2 Infrastructure & S3 Client

#### Task 1.1: Environment Configuration
Add to `.env` / server configuration:
```env
# Cloudflare R2 Credentials
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=chobideh-photos
R2_PUBLIC_DOMAIN=https://photos.chobideh.com # Optional custom domain / CDN
```

#### Task 1.2: Implement R2 Service Module (`server/services/r2Service.ts`)
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function createPresignedUploadUrl(roomId: string, photoId: string, mimeType: string) {
  const key = `rooms/${roomId}/photos/${photoId}.${mimeType === 'image/webp' ? 'webp' : 'jpg'}`;
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: mimeType,
  });

  // URL expires in 15 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  return { uploadUrl, key };
}

export async function createPresignedDownloadUrl(key: string, originalName?: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ResponseContentDisposition: originalName ? `attachment; filename="${encodeURIComponent(originalName)}"` : undefined,
  });

  // URL expires in 1 hour
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function deleteR2Object(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });
  return await s3Client.send(command);
}
```

---

### Phase 2: Database Schema & Room Quota Constraints

#### Task 2.1: Database Migration (`supabase/migrations/20261021_media_schema.sql`)
```sql
-- Photos table
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES auth.users(id),
    r2_key TEXT NOT NULL,
    thumbnail_r2_key TEXT,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'image/webp',
    size_bytes BIGINT NOT NULL,
    width INT,
    height INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'))
);

-- Index for fast room lookups
CREATE INDEX IF NOT EXISTS idx_photos_room_id ON public.photos(room_id);

-- Enforce Room Photo Cap (Max 1,000 photos per room)
CREATE OR REPLACE FUNCTION check_room_photo_cap() 
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.photos WHERE room_id = NEW.room_id AND status = 'active') >= 1000 THEN
        RAISE EXCEPTION 'This room has reached the maximum capacity of 1,000 photos.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_room_photo_cap
BEFORE INSERT ON public.photos
FOR EACH ROW EXECUTE FUNCTION check_room_photo_cap();
```

---

### Phase 3: Client-Side Compression & Upload Pipeline

#### Task 3.1: Browser Image Pre-Processing (`client/src/utils/imageOptimizer.ts`)
```typescript
/**
 * Compresses camera image in the browser to high-quality 2K WebP.
 * Drops file size from 12 MB -> ~400 KB with no human-perceptible quality drop.
 */
export async function optimizePhotoForUpload(file: File): Promise<{
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 2048;
        const MAX_HEIGHT = 2048;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context unavailable'));

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to modern WebP at 85% quality
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Compression failed'));
            resolve({ blob, mimeType: 'image/webp', width, height });
          },
          'image/webp',
          0.85
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

#### Task 3.2: Direct-to-R2 Upload Flow (`client/src/services/photoUploader.ts`)
1. User selects 1 to 50 photos.
2. For each photo:
   - Call `POST /api/rooms/:roomId/photos/upload-intent` $\rightarrow$ Server checks room limit and returns `{ photoId, uploadUrl, key }`.
   - Compress photo client-side via `optimizePhotoForUpload`.
   - Execute `fetch(uploadUrl, { method: 'PUT', body: compressedBlob, headers: { 'Content-Type': 'image/webp' } })`.
   - Call `POST /api/rooms/:roomId/photos/confirm` with metadata `{ photoId, key, sizeBytes, width, height }`.
3. Client displays live progress indicator.

---

### Phase 4: High-Performance Gallery Grid

#### Task 4.1: Fast Responsive Photo Feed
* Use CSS Grid with `loading="lazy"` and `decoding="async"`.
* Render images using signed R2 URLs (or custom domain).
* Integrate virtual scrolling (`@tanstack/react-virtual`) when photo count exceeds 60 photos in a single view.

---

### Phase 5: Dual Export Implementation

#### Task 5.1: "Save to Phone / Download All" (`client/src/features/exports/PhoneDownload.ts`)
* Uses `JSZip` in the browser.
* Fetches signed download URLs for room photos.
* Batches downloads in groups of 5 parallel streams.
* Generates `Trip_Photos.zip` directly in the browser and triggers native file download without burdening the backend.

#### Task 5.2: "Export to Google Drive" (`server/services/googleDriveExport.ts`)
* Implements Google OAuth with `https://www.googleapis.com/auth/drive.file` scope (Non-Sensitive).
* When a user clicks **"Export Album to Google Drive"**:
  1. Creates a folder in the user's Drive: `ChobiDeh - [Room Name]`.
  2. Spawns an asynchronous job to copy photos from Cloudflare R2 into the user's Google Drive.
  3. Sends notification: *"Your album has been saved to your Google Drive!"*

---

## 4. Verification & Acceptance Criteria for Testing Agent

Before marking the implementation complete, the implementing agent must verify:
- [ ] Direct R2 upload succeeds using presigned URL without photo bytes passing through the backend server.
- [ ] Image compression correctly converts JPEG/PNG $\ge 8$ MB to $\le 600$ KB WebP.
- [ ] Room cap trigger blocks upload #1,001 with a clean, user-friendly error message.
- [ ] Download and view URLs work with proper `Content-Disposition`.
- [ ] Client-side ZIP download generates a valid, extractable ZIP file.
- [ ] Google Drive export successfully creates folder and files using `drive.file` scope.
