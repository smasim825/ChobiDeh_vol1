/**
 * Direct-to-Storage Photo Uploader for ChobiDeh
 *
 * Implements zero server proxying:
 * 1. Calls create_upload RPC (validates room member & 1,000 photo cap)
 * 2. Compresses photo to WebP via Canvas (12 MB -> ~500 KB)
 * 3. Direct binary PUT to storage (Cloudflare R2 presigned URL or Supabase storage)
 * 4. Calls confirm_upload RPC to finalize upload
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { optimizePhotoForUpload, type OptimizedImageResult } from '../utils/imageOptimizer';

export interface UploadProgress {
  currentPhotoIndex: number;
  totalPhotos: number;
  currentPhotoName: string;
  stage: 'compressing' | 'uploading' | 'confirming' | 'done' | 'error';
  percent: number; // 0-100
  originalBytesTotal: number;
  compressedBytesTotal: number;
  savedPercent: number;
  errorMessage?: string;
}

export interface UploadResult {
  mediaId: string;
  storageKey: string;
  optimized: OptimizedImageResult;
}

export interface UploadBatchResponse {
  successful: UploadResult[];
  failed: Array<{ file: File; error: string }>;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
}

/**
 * Uploads a list of user-selected photos to a trip room.
 */
export async function uploadRoomPhotos(
  roomId: string,
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadBatchResponse> {
  const successful: UploadResult[] = [];
  const failed: Array<{ file: File; error: string }> = [];

  let originalBytesTotal = 0;
  let compressedBytesTotal = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const photoIndex = i + 1;

    try {
      // 1. Stage: Compressing
      onProgress?.({
        currentPhotoIndex: photoIndex,
        totalPhotos: files.length,
        currentPhotoName: file.name,
        stage: 'compressing',
        percent: Math.round(((photoIndex - 1) / files.length) * 100 + (1 / files.length) * 30),
        originalBytesTotal,
        compressedBytesTotal,
        savedPercent:
          originalBytesTotal > 0
            ? Math.round(((originalBytesTotal - compressedBytesTotal) / originalBytesTotal) * 100)
            : 0,
      });

      const optimized = await optimizePhotoForUpload(file);
      originalBytesTotal += optimized.originalSizeBytes;
      compressedBytesTotal += optimized.compressedSizeBytes;

      // 2. Stage: Upload Intent (RPC)
      onProgress?.({
        currentPhotoIndex: photoIndex,
        totalPhotos: files.length,
        currentPhotoName: file.name,
        stage: 'uploading',
        percent: Math.round(((photoIndex - 1) / files.length) * 100 + (1 / files.length) * 60),
        originalBytesTotal,
        compressedBytesTotal,
        savedPercent:
          originalBytesTotal > 0
            ? Math.round(((originalBytesTotal - compressedBytesTotal) / originalBytesTotal) * 100)
            : 0,
      });

      let mediaId = `sim-${Date.now()}-${photoIndex}`;
      let storageKey = `rooms/${roomId}/${mediaId}.webp`;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);

      if (isSupabaseConfigured && supabase && isUuid) {
        // Call create_upload RPC
        const { data: uploadIntent, error: intentError } = await supabase.rpc('create_upload', {
          target_room_id: roomId,
          content_type: optimized.mimeType,
          size_bytes: optimized.compressedSizeBytes,
        });

        if (intentError) {
          if (intentError.message?.includes('1,000 photos') || intentError.message?.includes('maximum capacity')) {
            throw new Error('Room has reached the maximum capacity of 1,000 photos.');
          }
          throw new Error(intentError.message || 'Failed to initialize upload intent.');
        }

        mediaId = uploadIntent.media_id;
        storageKey = uploadIntent.storage_key || storageKey;

        // Binary upload: directly to storage
        // If upload_url is provided (R2 presigned URL), PUT to it; otherwise use supabase storage upload
        if (uploadIntent.upload_url) {
          const putRes = await fetch(uploadIntent.upload_url, {
            method: 'PUT',
            headers: {
              'Content-Type': optimized.mimeType,
            },
            body: optimized.blob,
          });

          if (!putRes.ok) {
            throw new Error(`Direct storage upload failed with status ${putRes.status}`);
          }
        } else {
          // Supabase storage bucket fallback (room-media)
          const { error: storageError } = await supabase.storage
            .from('room-media')
            .upload(storageKey, optimized.blob, {
              contentType: optimized.mimeType,
              upsert: true,
            });

          if (storageError) {
            throw new Error(storageError.message || 'Storage upload failed.');
          }
        }

        // 3. Stage: Confirm Upload
        onProgress?.({
          currentPhotoIndex: photoIndex,
          totalPhotos: files.length,
          currentPhotoName: file.name,
          stage: 'confirming',
          percent: Math.round(((photoIndex - 1) / files.length) * 100 + (1 / files.length) * 90),
          originalBytesTotal,
          compressedBytesTotal,
          savedPercent: Math.round(((originalBytesTotal - compressedBytesTotal) / originalBytesTotal) * 100),
        });

        const { error: confirmError } = await supabase.rpc('confirm_upload', {
          target_media_id: mediaId,
          actual_size_bytes: optimized.compressedSizeBytes,
          actual_content_type: optimized.mimeType,
        });

        if (confirmError) {
          console.warn('Confirmation RPC warning:', confirmError);
        }
      } else {
        // Offline / Simulation mode (when running client without backend credentials)
        await new Promise((r) => setTimeout(r, 120));
      }

      successful.push({
        mediaId,
        storageKey,
        optimized,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown upload error';
      failed.push({ file, error: message });

      onProgress?.({
        currentPhotoIndex: photoIndex,
        totalPhotos: files.length,
        currentPhotoName: file.name,
        stage: 'error',
        percent: Math.round((photoIndex / files.length) * 100),
        originalBytesTotal,
        compressedBytesTotal,
        savedPercent:
          originalBytesTotal > 0
            ? Math.round(((originalBytesTotal - compressedBytesTotal) / originalBytesTotal) * 100)
            : 0,
        errorMessage: message,
      });

      // If room capacity reached, abort remaining uploads
      if (message.includes('1,000 photos') || message.includes('maximum capacity')) {
        break;
      }
    }
  }

  // Done stage
  onProgress?.({
    currentPhotoIndex: files.length,
    totalPhotos: files.length,
    currentPhotoName: 'Complete',
    stage: 'done',
    percent: 100,
    originalBytesTotal,
    compressedBytesTotal,
    savedPercent:
      originalBytesTotal > 0
        ? Math.round(((originalBytesTotal - compressedBytesTotal) / originalBytesTotal) * 100)
        : 0,
  });

  return {
    successful,
    failed,
    totalOriginalBytes: originalBytesTotal,
    totalCompressedBytes: compressedBytesTotal,
  };
}
