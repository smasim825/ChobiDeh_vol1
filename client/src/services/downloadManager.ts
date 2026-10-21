/**
 * Client-Side Photo Export & ZIP Downloader for ChobiDeh
 *
 * Implements "Save to Phone / Download All (ZIP)" directly in browser memory:
 * - Direct CDN / R2 image stream downloads
 * - Batches in chunks of 5 parallel streams to prevent mobile memory spikes
 * - Compresses archive into [RoomName]_Photos.zip using JSZip
 * - Triggers native browser download directly on device
 * - Zero proxying through API server (zero server egress, zero CPU burden)
 */

import JSZip from 'jszip';

export interface DownloadItem {
  id: string;
  url: string;
  filename?: string;
}

export interface DownloadProgress {
  fetched: number;
  total: number;
  percent: number;
  currentFilename: string;
  stage: 'fetching' | 'compressing_zip' | 'done' | 'error';
  errorMessage?: string;
}

/**
 * Downloads room photos in parallel batches and creates a ZIP file directly in the browser.
 */
export async function downloadPhotosAsZip(
  roomName: string,
  photos: DownloadItem[],
  onProgress?: (progress: DownloadProgress) => void
): Promise<Blob> {
  if (photos.length === 0) {
    throw new Error('No photos to download.');
  }

  const zip = new JSZip();
  const sanitizedRoomName = roomName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Trip';
  const folder = zip.folder(`${sanitizedRoomName}_Photos`) || zip;

  let fetchedCount = 0;
  const BATCH_SIZE = 5;

  // Process photos in chunks of 5 to protect mobile browser RAM
  for (let i = 0; i < photos.length; i += BATCH_SIZE) {
    const chunk = photos.slice(i, i + BATCH_SIZE);

    await Promise.all(
      chunk.map(async (photo, chunkIndex) => {
        const itemNumber = i + chunkIndex + 1;
        const filename = photo.filename || `Photo_${String(itemNumber).padStart(3, '0')}.webp`;

        onProgress?.({
          fetched: fetchedCount,
          total: photos.length,
          percent: Math.round((fetchedCount / photos.length) * 80),
          currentFilename: filename,
          stage: 'fetching',
        });

        try {
          const res = await fetch(photo.url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const blob = await res.blob();
          folder.file(filename, blob);
        } catch {
          // If direct fetch fails (e.g. cross-origin placeholder in dev), provide a fallback text/stub
          folder.file(
            filename.replace(/\.[^/.]+$/, '') + '.txt',
            `Photo ${photo.id} could not be downloaded directly due to network/CORS restrictions.`
          );
        }

        fetchedCount++;
        onProgress?.({
          fetched: fetchedCount,
          total: photos.length,
          percent: Math.round((fetchedCount / photos.length) * 80),
          currentFilename: filename,
          stage: 'fetching',
        });
      })
    );
  }

  // 2. Stage: Compressing ZIP
  onProgress?.({
    fetched: photos.length,
    total: photos.length,
    percent: 85,
    currentFilename: 'Packaging ZIP file...',
    stage: 'compressing_zip',
  });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.({
        fetched: photos.length,
        total: photos.length,
        percent: 80 + Math.round((metadata.percent / 100) * 20),
        currentFilename: 'Generating ZIP archive...',
        stage: 'compressing_zip',
      });
    }
  );

  // 3. Stage: Done
  onProgress?.({
    fetched: photos.length,
    total: photos.length,
    percent: 100,
    currentFilename: `${sanitizedRoomName}_Photos.zip`,
    stage: 'done',
  });

  return zipBlob;
}

/**
 * Triggers native device file save from a Blob.
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 2000);
}
