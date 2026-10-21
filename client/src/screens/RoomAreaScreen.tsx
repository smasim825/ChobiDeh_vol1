import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabase';
import type { PhotoItem, ReviewSuggestion, RestPhotoCategory } from '../types/room';
import { uploadRoomPhotos, type UploadProgress } from '../services/photoUploader';
import { downloadPhotosAsZip, triggerFileDownload, type DownloadProgress } from '../services/downloadManager';

// ==========================================
// Seed Data: Curated Photos across 3 Levels
// ==========================================

export interface RoomAreaScreenProps {
  initialPhotos?: PhotoItem[];
  initialSuggestions?: ReviewSuggestion[];
  roomTitle?: string;
}

export const RoomAreaScreen: React.FC<RoomAreaScreenProps> = ({
  initialPhotos = [],
  initialSuggestions = [],
  roomTitle = 'Shared Trip Album',
}) => {
  const { setScreen, currentUser } = useAuth();
  const navigate = useNavigate();
  const { id: routeRoomId } = useParams<{ id: string }>();

  const isRealRoomUuid = Boolean(
    routeRoomId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routeRoomId)
  );
  const effectiveRoomId = isRealRoomUuid ? (routeRoomId as string) : (routeRoomId || 'demo');

  const [roomData, setRoomData] = useState<{ id: string; name: string; join_slug?: string } | null>(null);

  useEffect(() => {
    if (!isRealRoomUuid || !supabase) return;
    let isMounted = true;

    // Fetch room metadata
    supabase
      .from('rooms')
      .select('id, name, join_slug')
      .eq('id', routeRoomId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (isMounted && data && !error) {
          setRoomData(data);
        }
      });

    // Fetch confirmed uploaded photos for this room
    supabase
      .from('media')
      .select('id, storage_key, content_type, size_bytes, created_at')
      .eq('room_id', routeRoomId)
      .eq('upload_status', 'uploaded')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(async ({ data: mediaList, error: mediaError }) => {
        if (!isMounted || mediaError || !mediaList || mediaList.length === 0) return;

        const loadedPhotos: PhotoItem[] = await Promise.all(
          mediaList.map(async (m: any) => {
            let photoUrl = '/placeholder-cover.svg';
            try {
              if (supabase) {
                const { data: signedData } = await supabase.storage
                  .from('room-media')
                  .createSignedUrl(m.storage_key, 3600);
                if (signedData?.signedUrl) {
                  photoUrl = signedData.signedUrl;
                }
              }
            } catch {
              // fallback placeholder if storage signed URL fails
            }

            return {
              id: m.id,
              url: photoUrl,
              alt: `Photo (${Math.round(m.size_bytes / 1024)} KB)`,
              aspect: 'aspect-square' as const,
              time: new Date(m.created_at).toLocaleDateString(),
              assignedPeople: [currentUser?.name || 'You'],
              clusterLevel: 'Level 1: Confident' as const,
              detectedFaceCount: 1,
              badge: `${currentUser?.name || 'You'} (Uploaded)`,
            };
          })
        );

        if (isMounted && loadedPhotos.length > 0) {
          setPhotos(loadedPhotos);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isRealRoomUuid, routeRoomId, currentUser]);

  const activeRoomTitle = roomData?.name || roomTitle;
  const activeRoomSlug = roomData?.join_slug ? roomData.join_slug.toUpperCase() : 'CB-9821';

  // Navigation: Primary sections
  // 'people' = Level 1 Confirmed Collections
  // 'suggestions' = Level 2 Close Match Review
  // 'rest' = Level 3 Rest Photos
  const [activeTab, setActiveTab] = useState<'people' | 'suggestions' | 'rest'>('people');

  // Level 1 Subfilter: Selected Person
  const [selectedPerson, setSelectedPerson] = useState<string>('all');

  // Level 3 Subfilter: Rest Photos Category
  const [restSubfilter, setRestSubfilter] = useState<RestPhotoCategory>('unknown_faces');

  // Photos State (Default empty for real rooms)
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);

  // Suggestions State (Level 2)
  const [suggestions, setSuggestions] = useState<ReviewSuggestion[]>(initialSuggestions);

  // Derived dynamically from uploaded photos instead of hardcoded demo names
  const identifiedPeople = Array.from(
    new Set(photos.flatMap((p) => p.assignedPeople || []))
  ).filter(Boolean);

  // History for Undo
  const [undoStack, setUndoStack] = useState<{
    suggestionId: string;
    previousState: ReviewSuggestion;
    actionDescription: string;
  }[]>([]);

  // Modals & UI helpers
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [selectedCandidatePerson, setSelectedCandidatePerson] = useState<string>('Rafiqul');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Direct Storage & Export State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const handleCopyKey = () => {
    navigator.clipboard?.writeText(activeRoomSlug);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const filesToUpload = Array.from(fileList);

    // Reset input so re-selecting same file works
    e.target.value = '';

    setIsUploading(true);
    setUploadProgress(null);

    try {
      const result = await uploadRoomPhotos(effectiveRoomId, filesToUpload, (prog) => {
        setUploadProgress(prog);
      });

      if (result.successful.length > 0) {
        // Add new photos directly into gallery state
        const newPhotoItems: PhotoItem[] = result.successful.map((item) => ({
          id: item.mediaId,
          url: URL.createObjectURL(item.optimized.blob),
          alt: `Uploaded photo (${Math.round(item.optimized.compressedSizeBytes / 1024)} KB)`,
          aspect: 'aspect-square',
          time: 'Just now',
          assignedPeople: [currentUser?.name || 'You'],
          clusterLevel: 'Level 1: Confident',
          detectedFaceCount: 1,
          badge: `${currentUser?.name || 'You'} (Uploaded)`,
        }));

        setPhotos((prev) => [...newPhotoItems, ...prev]);
        showAlert(`Successfully uploaded ${result.successful.length} photo(s) directly to Cloudflare R2!`);
      }

      if (result.failed.length > 0) {
        showAlert(`Failed to upload ${result.failed.length} photo(s): ${result.failed[0].error}`);
      }
    } catch (err: any) {
      showAlert(err.message || 'Photo upload encountered an issue.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDownloadZip = async () => {
    showAlert("Starting in-browser ZIP download of all authorized photos...");

    if (photos.length === 0) {
      showAlert('No photos available to download.');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(null);

    try {
      const downloadItems = photos.map((p, idx) => ({
        id: p.id,
        url: p.url,
        filename: `${p.badge || 'Photo'}_${idx + 1}.webp`,
      }));

      const zipBlob = await downloadPhotosAsZip("Cox's Bazar Tour 2026", downloadItems, (prog) => {
        setDownloadProgress(prog);
      });

      triggerFileDownload(zipBlob, 'Coxs_Bazar_Tour_2026_Photos.zip');
    } catch (err: any) {
      showAlert(err.message || 'Failed to download ZIP.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleGoogleDriveExport = () => {
    showAlert("Exporting album cloud-to-cloud directly into your Google Drive folder...");
  };

  // ==========================================
  // Level 2 Review Actions: Confirm, Correct, Reject, Undo
  // ==========================================

  // 1. Confirm AI Suggested Person
  const handleConfirmSuggestion = (sugId: string) => {
    const sug = suggestions.find((s) => s.id === sugId);
    if (!sug) return;

    // Save state for undo
    setUndoStack((prev) => [
      ...prev,
      { suggestionId: sugId, previousState: { ...sug }, actionDescription: `Confirmed as ${sug.suggestedPerson.name}` },
    ]);

    // Mark suggestion confirmed
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === sugId ? { ...s, status: 'confirmed', resolvedToPerson: sug.suggestedPerson } : s
      )
    );

    // Add photo to confirmed Level 1 photos
    const newConfirmedPhoto: PhotoItem = {
      id: sug.photoId,
      url: sug.photoUrl,
      alt: `Confirmed photo of ${sug.suggestedPerson.name}`,
      aspect: 'aspect-square',
      time: 'Just now',
      assignedPeople: [sug.suggestedPerson.name.replace(/Person \d+ \((.*)\)/, '$1')],
      clusterLevel: 'Level 1: Confident',
      detectedFaceCount: 1,
      badge: sug.suggestedPerson.name,
    };
    setPhotos((prev) => [newConfirmedPhoto, ...prev]);

    showAlert(`Confirmed! Photo assigned to ${sug.suggestedPerson.name}.`);
  };

  // 2. Explicitly Correct A -> B (e.g., AI suggested Rafiqul, user selects Samira)
  const handleCorrectSuggestion = (sugId: string, targetPersonName: string) => {
    const sug = suggestions.find((s) => s.id === sugId);
    if (!sug) return;

    // Save state for undo
    setUndoStack((prev) => [
      ...prev,
      {
        suggestionId: sugId,
        previousState: { ...sug },
        actionDescription: `Corrected from ${sug.suggestedPerson.name} to ${targetPersonName}`,
      },
    ]);

    // Resolve suggestion for A, assign to B
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === sugId
          ? {
              ...s,
              status: 'corrected',
              resolvedToPerson: { clusterId: `cluster_${targetPersonName.toLowerCase()}`, name: targetPersonName },
            }
          : s
      )
    );

    // Create confirmed assignment to Person B
    const newConfirmedPhoto: PhotoItem = {
      id: sug.photoId,
      url: sug.photoUrl,
      alt: `Photo corrected to ${targetPersonName}`,
      aspect: 'aspect-square',
      time: 'Just now',
      assignedPeople: [targetPersonName],
      clusterLevel: 'Level 1: Confident',
      detectedFaceCount: 1,
      badge: `${targetPersonName} (Corrected from ${sug.suggestedPerson.name})`,
    };
    setPhotos((prev) => [newConfirmedPhoto, ...prev]);

    showAlert(`Corrected! Removed pending suggestion for ${sug.suggestedPerson.name} and assigned photo to ${targetPersonName}. (Model weights are never altered).`);
  };

  // 3. Reject Suggestion
  // Rule: Rejection alone does NOT auto-assign to anyone else! Photo stays in Level 3 Unknown Faces.
  const handleRejectSuggestion = (sugId: string) => {
    const sug = suggestions.find((s) => s.id === sugId);
    if (!sug) return;

    setUndoStack((prev) => [
      ...prev,
      { suggestionId: sugId, previousState: { ...sug }, actionDescription: `Rejected suggestion for ${sug.suggestedPerson.name}` },
    ]);

    setSuggestions((prev) =>
      prev.map((s) => (s.id === sugId ? { ...s, status: 'rejected' } : s))
    );

    // Photo remains in Level 3 Rest (Unknown Faces)
    showAlert(`Suggestion rejected. Photo kept in Level 3 Rest Photos (Unknown Faces). Rejection does NOT auto-assign to another person.`);
  };

  // 4. Undo Last Action
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];

    // Revert suggestion
    setSuggestions((prev) =>
      prev.map((s) => (s.id === lastAction.suggestionId ? { ...lastAction.previousState } : s))
    );

    // Remove photo if it was added to photos
    setPhotos((prev) => prev.filter((p) => p.id !== lastAction.previousState.photoId));

    // Pop from stack
    setUndoStack((prev) => prev.slice(0, prev.length - 1));

    showAlert(`Undone: ${lastAction.actionDescription} was reverted.`);
  };

  // ==========================================
  // Level 3 Manual Tagging Action
  // ==========================================
  const handleManualTagUnknownFace = (photoId: string, personName: string) => {
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === photoId) {
          return {
            ...p,
            assignedPeople: [personName],
            clusterLevel: 'Level 1: Confident',
            restCategory: undefined,
            badge: `${personName} (Manually Tagged)`,
          };
        }
        return p;
      })
    );
    showAlert(`Successfully identified face and assigned photo to ${personName}!`);
  };

  // ==========================================
  // Filtered Photo Computations
  // ==========================================
  const displayPhotos = photos.filter((p) => {
    if (activeTab === 'people') {
      // Level 1: Confident person collections
      if (p.clusterLevel !== 'Level 1: Confident') return false;
      if (selectedPerson === 'all') return true;
      // Multi-person check: Is selectedPerson in assignedPeople array?
      return p.assignedPeople.map((n) => n.toLowerCase()).includes(selectedPerson.toLowerCase());
    }

    if (activeTab === 'rest') {
      // Level 3: Rest Photos
      if (p.clusterLevel !== 'Level 3: Rest') return false;
      return p.restCategory === restSubfilter;
    }

    return false;
  });

  const pendingSuggestionsCount = suggestions.filter((s) => s.status === 'pending').length;

  return (
    <div className="bg-[#F8F5EF] text-[#101E1C] antialiased selection:bg-[#9CF2E8] selection:text-[#00201D] min-h-screen pb-28">
      {/* 1. TOP APP BAR */}
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-4 h-14 bg-[#F8F5EF]/85 backdrop-blur-md border-b border-[#E6E1D8] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Go back to dashboard"
            onClick={() => {
              setScreen('home');
              navigate('/');
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E1F1EE] active:scale-95 transition-all text-[#101E1C] focus:outline-none"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-[16px] font-bold text-[#101E1C] tracking-tight truncate max-w-[200px]">
              {activeRoomTitle}
            </h1>
            <p className="text-[11px] text-[#3E4947] flex items-center gap-1 font-medium">
              <span>Trip Album</span>
              <span>•</span>
              <span className="text-[#005C55] font-semibold">3-Level Matching Active</span>
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
            aria-label="Room details"
            onClick={() =>
              alert(`Room Details: Key ${activeRoomSlug}. Three-Level Photo Matching organizes photos with single original storage, multi-person linking, human review for close matches, and categorized Rest Photos.`)
            }
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E1F1EE] active:scale-95 transition-all text-[#3E4947]"
          >
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>
      </header>

      {/* Alert Toast Notification */}
      {alertMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-lg mx-auto bg-[#005C55] text-white px-4 py-2.5 rounded-xl shadow-card text-[12px] font-medium flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[16px]">info</span>
          <span>{alertMessage}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-lg mx-auto pt-16 px-4">
        {/* 2. HERO BANNER */}
        <section className="relative rounded-2xl overflow-hidden shadow-card border border-[#E6E1D8] mt-2">
          <div className="relative h-40 w-full">
            <img
              src="/placeholder-cover.svg"
              alt={activeRoomTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Room Key Badge */}
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={handleCopyKey}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#253331]/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 active:scale-95 transition-all focus:outline-none"
                title="Copy Room Key"
              >
                <span className="material-symbols-outlined text-[12px] text-[#FFAB69]">key</span>
                <span>{copiedKey ? 'COPIED!' : activeRoomSlug}</span>
                <span className="material-symbols-outlined text-[13px] text-[#BDC9C6] ml-0.5">
                  content_copy
                </span>
              </button>
            </div>

            {/* Room Title & Policy Badge */}
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="material-symbols-outlined text-[14px] text-[#6FFBBE]">verified_user</span>
                <span className="text-[10px] tracking-wide text-[#D6E6E2] uppercase font-bold">
                  Private to Room Members • Cloudflare R2
                </span>
              </div>
              <h2 className="text-[19px] font-bold tracking-tight text-white drop-shadow-xs">
                {activeRoomTitle}
              </h2>
            </div>
          </div>

          {/* Members Bar & Room Quota & 30-Day Retention */}
          <div className="p-3 bg-white flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-full bg-[#005C55] text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                    {(currentUser?.name || 'Y').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[12px] text-[#101E1C] font-semibold">
                    {identifiedPeople.length > 0 ? identifiedPeople.join(', ') : (currentUser?.name || 'You')}
                  </span>
                  <span className="text-[10px] text-[#3E4947]">Room Quota: {photos.length} / 1,000 photos</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#E2DDD4] bg-[#F8F5EF] text-[#101E1C] hover:bg-[#E1F1EE] active:scale-95 transition-all text-[11px] font-semibold"
              >
                <span className="material-symbols-outlined text-[14px] text-[#005C55]">person_add</span>
                <span>Invite</span>
              </button>
            </div>

            {/* 30-Day Archival Countdown Alert */}
            <div className="pt-2 border-t border-[#E6E1D8] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-[#8E4E14] font-medium">
                <span className="material-symbols-outlined text-[15px] text-[#8E4E14]">hourglass_bottom</span>
                <span><strong>24 Days Left</strong> to sync • Auto-archival on Dec 15</span>
              </div>
              <button
                type="button"
                onClick={() => showAlert("After 30 days, photos are archived to keep storage lean. Use 'Save to Phone (ZIP)' or 'Export to Google Drive' anytime to keep all photos forever!")}
                className="text-[#0F766E] font-semibold hover:underline text-[10px]"
              >
                Memory Policy ℹ️
              </button>
            </div>
          </div>
        </section>

        {/* 3. UPLOAD & DUAL EXPORT ACTION BAR */}
        <section className="mt-3 space-y-2">
          {/* Hidden File Picker */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFilesSelected}
          />

          {/* Active Uploading Banner */}
          {isUploading && (
            <div className="p-3 bg-[#E6F4F1] border border-[#0F766E]/30 rounded-2xl flex flex-col gap-1.5 animate-pulse">
              <div className="flex items-center justify-between text-xs font-semibold text-[#005C55]">
                <span>
                  {uploadProgress?.stage === 'compressing'
                    ? `🔄 Compressing Photo ${uploadProgress.currentPhotoIndex}/${uploadProgress.totalPhotos} to WebP...`
                    : `☁️ Uploading to Storage (${uploadProgress?.currentPhotoIndex || 1}/${uploadProgress?.totalPhotos || 1})...`}
                </span>
                <span>{uploadProgress?.percent || 30}%</span>
              </div>
              <div className="w-full bg-[#CCE8E3] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0F766E] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress?.percent || 30}%` }}
                />
              </div>
              {uploadProgress?.savedPercent && uploadProgress.savedPercent > 0 ? (
                <span className="text-[10px] text-[#005C55]">
                  💡 Canvas WebP compressed ~{uploadProgress.savedPercent}% bandwidth saved
                </span>
              ) : null}
            </div>
          )}

          {/* Active Downloading Banner */}
          {isDownloading && (
            <div className="p-3 bg-[#FEF3C7] border border-[#D97706]/30 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#92400E]">
                <span>📦 {downloadProgress?.currentFilename || 'Preparing ZIP archive...'}</span>
                <span>{downloadProgress?.percent || 50}%</span>
              </div>
              <div className="w-full bg-[#FDE68A] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#D97706] h-full transition-all duration-300"
                  style={{ width: `${downloadProgress?.percent || 50}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={isUploading}
            onClick={handleUploadClick}
            className="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[48px] h-[50px] rounded-full bg-[#0F766E] text-white font-semibold text-[15px] tracking-wide hover:bg-[#005C55] active:scale-98 disabled:opacity-60 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isUploading ? 'hourglass_top' : 'upload_file'}
            </span>
            <span>{isUploading ? 'Optimizing & Uploading...' : 'Upload Photos'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadZip}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#E2DDD4] bg-white text-[#101E1C] hover:bg-[#F8F5EF] active:scale-98 disabled:opacity-60 transition-all text-[12px] font-semibold shadow-xs"
            >
              <span className="material-symbols-outlined text-[17px] text-[#005C55]">
                {isDownloading ? 'hourglass_bottom' : 'download'}
              </span>
              <span>{isDownloading ? 'Packaging ZIP...' : 'Save to Phone (ZIP)'}</span>
            </button>
            <button
              type="button"
              onClick={handleGoogleDriveExport}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#E2DDD4] bg-white text-[#101E1C] hover:bg-[#F8F5EF] active:scale-98 transition-all text-[12px] font-semibold shadow-xs"
            >
              <span className="material-symbols-outlined text-[17px] text-[#4285F4]">cloud_upload</span>
              <span>Export to Google Drive</span>
            </button>
          </div>
        </section>

        {/* 4. THREE-LEVEL PRIMARY NAVIGATION TABS */}
        <section className="mt-5">
          <div className="flex p-1 bg-[#E8E3D9] rounded-xl text-[13px] font-semibold">
            {/* Tab 1: Level 1 Confirmed People */}
            <button
              type="button"
              onClick={() => setActiveTab('people')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'people'
                  ? 'bg-white text-[#005C55] shadow-xs'
                  : 'text-[#3E4947] hover:text-[#101E1C]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">groups</span>
              <span>People (Level 1)</span>
            </button>

            {/* Tab 2: Level 2 Close Match Suggestions */}
            <button
              type="button"
              onClick={() => setActiveTab('suggestions')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
                activeTab === 'suggestions'
                  ? 'bg-white text-[#8E4E14] shadow-xs'
                  : 'text-[#3E4947] hover:text-[#101E1C]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">rule</span>
              <span>Review Suggestions</span>
              {pendingSuggestionsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#FFAB69] text-[#5C3E20] text-[10px] font-bold flex items-center justify-center">
                  {pendingSuggestionsCount}
                </span>
              )}
            </button>

            {/* Tab 3: Level 3 Rest Photos */}
            <button
              type="button"
              onClick={() => setActiveTab('rest')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'rest'
                  ? 'bg-white text-[#BA1A1A] shadow-xs'
                  : 'text-[#3E4947] hover:text-[#101E1C]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">photo_library</span>
              <span>Rest Photos</span>
            </button>
          </div>
        </section>

        {/* ========================================================= */}
        {/* VIEW 1: LEVEL 1 CONFIRMED PEOPLE COLLECTIONS              */}
        {/* ========================================================= */}
        {activeTab === 'people' && (
          <section className="mt-4 text-left animate-fadeIn">
            <h3 className="text-[14px] font-bold text-[#101E1C] mb-2">Person Collections</h3>

            {/* Explanation Note */}
            <div className="p-2.5 bg-[#E1F1EE] rounded-xl border border-[#005C55]/20 text-[11px] text-[#005C55] mb-3 flex items-start gap-1.5">
              <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">verified</span>
              <span>
                <strong>Level 1 Confident Auto-Matching:</strong> Original photo is stored only once. If multiple people appear in a group photo, it automatically appears in each person's collection!
              </span>
            </div>

            {/* Person Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedPerson('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                  selectedPerson === 'all'
                    ? 'bg-[#005C55] text-white border-[#005C55]'
                    : 'bg-white border-[#E2DDD4] text-[#101E1C] hover:border-[#005C55]'
                }`}
              >
                All People
              </button>
              {identifiedPeople.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedPerson(name)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                    selectedPerson === name
                      ? 'bg-[#005C55] text-white border-[#005C55]'
                      : 'bg-white border-[#E2DDD4] text-[#101E1C] hover:border-[#005C55]'
                  }`}
                >
                  {name}
                </button>
              ))}
              {identifiedPeople.length === 0 && (
                <span className="text-[12px] text-[#6E7977] italic py-1">
                  Upload photos to automatically recognize friends
                </span>
              )}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: LEVEL 2 CLOSE MATCH SUGGESTIONS                   */}
        {/* ========================================================= */}
        {activeTab === 'suggestions' && (
          <section className="mt-4 text-left animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[14px] font-bold text-[#8E4E14]">Level 2 — Review Close Match Suggestions</h3>
                <p className="text-[11px] text-[#5C3E20]">
                  Uncertain matches are never auto-confirmed. Confirm, reject, or explicitly correct A → B.
                </p>
              </div>
              {undoStack.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="px-2.5 py-1 rounded-lg border border-[#8E4E14] text-[#8E4E14] text-[11px] font-bold hover:bg-[#FFF8ED] flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">undo</span>
                  <span>Undo</span>
                </button>
              )}
            </div>

            {suggestions.filter((s) => s.status === 'pending').length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-[#E2DDD4] text-center text-[#6E7977] text-[13px]">
                <span className="material-symbols-outlined text-[32px] text-[#005C55] block mb-2">task_alt</span>
                All suggestions reviewed! All uncertain matches have been resolved.
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions
                  .filter((s) => s.status === 'pending')
                  .map((sug) => (
                    <div key={sug.id} className="p-3.5 bg-white rounded-2xl border border-[#FFAB69]/50 shadow-xs">
                      <div className="flex gap-3">
                        <img
                          src={sug.photoUrl}
                          alt="Uncertain face preview"
                          className="w-20 h-20 rounded-xl object-cover border border-[#E2DDD4] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="px-2 py-0.5 rounded-sm bg-[#FFAB69]/20 text-[#8E4E14] text-[10px] font-bold">
                            Close Match ({Math.round(sug.suggestedPerson.similarityScore * 100)}%)
                          </span>
                          <h4 className="text-[13px] font-bold text-[#101E1C] mt-1">
                            Suggested: {sug.suggestedPerson.name}
                          </h4>
                          <p className="text-[11px] text-[#5C3E20] mt-0.5">
                            Closest candidates: {sug.candidatePeople.map((c) => `${c.name} (${Math.round(c.similarityScore * 100)}%)`).join(', ')}
                          </p>

                          {/* Alternative Candidate Selector for Explicit A -> B Correction */}
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#6E7977] uppercase">Is this someone else?</span>
                            <select
                              value={selectedCandidatePerson}
                              onChange={(e) => setSelectedCandidatePerson(e.target.value)}
                              className="text-[11px] font-semibold bg-[#F8F5EF] border border-[#E2DDD4] rounded-lg px-2 py-1 text-[#101E1C]"
                            >
                              <option value="Samira">This is Person 3 (Samira)</option>
                              <option value="Tanvir">This is Person 4 (Tanvir)</option>
                              <option value="Tasnim">This is Person 1 (Tasnim)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Review Action Buttons */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#F0EBE0]">
                        <button
                          type="button"
                          onClick={() => handleConfirmSuggestion(sug.id)}
                          className="py-1.5 px-2 rounded-lg bg-[#005C55] text-white text-[11px] font-bold hover:bg-[#0F766E] transition-all text-center"
                        >
                          Confirm {sug.suggestedPerson.name.replace(/Person \d+ \((.*)\)/, '$1')}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCorrectSuggestion(sug.id, selectedCandidatePerson)}
                          className="py-1.5 px-2 rounded-lg bg-[#8E4E14] text-white text-[11px] font-bold hover:bg-[#723E10] transition-all text-center"
                        >
                          Correct to {selectedCandidatePerson}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectSuggestion(sug.id)}
                          className="py-1.5 px-2 rounded-lg border border-[#BA1A1A] text-[#BA1A1A] hover:bg-[#FFDAD6] text-[11px] font-bold transition-all text-center"
                          title="Never auto-assigns to anyone else"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: LEVEL 3 REST PHOTOS (CATEGORIZED FALLBACK)        */}
        {/* ========================================================= */}
        {activeTab === 'rest' && (
          <section className="mt-4 text-left animate-fadeIn">
            {/* Header & Subcategory Tabs */}
            <div className="mb-3">
              <h3 className="text-[14px] font-bold text-[#BA1A1A]">Level 3 — Rest Photos Repository</h3>
              <p className="text-[11px] text-[#6E7977]">
                Photos that cannot be confidently matched or have no recognizable people. Unknown faces are never misclassified as scenery.
              </p>
            </div>

            {/* 3 Subcategory Filters */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#E8E3D9] rounded-xl text-[11px] font-semibold mb-3">
              <button
                type="button"
                onClick={() => setRestSubfilter('unknown_faces')}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  restSubfilter === 'unknown_faces' ? 'bg-white text-[#BA1A1A] shadow-xs' : 'text-[#3E4947]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">face</span>
                <span>Unknown Faces</span>
              </button>

              <button
                type="button"
                onClick={() => setRestSubfilter('no_people')}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  restSubfilter === 'no_people' ? 'bg-white text-[#005C55] shadow-xs' : 'text-[#3E4947]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">landscape</span>
                <span>No People (Scenic)</span>
              </button>

              <button
                type="button"
                onClick={() => setRestSubfilter('other_unassigned')}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  restSubfilter === 'other_unassigned' ? 'bg-white text-[#8E4E14] shadow-xs' : 'text-[#3E4947]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">blur_on</span>
                <span>Other Unassigned</span>
              </button>
            </div>

            {restSubfilter === 'unknown_faces' && (
              <p className="text-[11px] text-[#3E4947] bg-white p-2.5 rounded-xl border border-[#E2DDD4] mb-3">
                💡 Human faces were detected in these photos, but were not confidently matched to a known person. You can manually identify them and assign them to a person collection.
              </p>
            )}

            {restSubfilter === 'no_people' && (
              <p className="text-[11px] text-[#3E4947] bg-white p-2.5 rounded-xl border border-[#E2DDD4] mb-3">
                🏖️ Sunsets, ocean waves, food, and scenery with zero detected human faces.
              </p>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* PHOTO GALLERY GRID (FOR PEOPLE & REST VIEWS)               */}
        {/* ========================================================= */}
        {activeTab !== 'suggestions' && (
          <section className="mt-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[#101E1C]">Gallery</span>
                <span className="text-[12px] text-[#6E7977]">
                  {activeTab === 'people'
                    ? selectedPerson === 'all'
                      ? '• All Confirmed Moments'
                      : `• Photos with ${selectedPerson}`
                    : `• Rest Photos: ${restSubfilter.replace('_', ' ').toUpperCase()}`}
                </span>
              </div>
              <span className="text-[11px] text-[#6E7977]">
                {displayPhotos.length} photo{displayPhotos.length !== 1 ? 's' : ''}
              </span>
            </div>

            {photos.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-[#E2DDD4] text-center flex flex-col items-center gap-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#E1F1EE] text-[#005C55] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">add_a_photo</span>
                </div>
                <h4 className="text-[15px] font-bold text-[#101E1C]">No Photos in This Room Yet</h4>
                <p className="text-[12px] text-[#3E4947] max-w-xs">
                  Upload photos using the button above. Images will be optimized with WebP compression and organized privately.
                </p>
              </div>
            ) : displayPhotos.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-[#E2DDD4] text-center text-[#6E7977] text-[13px]">
                No photos found in this category.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {displayPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`relative group rounded-xl overflow-hidden bg-white border border-[#E6E1D8] shadow-xs cursor-pointer ${photo.aspect}`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* People Badges (Supports Multiple People on One Photo!) */}
                    {photo.assignedPeople && photo.assignedPeople.length > 0 && (
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[90%]">
                        {photo.badge && <span className="sr-only">{photo.badge}</span>}
                        {photo.assignedPeople.map((name) => (
                          <span
                            key={name}
                            className="px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[9px] font-semibold"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Level 3 Rest Badge */}
                    {photo.clusterLevel === 'Level 3: Rest' && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-[#BA1A1A]/80 backdrop-blur-md text-white text-[9px] font-semibold">
                        {photo.badge}
                      </span>
                    )}

                    <span className="absolute bottom-2 right-2 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* LOUPE / PHOTO DETAIL MODAL */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-dock border border-[#E6E1D8]">
            <div className="p-3 bg-white flex items-center justify-between border-b border-[#E6E1D8]">
              <div>
                <span className="text-[13px] font-bold text-[#005C55] block">
                  {selectedPhoto.badge || 'Photo View'}
                </span>
                <span className="text-[11px] text-[#3E4947] block">
                  {selectedPhoto.clusterLevel} {selectedPhoto.restCategory ? `(${selectedPhoto.restCategory})` : ''}
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
              className="w-full max-h-[55vh] object-contain bg-black"
            />
            <div className="p-3.5 bg-[#F8F5EF] text-left">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[12px] font-semibold text-[#101E1C]">{selectedPhoto.alt}</p>
                  <p className="text-[11px] text-[#6E7977]">Captured at {selectedPhoto.time}</p>
                </div>
                {/* Manual tag unknown face action */}
                {selectedPhoto.restCategory === 'unknown_faces' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleManualTagUnknownFace(selectedPhoto.id, currentUser?.name || 'Friend');
                      setSelectedPhoto(null);
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#005C55] text-white text-[11px] font-semibold hover:bg-[#0F766E]"
                  >
                    Tag as {currentUser?.name || 'Friend'}
                  </button>
                )}
              </div>

              {selectedPhoto.assignedPeople.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] font-bold text-[#3E4947]">Identified People:</span>
                  {selectedPhoto.assignedPeople.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded-full bg-[#E1F1EE] text-[#005C55] text-[11px] font-bold">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SHARE / INVITE MODAL */}
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
              Share the secure room key with friends. Room photos are private to members.
            </p>

            <div className="p-3 bg-[#F8F5EF] rounded-xl border border-[#E2DDD4] flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] text-[#6E7977] uppercase font-bold block">Room Key</span>
                <span className="text-[18px] font-mono font-bold tracking-wider text-[#005C55]">{activeRoomSlug}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyKey}
                className="px-3 py-1.5 rounded-full bg-[#0F766E] text-white text-[12px] font-semibold hover:bg-[#005C55] transition-all"
              >
                {copiedKey ? 'Copied!' : 'Copy Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
