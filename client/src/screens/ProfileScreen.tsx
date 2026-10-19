import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen: React.FC = () => {
  const { currentUser, setScreen, logout, updateBiometricConsent } = useAuth();

  const [faceGroupingEnabled, setFaceGroupingEnabled] = useState(currentUser?.biometricConsent ?? true);
  const [wifiDownloadEnabled, setWifiDownloadEnabled] = useState(true);
  const [gpsStrippingEnabled, setGpsStrippingEnabled] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleToggleFaceGrouping = () => {
    const nextVal = !faceGroupingEnabled;
    setFaceGroupingEnabled(nextVal);
    updateBiometricConsent(nextVal);
    setFeedbackMessage(
      nextVal
        ? '3-Level AI face clustering enabled. Visually similar faces will be grouped anonymously.'
        : '3-Level AI face clustering paused. No face clusters or vectors generated.'
    );
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handlePurgeBiometrics = () => {
    setFaceGroupingEnabled(false);
    updateBiometricConsent(false);
    setShowDeleteModal(false);
    setFeedbackMessage('All room face clusters and vector embeddings purged.');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  return (
    <div className="bg-[#EDFDF9] text-[#101E1C] antialiased min-h-screen pb-28 selection:bg-[#9CF2E8] selection:text-[#00201D]">
      {/* TOP APP BAR */}
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-4 h-14 bg-[#EDFDF9]/85 backdrop-blur-md shadow-xs border-b border-[#D6E6E2]/40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => setScreen('home')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#005C55] hover:bg-[#E1F1EE] transition-colors duration-150 active:scale-95 focus:outline-none"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="flex flex-col text-left">
            <h1 className="text-[18px] font-bold text-[#005C55] tracking-tight leading-tight">ChobiDeh</h1>
            <span className="text-[11px] text-[#3E4947] -mt-0.5">Profile &amp; Settings</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => alert('AI Assistant: On-device photo vault is fully synchronized and encrypted.')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#005C55] hover:bg-[#E1F1EE] transition-colors duration-150 active:scale-95 relative focus:outline-none"
            title="AI Memory Assistant"
          >
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#8E4E14]" />
          </button>
        </div>
      </header>

      {/* MAIN SCROLLABLE CONTENT CANVAS */}
      <main className="pt-16 max-w-lg mx-auto px-4 space-y-4">
        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div className="p-3 bg-[#E7F7F4] border border-[#0F766E]/30 rounded-xl text-[13px] text-[#005C55] font-semibold flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* 1. PROFILE HEADER CARD */}
        <section className="mt-2 p-5 bg-white rounded-2xl border border-[#D6E6E2]/50 shadow-card relative overflow-hidden text-left">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-[#9CF2E8]/20 pointer-events-none blur-xl" />
          <div className="flex items-start gap-4 relative z-10">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full ring-2 ring-[#005C55]/20 overflow-hidden shadow-inner bg-[#E1F1EE]">
                <img
                  className="w-full h-full object-cover"
                  alt={currentUser?.name || 'Tasnim Rahman'}
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjDxKnJI_lzaHbWuodGA9ZD1etukufXXJJGPbe1chtc25iJcBSIBqXgMkeIS40lnS_ri-ZV7ZcYTmklBi_lzMVF0gdJR4ic_zsjbAtsrddUv59UQouipxSWh7Yn6fDOidsd-UrffxZZyJz2ztOHZwmBQI-prmQqnVFux88W9o1hlhUeq4hGFa6Dw8UO-8bMObMV5SJjIWBld2QOIjMvMYLILbhQ6WxZtYszTQ2JSKY8FIa49rx9cTp"
                />
              </div>
              <button
                type="button"
                aria-label="Change Profile Photo"
                onClick={() => alert('Change profile photo is available in user preferences.')}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0F766E] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform focus:outline-none"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
              </button>
            </div>

            {/* Name & Badges */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-[20px] text-[#101E1C] font-bold truncate">
                  {currentUser?.name || 'Tasnim Rahman'}
                </h2>
                <span
                  className="material-symbols-outlined text-[#005C55] text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  title="Identity Verified Locally"
                >
                  verified
                </span>
              </div>
              <p className="text-[13px] text-[#3E4947] truncate mt-0.5">
                {currentUser?.email || 'tasnim.rahman@example.com'}
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFDCC4]/50 text-[#8E4E14] text-[11px] font-bold">
                  <span
                    className="material-symbols-outlined text-[13px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    workspace_premium
                  </span>
                  Founding Traveler
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DCECE8] text-[#3E4947] text-[11px] font-semibold">
                  Room Admin
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. QUICK STATS ROW */}
        <section className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3.5 rounded-xl border border-[#D6E6E2]/40 shadow-card flex flex-col items-center justify-center text-center">
            <span className="text-[24px] font-bold text-[#005C55]">3</span>
            <span className="text-[11px] font-semibold text-[#3E4947] mt-0.5">Active Rooms</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-[#D6E6E2]/40 shadow-card flex flex-col items-center justify-center text-center">
            <span className="text-[24px] font-bold text-[#005C55]">615</span>
            <span className="text-[11px] font-semibold text-[#3E4947] mt-0.5">Shared Photos</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-[#D6E6E2]/40 shadow-card flex flex-col items-center justify-center text-center">
            <span className="text-[24px] font-bold text-[#8E4E14]">42</span>
            <span className="text-[11px] font-semibold text-[#3E4947] mt-0.5">Face Clusters</span>
          </div>
        </section>

        {/* 3. STORAGE & ON-DEVICE AI STATUS CARD */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D6E6E2]/40 shadow-card space-y-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#9CF2E8]/40 text-[#005C55] flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lock
                </span>
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[#101E1C]">On-Device Photo Vault</h3>
                <p className="text-[12px] text-[#3E4947]">Private neural clustering active</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#007952]/15 text-[#005E3F] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#005E3F] animate-pulse" />
              Biometrics Local &amp; Safe
            </span>
          </div>

          {/* Storage Bar */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-baseline text-[13px]">
              <span className="font-semibold text-[#101E1C]">1.8 GB used</span>
              <span className="text-[#3E4947] text-[12px]">5.0 GB free sync allocation</span>
            </div>
            <div className="w-full h-2.5 bg-[#DCECE8] rounded-full overflow-hidden p-0.5 flex">
              <div className="h-full bg-[#005C55] rounded-full transition-all duration-500" style={{ width: '36%' }} />
            </div>
            <div className="flex items-center justify-between pt-1 text-[#3E4947] text-[11px]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-[#005C55]">cloud_done</span>
                Synced 12 mins ago
              </span>
              <button
                type="button"
                onClick={() => alert('Storage breakdown: 1.2 GB High-Res Photos, 0.6 GB AI Cache & Thumbnails.')}
                className="text-[#005C55] text-[11px] hover:underline font-semibold"
              >
                Manage Vault
              </button>
            </div>
          </div>
        </section>

        {/* 4. SETTINGS LIST SECTIONS */}
        <div className="space-y-4 text-left">
          {/* SECTION: Account & Security */}
          <div className="space-y-1">
            <h4 className="text-[12px] text-[#3E4947] px-1 font-semibold uppercase tracking-wider">
              Account &amp; Security
            </h4>
            <div className="bg-white rounded-xl border border-[#D6E6E2]/40 shadow-card divide-y divide-[#D6E6E2]/25 overflow-hidden">
              <div className="w-full flex items-center justify-between p-3.5 hover:bg-[#E7F7F4]/50">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#E1F1EE] flex items-center justify-center text-[#3E4947]">
                    <span className="material-symbols-outlined text-[19px]">mail</span>
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[#101E1C]">Primary Email Address</p>
                    <p className="text-[12px] text-[#3E4947]">{currentUser?.email || 'tasnim.rahman@example.com'}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#6E7977] text-[20px]">chevron_right</span>
              </div>

              <button
                type="button"
                onClick={() => setScreen('forgot-password')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[#E7F7F4]/50 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#E1F1EE] flex items-center justify-center text-[#3E4947]">
                    <span className="material-symbols-outlined text-[19px]">key</span>
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[#101E1C]">Change Password</p>
                    <p className="text-[12px] text-[#3E4947]">Last updated 3 months ago</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#6E7977] text-[20px]">chevron_right</span>
              </button>

              <div className="w-full flex items-center justify-between p-3.5 hover:bg-[#E7F7F4]/50">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#E1F1EE] flex items-center justify-center text-[#3E4947]">
                    <span className="material-symbols-outlined text-[19px]">security</span>
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[#101E1C]">Two-Factor Authentication</p>
                    <p className="text-[12px] text-[#005C55] font-semibold">Enabled (Authenticator App)</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#6E7977] text-[20px]">chevron_right</span>
              </div>
            </div>
          </div>

          {/* SECTION: Privacy & Intelligence */}
          <div className="space-y-1">
            <h4 className="text-[12px] text-[#3E4947] px-1 font-semibold uppercase tracking-wider">
              Privacy &amp; Intelligence
            </h4>
            <div className="bg-white rounded-xl border border-[#D6E6E2]/40 shadow-card divide-y divide-[#D6E6E2]/25 overflow-hidden">
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#E1F1EE] flex items-center justify-center text-[#3E4947] shrink-0">
                    <span className="material-symbols-outlined text-[19px]">face</span>
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[#101E1C]">3-Level AI Face Clustering</p>
                    <p className="text-[12px] text-[#3E4947]">Groups similar faces anonymously without selfies</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={faceGroupingEnabled}
                    onChange={handleToggleFaceGrouping}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D6E6E2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#BDC9C6] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F766E]" />
                </label>
              </div>

              <div className="w-full flex items-center justify-between p-3.5 hover:bg-[#E7F7F4]/50">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#E1F1EE] flex items-center justify-center text-[#3E4947]">
                    <span className="material-symbols-outlined text-[19px]">groups</span>
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[#101E1C]">Anonymous Person Collections</p>
                    <p className="text-[12px] text-[#3E4947]">4 named clusters, 2 uncertain matches to review</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#6E7977] text-[20px]">chevron_right</span>
              </div>

              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#E1F1EE] flex items-center justify-center text-[#3E4947] shrink-0">
                    <span className="material-symbols-outlined text-[19px]">visibility_off</span>
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[#101E1C]">Selective Metadata Sharing</p>
                    <p className="text-[12px] text-[#3E4947]">GPS location stripped from exports</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={gpsStrippingEnabled}
                    onChange={() => setGpsStrippingEnabled(!gpsStrippingEnabled)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D6E6E2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#BDC9C6] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F766E]" />
                </label>
              </div>
            </div>
          </div>

          {/* SECTION: Rooms & Sync */}
          <div className="space-y-1">
            <h4 className="text-[12px] text-[#3E4947] px-1 font-semibold uppercase tracking-wider">
              Rooms &amp; Sync
            </h4>
            <div className="bg-white rounded-xl border border-[#D6E6E2]/40 shadow-card divide-y divide-[#D6E6E2]/25 overflow-hidden">
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#E1F1EE] flex items-center justify-center text-[#3E4947] shrink-0">
                    <span className="material-symbols-outlined text-[19px]">wifi</span>
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[#101E1C]">Auto-Download Over Wi-Fi</p>
                    <p className="text-[12px] text-[#3E4947]">Saves cellular data during trips</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={wifiDownloadEnabled}
                    onChange={() => setWifiDownloadEnabled(!wifiDownloadEnabled)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D6E6E2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#BDC9C6] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F766E]" />
                </label>
              </div>
            </div>
          </div>

          {/* SECTION: Privacy & Account Danger Zone (Standardized 48-52px height, rounded-full) */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full min-h-[48px] h-[50px] px-6 rounded-full border border-[#BA1A1A]/40 bg-white text-[#BA1A1A] font-semibold text-[15px] hover:bg-[#FFDAD6]/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
              <span>Purge Room Face Clusters &amp; Vector Vectors</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full min-h-[48px] h-[50px] px-6 rounded-full bg-[#0F766E] text-white font-semibold text-[16px] hover:bg-[#005C55] shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal for Cluster Purge */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-dock border border-[#E6E1D8]">
            <div className="w-12 h-12 rounded-full bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
            </div>
            <h4 className="text-[17px] font-bold text-[#101E1C] mb-1">Purge Room Face Clusters?</h4>
            <p className="text-[13px] text-[#3E4947] leading-relaxed mb-5">
              In accordance with ChobiDeh privacy guidelines, this permanently clears all anonymous facial feature vectors and derived cluster matches. You will remain in your shared rooms without losing photos.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-full border border-[#BDC9C6] text-[13px] font-semibold text-[#101E1C] hover:bg-[#E1F1EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurgeBiometrics}
                className="flex-1 py-2.5 rounded-full bg-[#BA1A1A] text-white text-[13px] font-semibold hover:bg-[#93000A]"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV BAR */}
      <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 py-2 border-t bg-white/90 backdrop-blur-lg border-[#BDC9C6]/40 shadow-lg">
        <div className="w-full max-w-lg mx-auto flex justify-around items-center">
          <button
            type="button"
            onClick={() => setScreen('home')}
            className="flex flex-col items-center justify-center py-1 text-[#3E4947] hover:text-[#005C55] transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">photo_library</span>
            <span className="text-[11px] font-medium mt-0.5">Rooms</span>
          </button>
          <button
            type="button"
            onClick={() => alert('Gallery View')}
            className="flex flex-col items-center justify-center py-1 text-[#3E4947] hover:text-[#005C55] transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">grid_view</span>
            <span className="text-[11px] font-medium mt-0.5">Gallery</span>
          </button>
          <button
            type="button"
            onClick={() => alert('People Collections')}
            className="flex flex-col items-center justify-center py-1 text-[#3E4947] hover:text-[#005C55] transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">group</span>
            <span className="text-[11px] font-medium mt-0.5">People</span>
          </button>
          <button
            type="button"
            onClick={() => setScreen('profile')}
            className="flex flex-col items-center justify-center py-1 text-[#005C55] font-bold"
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person
            </span>
            <span className="text-[11px] font-medium mt-0.5">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
