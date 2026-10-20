import React, { useState, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { uploadRoomPhotos, type UploadProgress } from '../services/photoUploader';
import { downloadPhotosAsZip, triggerFileDownload, type DownloadProgress } from '../services/downloadManager';
import { exportRoomToGoogleDrive, type GoogleDriveExportProgress } from '../services/googleDriveExport';
import { formatBytes } from '../utils/imageOptimizer';

interface PhotoItem {
  id: string;
  url: string;
  alt: string;
  person: string;
  aspect: string;
  badge?: string;
  clusterLevel: 'Level 1: Confident' | 'Level 2: Uncertain' | 'Level 3: Unsorted';
  time: string;
}

const INITIAL_GALLERY_PHOTOS: PhotoItem[] = [
  {
    id: 'p1',
    url: '/placeholder-cover.svg',
    alt: 'Stunning vertical travel photo of silhouetted figures walking along tide pools of Inani Beach during sunset.',
    person: 'all',
    aspect: 'aspect-[3/4]',
    badge: 'Sunset Silhouette',
    clusterLevel: 'Level 1: Confident',
    time: '5:42 PM',
  },
  {
    id: 'p2',
    url: '/placeholder-cover.svg',
    alt: 'Golden sunset reflections over gentle waves on Inani Beach.',
    person: 'Tasnim',
    aspect: 'aspect-square',
    badge: 'Person 1 (Tasnim)',
    clusterLevel: 'Level 1: Confident',
    time: '5:30 PM',
  },
  {
    id: 'p3',
    url: '/placeholder-cover.svg',
    alt: 'Portrait of Rafiqul on sandy beach dunes in serene travel atmosphere.',
    person: 'Rafiqul',
    aspect: 'aspect-[3/4]',
    badge: 'Person 2 (Rafiqul)',
    clusterLevel: 'Level 1: Confident',
    time: '4:15 PM',
  },
  {
    id: 'p4',
    url: '/placeholder-cover.svg',
    alt: 'Portrait of Samira smiling in front of sea breeze horizon.',
    person: 'Samira',
    aspect: 'aspect-square',
    badge: 'Person 3 (Samira)',
    clusterLevel: 'Level 1: Confident',
    time: '3:45 PM',
  },
  {
    id: 'p5',
    url: '/placeholder-cover.svg',
    alt: 'Portrait of Tanvir laughing during coastal road trip.',
    person: 'Tanvir',
    aspect: 'aspect-[4/5]',
    badge: 'Person 4 (Tanvir)',
    clusterLevel: 'Level 1: Confident',
    time: '2:10 PM',
  },
  {
    id: 'p6',
    url: '/placeholder-cover.svg',
    alt: "Wide panoramic landscape of Cox's Bazar coastline.",
    person: 'unsorted',
    aspect: 'aspect-video',
    badge: 'Level 3: Unsorted (Scenic / No Face)',
    clusterLevel: 'Level 3: Unsorted',
    time: '1:20 PM',
  },
];

export const RoomAreaScreen: React.FC = () => {
  const { setScreen } = useAuth();

  const [photos, setPhotos] = useState<PhotoItem[]>(INITIAL_GALLERY_PHOTOS);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showUncertainReview] = useState(true);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [driveProgress, setDriveProgress] = useState<GoogleDriveExportProgress | null>(null);

  const roomCapacityLimit = 1000;
  const currentRoomPhotoCount = 136 + photos.length;
  const roomCapacityPercent = Math.min(100, Math.round((currentRoomPhotoCount / roomCapacityLimit) * 100));

  const filteredPhotos =
    activeFilter === 'all'
      ? photos
      : photos.filter((p) => p.person.toLowerCase() === activeFilter.toLowerCase());

  const handleCopyKey = () => {
    navigator.clipboard?.writeText('CB-9821');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setShowUploadModal(true);
    setIsUploading(true);

    try {
      const result = await uploadRoomPhotos('d0000000-0000-0000-0000-000000000001', fileList, (prog) => {
        setUploadProgress(prog);
      });

      // Append successfully uploaded photos to gallery feed
      if (result.successful.length > 0) {
        const newItems: PhotoItem[] = result.successful.map((item) => ({
          id: item.mediaId,
          url: URL.createObjectURL(item.optimized.blob),
          alt: `Newly uploaded photo (${formatBytes(item.optimized.compressedSizeBytes)})`,
          person: 'unsorted',
          aspect: 'aspect-square',
          badge: 'Level 3: Unsorted (New)',
          clusterLevel: 'Level 3: Unsorted',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));

        setPhotos((prev) => [...newItems, ...prev]);
      }
    } finally {
      setIsUploading(false);
      // Reset input value so same files can be re-selected if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadAllZip = async () => {
    setIsDownloadingZip(true);
    try {
      const itemsToDownload = photos.map((p, i) => ({
        id: p.id,
        url: p.url,
        filename: `Coxs_Bazar_Photo_${String(i + 1).padStart(3, '0')}.webp`,
      }));

      const zipBlob = await downloadPhotosAsZip("Cox's Bazar", itemsToDownload, (prog) => {
        setDownloadProgress(prog);
      });

      triggerFileDownload(zipBlob, "Coxs_Bazar_Winter_Escape_Photos.zip");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to download ZIP');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleExportToGoogleDrive = async () => {
    setIsExportingDrive(true);
    try {
      const itemsToExport = photos.map((p, i) => ({
        id: p.id,
        url: p.url,
        name: `Coxs_Bazar_${i + 1}.webp`,
      }));

      await exportRoomToGoogleDrive({
        roomName: "Cox's Bazar Winter Escape",
        photos: itemsExportFormat(itemsToExport),
        onProgress: (prog) => {
          setDriveProgress(prog);
        },
      });
    } finally {
      setIsExportingDrive(false);
    }
  };

  const itemsExportFormat = (items: Array<{ id: string; url: string; name: string }>) => items;

  return (
    <div className="bg-[#F8F5EF] text-[#101E1C] antialiased selection:bg-[#9CF2E8] selection:text-[#00201D] min-h-screen pb-28">
      {/* Hidden native file input for direct photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 1. TOP APP BAR */}
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-4 h-14 bg-[#F8F5EF]/85 backdrop-blur-md border-b border-[#E6E1D8] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Go back to dashboard"
            onClick={() => setScreen('home')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E1F1EE] active:scale-95 transition-all text-[#101E1C] focus:outline-none"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-[16px] font-bold text-[#101E1C] tracking-tight truncate max-w-[200px]">
              Cox's Bazar
            </h1>
            <p className="text-[11px] text-[#3E4947] flex items-center gap-1 font-medium">
              <span>Nov 12 - 15</span>
              <span>•</span>
              <span className="text-[#005C55] font-semibold">3-Level AI Active</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Share room"
            onClick={() => setShowInviteModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E1F1EE] active:scale-95 transition-all text-[#005C55]"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
          <button
            type="button"
            aria-label="Export room photos"
            onClick={() => setShowExportModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E1F1EE] active:scale-95 transition-all text-[#0F766E]"
            title="Download or Backup Album"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-lg mx-auto pt-16 px-4">
        {/* 2. EDITORIAL HERO BANNER */}
        <section className="relative rounded-2xl overflow-hidden shadow-card border border-[#E6E1D8] mt-2">
          <div className="relative h-44 w-full">
            <img
              src="/placeholder-cover.svg"
              alt="Cox's Bazar Sunset"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Top Room Key Badge */}
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={handleCopyKey}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#253331]/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 active:scale-95 transition-all focus:outline-none"
                title="Copy Room Key"
              >
                <span className="material-symbols-outlined text-[12px] text-[#FFAB69]">key</span>
                <span>{copiedKey ? 'COPIED!' : 'CB-9821'}</span>
                <span className="material-symbols-outlined text-[13px] text-[#BDC9C6] ml-0.5">
                  content_copy
                </span>
              </button>
            </div>

            {/* Bottom Title */}
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="material-symbols-outlined text-[14px] text-[#6FFBBE]">verified_user</span>
                <span className="text-[10px] tracking-wide text-[#D6E6E2] uppercase font-bold">
                  Private to Room Members
                </span>
              </div>
              <h2 className="text-[20px] font-bold tracking-tight text-white drop-shadow-xs">
                Cox's Bazar Winter Escape
              </h2>
            </div>
          </div>

          {/* Contributor Avatars & Invite Row */}
          <div className="p-3 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2.5 overflow-hidden">
                <img
                  className="w-8 h-8 rounded-full ring-2 ring-white object-cover"
                  src="/placeholder-avatar.svg"
                  alt="Tasnim"
                />
                <img
                  className="w-8 h-8 rounded-full ring-2 ring-white object-cover"
                  src="/placeholder-avatar.svg"
                  alt="Rafiq"
                />
                <img
                  className="w-8 h-8 rounded-full ring-2 ring-white object-cover"
                  src="/placeholder-avatar.svg"
                  alt="Tanvir"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[12px] text-[#101E1C] font-semibold">Tasnim (Host) + 3 others</span>
                <span className="text-[10px] text-[#3E4947]">Zero-egress Cloudflare R2</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#E2DDD4] bg-[#F8F5EF] text-[#101E1C] hover:bg-[#E1F1EE] active:scale-95 transition-all text-[12px] font-semibold"
            >
              <span className="material-symbols-outlined text-[15px] text-[#005C55]">person_add</span>
              <span>Invite</span>
            </button>
          </div>
        </section>

        {/* ROOM STORAGE QUOTA INDICATOR */}
        <section className="mt-3 p-2.5 bg-white rounded-xl border border-[#E6E1D8] shadow-xs">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-semibold text-[#101E1C] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#0F766E]">cloud_done</span>
              Room Storage Capacity
            </span>
            <span className="text-[#3E4947] font-medium">
              <strong className="text-[#0F766E]">{currentRoomPhotoCount}</strong> / {roomCapacityLimit} photos ({roomCapacityPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#E6E1D8] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                roomCapacityPercent > 90 ? 'bg-[#BA1A1A]' : 'bg-[#0F766E]'
              }`}
              style={{ width: `${roomCapacityPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-[#6E7977]">
            <span>WebP 2K auto-compressed</span>
            <span>30 days post-trip retention</span>
          </div>
        </section>

        {/* 3. QUICK ACTION BUTTONS */}
        <section className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerUpload}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 min-h-[48px] h-[50px] rounded-full bg-[#0F766E] text-white font-semibold text-[15px] tracking-wide hover:bg-[#005C55] active:scale-[0.98] transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            <span>Upload Photos</span>
          </button>
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center gap-1.5 px-4 min-h-[48px] h-[50px] rounded-full border border-[#E2DDD4] bg-white text-[#101E1C] hover:bg-[#F8F5EF] active:scale-[0.98] transition-all text-[14px] font-semibold shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-[#0F766E]">download</span>
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => alert('Playing Archival Memory Reel: Cox’s Bazar Sunset Highlight')}
            className="inline-flex items-center gap-1.5 px-3.5 min-h-[48px] h-[50px] rounded-full border border-[#E2DDD4] bg-white text-[#101E1C] hover:bg-[#F8F5EF] active:scale-[0.98] transition-all text-[14px] font-semibold shadow-xs"
            title="Archival Reel"
          >
            <span className="material-symbols-outlined text-[18px] text-[#8E4E14]">movie</span>
          </button>
        </section>

        {/* 4. LEVEL 2 — UNCERTAIN MATCH REVIEW CARD */}
        {showUncertainReview && (
          <section className="mt-4 p-3.5 bg-[#FFF8ED] rounded-xl border border-[#FFAB69]/40 shadow-xs text-left animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#8E4E14] text-[20px] shrink-0 mt-0.5">
                help_center
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-[#8E4E14]">
                    Level 2 — Uncertain Match Review
                  </h4>
                  <span className="text-[10px] font-semibold bg-[#FFDCC2] text-[#8E4E14] px-1.5 py-0.5 rounded-full">
                    3 Suggestions
                  </span>
                </div>
                <p className="text-[11px] text-[#553100] mt-0.5 leading-snug">
                  AI detected visual similarities without confident facial identity. Review and confirm matches.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 5. FILTER PILLS */}
        <section className="mt-4 text-left">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-bold text-[#101E1C]">Person Collections</h3>
            <span className="text-[11px] text-[#0F766E] font-semibold">Anonymous Visual AI</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-left">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#005C55] text-white border-[#005C55]'
                  : 'bg-white border-[#E2DDD4] text-[#101E1C] hover:border-[#005C55]'
              }`}
            >
              <span>All Moments</span>
              <span className="px-1.5 rounded-full bg-[#E1F1EE] text-[#005C55] text-[10px] font-bold">
                {photos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('Tasnim')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                activeFilter === 'Tasnim'
                  ? 'bg-[#005C55] text-white border-[#005C55]'
                  : 'bg-white border-[#E2DDD4] text-[#101E1C] hover:border-[#005C55]'
              }`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-[#0F766E]">
                <img className="w-full h-full object-cover" src="/placeholder-avatar.svg" alt="Tasnim" />
              </div>
              <span>Tasnim</span>
              <span className="px-1.5 rounded-full bg-[#E1F1EE] text-[#3E4947] text-[10px] font-bold">42</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('Rafiqul')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                activeFilter === 'Rafiqul'
                  ? 'bg-[#005C55] text-white border-[#005C55]'
                  : 'bg-white border-[#E2DDD4] text-[#101E1C] hover:border-[#005C55]'
              }`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-[#0F766E]">
                <img className="w-full h-full object-cover" src="/placeholder-avatar.svg" alt="Rafiqul" />
              </div>
              <span>Rafiqul</span>
              <span className="px-1.5 rounded-full bg-[#E1F1EE] text-[#3E4947] text-[10px] font-bold">36</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('unsorted')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                activeFilter === 'unsorted'
                  ? 'bg-[#BA1A1A] text-white border-[#BA1A1A]'
                  : 'bg-white border-[#E2DDD4] text-[#BA1A1A] hover:border-[#BA1A1A]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">help</span>
              <span>Level 3: Unsorted</span>
            </button>
          </div>
        </section>

        {/* 6. CURATED PHOTO GALLERY GRID */}
        <section className="mt-5 text-left">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-[#101E1C]">Gallery</span>
              <span className="text-[12px] text-[#3E4947]">
                {activeFilter === 'unsorted'
                  ? '• Level 3 Unmatched Photos'
                  : activeFilter === 'all'
                  ? `• ${photos.length} Photos`
                  : `• ${activeFilter}`}
              </span>
            </div>
            <span className="text-[11px] text-[#6E7977] font-medium">Timeline View</span>
          </div>

          {/* Masonry / Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className={`relative group rounded-xl overflow-hidden bg-white border border-[#E6E1D8] shadow-xs cursor-pointer ${photo.aspect}`}
              >
                <img
                  src={photo.url}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {photo.badge && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold max-w-[90%] truncate">
                    {photo.badge}
                  </span>
                )}

                <span className="absolute bottom-2 right-2 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {photo.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* UPLOAD PROGRESS MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-dock border border-[#E6E1D8] text-left">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E] text-[22px]">
                  {uploadProgress?.stage === 'error' ? 'error' : uploadProgress?.stage === 'done' ? 'check_circle' : 'cloud_upload'}
                </span>
                <h3 className="text-[16px] font-bold text-[#101E1C]">
                  {uploadProgress?.stage === 'done'
                    ? 'Upload Complete'
                    : uploadProgress?.stage === 'error'
                    ? 'Upload Failed'
                    : 'Compressing & Uploading'}
                </h3>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="w-7 h-7 rounded-full bg-[#E1F1EE] flex items-center justify-center text-[#3E4947]"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Error Message */}
            {uploadProgress?.errorMessage && (
              <div className="p-3 mb-3 bg-[#FFDAD6] border border-[#BA1A1A]/30 rounded-xl text-[12px] text-[#BA1A1A] font-medium">
                {uploadProgress.errorMessage}
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[11px] text-[#3E4947] mb-1">
                <span>
                  Photo {uploadProgress?.currentPhotoIndex || 1} of {uploadProgress?.totalPhotos || 1}
                </span>
                <span className="font-bold text-[#0F766E]">{uploadProgress?.percent || 0}%</span>
              </div>
              <div className="w-full bg-[#E6E1D8] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#0F766E] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress?.percent || 0}%` }}
                />
              </div>
            </div>

            {/* Stage Info */}
            <p className="text-[12px] text-[#3E4947] mb-3">
              {uploadProgress?.stage === 'compressing' && '🖼️ Converting to 2K WebP via Canvas...'}
              {uploadProgress?.stage === 'uploading' && '☁️ Streaming directly to zero-egress Cloudflare R2...'}
              {uploadProgress?.stage === 'confirming' && '⚡ Registering media metadata...'}
              {uploadProgress?.stage === 'done' && '🎉 All photos successfully uploaded and ready for clustering!'}
            </p>

            {/* Compression Stats */}
            {uploadProgress && uploadProgress.originalBytesTotal > 0 && (
              <div className="p-2.5 bg-[#F8F5EF] rounded-xl border border-[#E2DDD4] text-[11px] text-[#3E4947] mb-4">
                <div className="flex justify-between mb-1">
                  <span>Original Size:</span>
                  <span className="font-semibold">{formatBytes(uploadProgress.originalBytesTotal)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Optimized WebP:</span>
                  <span className="font-semibold text-[#0F766E]">{formatBytes(uploadProgress.compressedBytesTotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#005C55] pt-1 border-t border-[#E6E1D8]">
                  <span>Bandwidth & Storage Saved:</span>
                  <span>{uploadProgress.savedPercent}%</span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isUploading}
              onClick={() => setShowUploadModal(false)}
              className="w-full py-2.5 rounded-full bg-[#0F766E] text-white text-[13px] font-semibold hover:bg-[#005C55] disabled:opacity-50 transition-all"
            >
              {isUploading ? 'Uploading...' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* EXPORT DUAL MODAL (ZIP / GOOGLE DRIVE) */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-dock border border-[#E6E1D8] text-left">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E] text-[22px]">archive</span>
                <h3 className="text-[17px] font-bold text-[#101E1C]">Export Album</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="w-7 h-7 rounded-full bg-[#E1F1EE] flex items-center justify-center text-[#3E4947]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <p className="text-[12px] text-[#3E4947] mb-4">
              Photos stay in active room storage for 30 days. Export now to keep all original-quality moments forever.
            </p>

            {/* Option 1: Save to Phone / Download ZIP */}
            <div className="p-3.5 bg-[#F8F5EF] rounded-xl border border-[#E2DDD4] mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0F766E] text-[20px]">phone_iphone</span>
                  <span className="text-[13px] font-bold text-[#101E1C]">Save to Phone / ZIP</span>
                </div>
                <span className="text-[10px] font-semibold text-[#005C55] bg-[#E1F1EE] px-2 py-0.5 rounded-full">
                  Fast & Offline
                </span>
              </div>
              <p className="text-[11px] text-[#6E7977] mb-2.5">
                Packages all {photos.length} photos directly inside browser memory into a ZIP archive without server egress.
              </p>

              {downloadProgress && isDownloadingZip && (
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-[#3E4947] mb-0.5">
                    <span>{downloadProgress.currentFilename}</span>
                    <span className="font-bold text-[#0F766E]">{downloadProgress.percent}%</span>
                  </div>
                  <div className="w-full bg-[#E6E1D8] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#0F766E] h-full" style={{ width: `${downloadProgress.percent}%` }} />
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={isDownloadingZip}
                onClick={handleDownloadAllZip}
                className="w-full py-2 rounded-full bg-[#0F766E] text-white text-[12px] font-semibold hover:bg-[#005C55] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>{isDownloadingZip ? 'Preparing ZIP...' : 'Download Full Album (ZIP)'}</span>
              </button>
            </div>

            {/* Option 2: Google Drive Backup */}
            <div className="p-3.5 bg-[#F8F5EF] rounded-xl border border-[#E2DDD4]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8E4E14] text-[20px]">add_to_drive</span>
                  <span className="text-[13px] font-bold text-[#101E1C]">Export to Google Drive</span>
                </div>
                <span className="text-[10px] font-semibold text-[#8E4E14] bg-[#FFDCC2] px-2 py-0.5 rounded-full">
                  Cloud Backup
                </span>
              </div>
              <p className="text-[11px] text-[#6E7977] mb-2.5">
                Creates a folder `ChobiDeh - Cox's Bazar` in your personal Google Drive with non-sensitive drive.file scope.
              </p>

              {driveProgress && (
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-[#3E4947] mb-0.5">
                    <span>{driveProgress.currentFileName || 'Processing...'}</span>
                    <span className="font-bold text-[#8E4E14]">
                      {driveProgress.uploadedFiles} / {driveProgress.totalFiles}
                    </span>
                  </div>
                  {driveProgress.folderUrl && driveProgress.stage === 'completed' && (
                    <a
                      href={driveProgress.folderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#005C55] font-semibold underline block mb-1"
                    >
                      Open in Google Drive ↗
                    </a>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={isExportingDrive}
                onClick={handleExportToGoogleDrive}
                className="w-full py-2 rounded-full border border-[#BDC9C6] bg-white text-[#101E1C] text-[12px] font-semibold hover:bg-[#E1F1EE] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px] text-[#8E4E14]">cloud_upload</span>
                <span>{isExportingDrive ? 'Exporting to Drive...' : '1-Click Export to Drive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loupe Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-dock border border-[#E6E1D8]">
            <div className="p-3 bg-white flex items-center justify-between border-b border-[#E6E1D8]">
              <div>
                <span className="text-[13px] font-bold text-[#005C55] block">
                  {selectedPhoto.badge || 'Photo View'}
                </span>
                <span className="text-[11px] text-[#3E4947] block">
                  Cluster Status: {selectedPhoto.clusterLevel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="w-8 h-8 rounded-full bg-[#E1F1EE] flex items-center justify-center text-[#3E4947]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.alt}
              className="w-full max-h-[60vh] object-contain bg-black"
            />
            <div className="p-3.5 bg-[#F8F5EF] flex items-center justify-between text-left">
              <div>
                <p className="text-[12px] font-semibold text-[#101E1C]">Cox's Bazar Beach Memories</p>
                <p className="text-[11px] text-[#6E7977]">Captured at {selectedPhoto.time}</p>
              </div>
              <button
                type="button"
                onClick={() => alert(`Assigned to collection: ${selectedPhoto.badge}`)}
                className="px-3 py-1.5 rounded-full bg-[#0F766E] text-white text-[12px] font-semibold hover:bg-[#005C55]"
              >
                Edit Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share / Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-dock border border-[#E6E1D8] text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold text-[#101E1C]">Invite to Room</h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="w-7 h-7 rounded-full bg-[#E1F1EE] flex items-center justify-center text-[#3E4947]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <p className="text-[13px] text-[#3E4947] mb-4">
              Share the secure room code with friends. Joining does not require face registration or selfies.
            </p>

            <div className="p-3 bg-[#F8F5EF] rounded-xl border border-[#E2DDD4] flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] text-[#6E7977] uppercase font-bold block">Room Key</span>
                <span className="text-[18px] font-mono font-bold tracking-wider text-[#005C55]">CB-9821</span>
              </div>
              <button
                type="button"
                onClick={handleCopyKey}
                className="px-3 py-1.5 rounded-full bg-[#0F766E] text-white text-[12px] font-semibold hover:bg-[#005C55] transition-all"
              >
                {copiedKey ? 'Copied!' : 'Copy Key'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowInviteModal(false);
                alert('Invite link copied: https://chobideh.app/join/CB-9821');
              }}
              className="w-full py-2.5 rounded-full border border-[#BDC9C6] text-[13px] font-semibold text-[#101E1C] hover:bg-[#E1F1EE] transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">link</span>
              <span>Copy Full Link</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
