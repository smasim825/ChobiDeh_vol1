import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateTargetDimensions, formatBytes, optimizePhotoForUpload } from '../utils/imageOptimizer';
import { downloadPhotosAsZip } from '../services/downloadManager';
import { exportRoomToGoogleDrive } from '../services/googleDriveExport';
import { uploadRoomPhotos } from '../services/photoUploader';
import { supabase } from '../lib/supabase';

describe('Storage & Media Pipeline Unit Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('imageOptimizer utilities', () => {
    it('calculates target dimensions capped at 2048 for landscape images', () => {
      const { width, height } = calculateTargetDimensions(4096, 2048, 2048);
      expect(width).toBe(2048);
      expect(height).toBe(1024);
    });

    it('calculates target dimensions capped at 2048 for portrait images', () => {
      const { width, height } = calculateTargetDimensions(2048, 4096, 2048);
      expect(width).toBe(1024);
      expect(height).toBe(2048);
    });

    it('preserves small dimensions below max bounds without enlargement', () => {
      const { width, height } = calculateTargetDimensions(1200, 800, 2048);
      expect(width).toBe(1200);
      expect(height).toBe(800);
    });

    it('formats bytes correctly into human readable strings', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(5242880)).toBe('5 MB');
    });

    it('handles fallback in non-browser/mock environment gracefully', async () => {
      const file = new File(['mock content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await optimizePhotoForUpload(file);
      expect(result).toHaveProperty('blob');
      expect(result.mimeType).toBe('image/webp');
      expect(result.originalSizeBytes).toBe(file.size);
    });
  });

  describe('downloadManager (JSZip export)', () => {
    it('throws error when no photos provided', async () => {
      await expect(downloadPhotosAsZip('Trip', [])).rejects.toThrow('No photos to download.');
    });

    it('generates a valid ZIP blob with progress updates', async () => {
      // Mock fetch with full response interface
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(new Blob(['fake-image-bytes'], { type: 'image/webp' })),
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as unknown as Response);

      const progressLogs: number[] = [];
      const photos = [
        { id: '1', url: 'https://example.com/p1.webp', filename: 'photo1.webp' },
        { id: '2', url: 'https://example.com/p2.webp', filename: 'photo2.webp' },
      ];

      const zipBlob = await downloadPhotosAsZip('Coxs_Bazar', photos, (prog) => {
        progressLogs.push(prog.percent);
      });

      expect(zipBlob).toBeDefined();
      expect(zipBlob.size).toBeGreaterThan(0);
      expect(progressLogs.length).toBeGreaterThan(0);
      expect(progressLogs[progressLogs.length - 1]).toBe(100);
    });
  });

  describe('googleDriveExport service', () => {
    it('throws error when photos array is empty', async () => {
      await expect(exportRoomToGoogleDrive({ roomName: 'Test', photos: [] })).rejects.toThrow(
        'No photos to export.'
      );
    });

    it('runs simulated cloud-to-cloud export in offline/demo mode', async () => {
      const stages: string[] = [];
      const photos = [{ id: '1', url: 'https://example.com/p1.webp', name: 'p1.webp' }];

      const result = await exportRoomToGoogleDrive({
        roomName: 'Coxs Bazar',
        photos,
        onProgress: (prog) => {
          stages.push(prog.stage);
        },
      });

      expect(result.success).toBe(true);
      expect(result.folderUrl).toBe('https://drive.google.com/drive/my-drive');
      expect(stages).toContain('authorizing');
      expect(stages).toContain('creating_folder');
      expect(stages).toContain('completed');
    });
  });

  describe('photoUploader (direct-to-storage & room cap)', () => {
    it('processes batch uploads with progress reporting and Supabase RPCs', async () => {
      if (supabase) {
        vi.spyOn(supabase, 'rpc').mockImplementation(((fn: string) => {
          if (fn === 'create_upload') {
            return Promise.resolve({
              data: { media_id: 'mock-media-1', storage_key: 'rooms/r1/mock-media-1.webp' },
              error: null,
            });
          }
          if (fn === 'confirm_upload') {
            return Promise.resolve({ data: { success: true }, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        }) as any);

        vi.spyOn(supabase.storage, 'from').mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: 'rooms/r1' }, error: null }),
        } as any);
      }

      const files = [
        new File(['sample-image-1'], 'beach1.jpg', { type: 'image/jpeg' }),
        new File(['sample-image-2'], 'beach2.jpg', { type: 'image/jpeg' }),
      ];

      const stages: string[] = [];
      const result = await uploadRoomPhotos('d0000000-0000-0000-0000-000000000001', files, (prog) => {
        stages.push(prog.stage);
      });

      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(0);
      expect(stages).toContain('compressing');
      expect(stages).toContain('uploading');
      expect(stages).toContain('done');
    });

    it('aborts upload and surfaces user error when room reaches 1,000 photo cap', async () => {
      if (supabase) {
        vi.spyOn(supabase, 'rpc').mockImplementation(((fn: string) => {
          if (fn === 'create_upload') {
            return Promise.resolve({
              data: null,
              error: { message: 'Room has reached the maximum capacity of 1,000 photos.' },
            });
          }
          return Promise.resolve({ data: null, error: null });
        }) as any);
      }

      const files = [new File(['sample-image'], 'photo.jpg', { type: 'image/jpeg' })];
      const result = await uploadRoomPhotos('d0000000-0000-0000-0000-000000000001', files);

      expect(result.successful.length).toBe(0);
      expect(result.failed.length).toBe(1);
      expect(result.failed[0].error).toContain('maximum capacity of 1,000 photos');
    });
  });
});
