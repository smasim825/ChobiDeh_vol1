import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';

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

const GALLERY_PHOTOS: PhotoItem[] = [
  {
    id: 'p1',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ2Oyarct3zts76pL3ykl25TXxM5aBCWVe2w5cxMWrNgR3038PsQaqGstDb7wMM5FQkP1se4inxWUFzUkgjK623pdc9nhCnyPh0dWtEuwojTBw-tucH7PhrRmreE1d3qtOSj2YkR4hnZxs5KgUt9VUr0x3WxOksjR8sTCsC5sqrvX_vCLl_k7BodYbfAw5gxlA8rmnjVdB6d3t4aT9-sEIGkbUIL_yQ77I9XtsZI6aLmk37QYpnHUB',
    alt: 'Stunning vertical travel photo of silhouetted figures walking along tide pools of Inani Beach during sunset.',
    person: 'all',
    aspect: 'aspect-[3/4]',
    badge: 'Sunset Silhouette',
    clusterLevel: 'Level 1: Confident',
    time: '5:42 PM',
  },
  {
    id: 'p2',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ6N1eR69g4r-iQ7B7-l6z7mYwHjK1_jL1G7P4a6M3j-kR5g8A-t6m9_Q7B7-l6z7mYwHjK1_jL1G7P4a6M3j-kR5g8A-t6m9_Q7B7-l6z7mYwHjK1_jL1G7P4a6M3j-kR5g8A-t6m9_Q7B7-l6z7mYwHjK1_jL1G7P4a6M3j-kR5g8A-t6m9',
    alt: 'Golden sunset reflections over gentle waves on Inani Beach.',
    person: 'Tasnim',
    aspect: 'aspect-square',
    badge: 'Person 1 (Tasnim)',
    clusterLevel: 'Level 1: Confident',
    time: '5:30 PM',
  },
  {
    id: 'p3',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlnfQKzTYLDga2FfwhzR6g8aZvDTZ0BD4FHTxs6htokkrNtfxZV9xqd4pe0dau_b2M7-LLDqbEA9trYrhJDOxHbnFVyxIUuqjLvLkjiEohzYPc-rXfAbNLJltMcw0ukzQZgRc0reh11btVjGeE0LZ-R1Y8DyJcWgZS0Twt5zUUtaAduUsSqV__XV1fc6kQZQH6e11ueB8HuKnYtA4y5Otr-UnSyc6zZz09x2muHy-bIHzGHEezhLN1',
    alt: 'Portrait of Rafiqul on sandy beach dunes in serene travel atmosphere.',
    person: 'Rafiqul',
    aspect: 'aspect-[3/4]',
    badge: 'Person 2 (Rafiqul)',
    clusterLevel: 'Level 1: Confident',
    time: '4:15 PM',
  },
  {
    id: 'p4',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7qxW27ORxwyx4McgWcZGHIkrXd2ZwIbF1dbTaOAcR3hJHd83aRPT-P5FpM71uT8oRbtoFes_m6XpHOz_moPbfg1kzO_uvv9DqCzaGKJcX7a_ysmpAaNdEE1PGCMQUxxRYNYXNaC5yk_LtjGFo5n5SuGIkfjYfJkDlP7_AftN6rROmqkdd2p_k5a4dcf853Z3lG6wbq-2QoGAlFn9E1_QrgR0U8oN1BgFO0s7PJ1nMFVnm3L88eAxg',
    alt: 'Portrait of Samira smiling in front of sea breeze horizon.',
    person: 'Samira',
    aspect: 'aspect-square',
    badge: 'Person 3 (Samira)',
    clusterLevel: 'Level 1: Confident',
    time: '3:45 PM',
  },
  {
    id: 'p5',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9vs8HraHWrOZE-GT8_Nn0ENWPDHTsiKpaBjWe1Yq0p5HizrYHQ7xuB6cfjEk5pffqxzFyqAddOZIdsG5YWkvPo1kd09LwlOEuYQQxoToZ47AchIVY_4ajbnkCgjWnN9CjrKmzjpTMYcrZN6MBsIRf21v4SyqBukKTF6roX1kb_XaStDDrHxyiXuTVEIFZw_WccajqByBGbbWF7ZE8liVxJSt1FVwWsD9LsqRR7IUDMqKPcGy3z9wK',
    alt: 'Portrait of Tanvir laughing during coastal road trip.',
    person: 'Tanvir',
    aspect: 'aspect-[4/5]',
    badge: 'Person 4 (Tanvir)',
    clusterLevel: 'Level 1: Confident',
    time: '2:10 PM',
  },
  {
    id: 'p6',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBf-dFHqUJzS6AsGnsObKvM1ZSYPEdqaqwLfEuSU-KzRO7pCyUQdPC46ziMPT-Goedt16W0YlOfRn2_oGkrNBzp2iBxNtmiroEhqFkiWTCpZCk25vrJ5UiwMpdfS7-Udoz3ItUatALRG2r49VR26O_qimwtia7lBupaZf3r4OIZtleDm4yZ5nqS4f1vj63pd2EcODsRTI37gyioFoeiLReYSG09_cfUlcjUH8XyjtgirYLX2VTI4UuK',
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

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showUncertainReview] = useState(true);

  const filteredPhotos =
    activeFilter === 'all'
      ? GALLERY_PHOTOS
      : GALLERY_PHOTOS.filter((p) => p.person.toLowerCase() === activeFilter.toLowerCase());

  const handleCopyKey = () => {
    navigator.clipboard?.writeText('CB-9821');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="bg-[#F8F5EF] text-[#101E1C] antialiased selection:bg-[#9CF2E8] selection:text-[#00201D] min-h-screen pb-28">
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
            aria-label="Room details"
            onClick={() => alert("Room Details: Key CB-9821, Host: Tasnim. 3-level face clustering organizes room photos without selfies.")}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E1F1EE] active:scale-95 transition-all text-[#3E4947]"
          >
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-lg mx-auto pt-16 px-4">
        {/* 2. EDITORIAL HERO BANNER */}
        <section className="relative rounded-2xl overflow-hidden shadow-card border border-[#E6E1D8] mt-2">
          <div className="relative h-44 w-full">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoM794fWcR0WqTsmZ-n_L7y_fB-rL1jH1T7a5M4j_mN1K7_jL1G7P4a6M3j-kR5g8A-t6m9_Q7B7-l6z7mYwHjK1_jL1G7P4a6M3j-kR5g8A-t6m9_Q7B7-l6z7mYwHjK1_jL1G7P4a6M3j-kR5g8A-t6m9_Q7B7-l6z7mYwHjK1_jL1G7P4a6M3j-kR5g8A-t6m9"
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
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfxRNFQFSdCj8iajZ62oVX4SzJqF2lhS2YNhkfQbV8UYwhsNa2-t6lCzChqYPq9MeqNFCBgZQjUh9GYMRxWzDoi4xE2bkdLiimgBum4O66sc20BGnqGfJEEhKwalnxiOK2LOW5vegS5ipMDSoqGaKpB3Oa9AN3Tkyk3zV1xN12JqJfhaG3Qi8tfE-Vaz2yMcML30r2HJoV2DFVtM9cSVJXU6h0mTIknIi19BBT3d7Zl-g161ja1OOw"
                  alt="Tasnim"
                />
                <img
                  className="w-8 h-8 rounded-full ring-2 ring-white object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuApXnDbtVFoEwAchXY_hbVn8VDdvzDVun56ckDau44eZSmzj392ziJg5IJ9JPyglfnzirgdIFF_QC0EUl6OLEfDMUrPXGFLmJrUZdqFbzDladGN11KOGc7be5nuWPglidOcH3hocefXHts6rYn3EbrWXK3brvBEa-tvZmiZryKBunm_QSsmOMkFqiyuKho7uiRPXjrKf7P1MxAMmsAXGKz0kYlFpFeodwnEnc6PdAZii4wzSkzlgegf"
                  alt="Rafiq"
                />
                <img
                  className="w-8 h-8 rounded-full ring-2 ring-white object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnYUB5z27Eyd8l0DH3XRN5UquaQn-xAmk3vj7JZ7guMNIS77HdALDvLjrxjOY8GonHWFIKTz3GgSp99UZD1snjSOrwQrVVmGemeAoFmDruBXI3jLsj7it00YrNfIwvMCOjQSGXeCLtA2Etd8XrrYEoQHwv8hK9EuEHwh4PWAPpEU_D7KnOixbVvX1-Jelx4zn_knuiJ1uCpBThkZbiSajIumDjMVM3KGdZ7gohe4GMnWFA7_rBi7SV"
                  alt="Tanvir"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[12px] text-[#101E1C] font-semibold">Tasnim (Host) + 3 others</span>
                <span className="text-[10px] text-[#3E4947]">Private room sync</span>
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

        {/* 3. QUICK ACTION BUTTONS (Standardized 48-52px height, rounded-full) */}
        <section className="mt-4 flex items-center gap-2">
          <button
            type="button"
            disabled
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 min-h-[48px] h-[50px] rounded-full bg-[#0F766E]/60 text-white/90 font-semibold text-[15px] tracking-wide cursor-not-allowed opacity-80"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>Upload Photos (Coming soon)</span>
          </button>
          <button
            type="button"
            onClick={() => alert('Playing Archival Memory Reel: Cox’s Bazar Sunset Highlight')}
            className="inline-flex items-center gap-1.5 px-4 min-h-[48px] h-[50px] rounded-full border border-[#E2DDD4] bg-white text-[#101E1C] hover:bg-[#F8F5EF] active:scale-[0.98] transition-all text-[15px] font-semibold shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-[#8E4E14]">movie</span>
            <span>Reel</span>
          </button>
          <button
            type="button"
            onClick={() => alert('Clustering settings: Calibrate thresholds, review clusters, or purge vectors.')}
            className="w-[50px] h-[50px] min-h-[48px] flex items-center justify-center rounded-full border border-[#E2DDD4] bg-white text-[#101E1C] hover:bg-[#F8F5EF] active:scale-[0.98] transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[19px]">tune</span>
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
                  <span className="px-1.5 py-0.5 rounded-sm bg-[#FFAB69]/20 text-[#8E4E14] text-[10px] font-bold">
                    Needs Review
                  </span>
                </div>
                <p className="text-[12px] text-[#5C3E20] mt-0.5 leading-snug">
                  The AI noticed <span className="font-semibold">Person 5</span> is visually similar to{' '}
                  <span className="font-semibold">Person 2 (Rafiqul)</span>. The system never merges automatically.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#0F766E]/50 text-white/80 text-[12px] font-bold cursor-not-allowed"
                  >
                    Confirm Merge (Coming soon)
                  </button>
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-1.5 px-3 rounded-lg border border-[#BDC9C6] bg-white/70 text-[#3E4947]/70 text-[12px] font-semibold cursor-not-allowed"
                  >
                    Keep Separate (Coming soon)
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. 3-LEVEL CLUSTERING INTELLIGENCE & COLLECTIONS FILTER */}
        <section className="mt-5 text-left">
          {/* AI Banner Pill */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#005C55] mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px] text-[#0F766E]">auto_awesome</span>
              <span className="text-[12px] font-semibold leading-tight text-[#005C55]">
                3-Level AI Face Clustering Active • Anonymous Person Collections
              </span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-[#0F766E]/70">lock</span>
          </div>

          {/* People Filter Strip */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[16px] font-bold text-[#101E1C] tracking-tight">Person Collections</h3>
            <span className="text-[11px] text-[#3E4947]">No selfies required</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {/* All */}
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold shadow-xs transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#005C55] text-white'
                  : 'bg-white border border-[#E2DDD4] text-[#101E1C] hover:border-[#005C55]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">select_all</span>
              <span>All Moments</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">142</span>
            </button>

            {/* Level 1: Tasnim (Person 1) */}
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
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfxRNFQFSdCj8iajZ62oVX4SzJqF2lhS2YNhkfQbV8UYwhsNa2-t6lCzChqYPq9MeqNFCBgZQjUh9GYMRxWzDoi4xE2bkdLiimgBum4O66sc20BGnqGfJEEhKwalnxiOK2LOW5vegS5ipMDSoqGaKpB3Oa9AN3Tkyk3zV1xN12JqJfhaG3Qi8tfE-Vaz2yMcML30r2HJoV2DFVtM9cSVJXU6h0mTIknIi19BBT3d7Zl-g161ja1OOw"
                  alt="Tasnim"
                />
              </div>
              <span>Person 1 (Tasnim)</span>
              <span className="px-1.5 rounded-full bg-[#E1F1EE] text-[#3E4947] text-[10px] font-bold">48</span>
            </button>

            {/* Level 1: Rafiqul (Person 2) */}
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
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuApXnDbtVFoEwAchXY_hbVn8VDdvzDVun56ckDau44eZSmzj392ziJg5IJ9JPyglfnzirgdIFF_QC0EUl6OLEfDMUrPXGFLmJrUZdqFbzDladGN11KOGc7be5nuWPglidOcH3hocefXHts6rYn3EbrWXK3brvBEa-tvZmiZryKBunm_QSsmOMkFqiyuKho7uiRPXjrKf7P1MxAMmsAXGKz0kYlFpFeodwnEnc6PdAZii4wzSkzlgegf"
                  alt="Rafiqul"
                />
              </div>
              <span>Person 2 (Rafiqul)</span>
              <span className="px-1.5 rounded-full bg-[#E1F1EE] text-[#3E4947] text-[10px] font-bold">36</span>
            </button>

            {/* Level 1: Samira (Person 3) */}
            <button
              type="button"
              onClick={() => setActiveFilter('Samira')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                activeFilter === 'Samira'
                  ? 'bg-[#005C55] text-white border-[#005C55]'
                  : 'bg-white border-[#E2DDD4] text-[#101E1C] hover:border-[#005C55]'
              }`}
            >
              <span>Person 3 (Samira)</span>
              <span className="px-1.5 rounded-full bg-[#E1F1EE] text-[#3E4947] text-[10px] font-bold">29</span>
            </button>

            {/* Level 1: Tanvir (Person 4) */}
            <button
              type="button"
              onClick={() => setActiveFilter('Tanvir')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                activeFilter === 'Tanvir'
                  ? 'bg-[#005C55] text-white border-[#005C55]'
                  : 'bg-white border-[#E2DDD4] text-[#101E1C] hover:border-[#005C55]'
              }`}
            >
              <span>Person 4 (Tanvir)</span>
              <span className="px-1.5 rounded-full bg-[#E1F1EE] text-[#3E4947] text-[10px] font-bold">18</span>
            </button>

            {/* Level 3: Unsorted Collection */}
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
              <span className="px-1.5 rounded-full bg-[#FFDAD6] text-[#BA1A1A] text-[10px] font-bold">11</span>
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
                  ? '• All Moments'
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
