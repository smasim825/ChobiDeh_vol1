import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export const DashboardMock: React.FC = () => {
  const { currentUser, logout, updateBiometricConsent } = useAuth();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'settings'>('rooms');

  if (!currentUser) return null;

  return (
    <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col px-4 sm:px-6 pt-4 pb-8">
      {/* Top Bar */}
      <header className="flex items-center justify-between py-3 border-b border-[#E6E1D8] mb-6">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[14px] font-bold text-[#101E1C] capitalize">{currentUser.name}</p>
            <p className="text-[12px] text-[#6E7977]">{currentUser.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="px-3 py-1.5 rounded-full border border-[#E2DDD4] bg-white text-[12px] font-semibold text-[#8E4E14] hover:bg-[#FFDAD6]/30 transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#E6E1D8] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 text-[14px] font-semibold rounded-t-lg transition-colors ${
            activeTab === 'rooms'
              ? 'text-[#0F766E] border-b-2 border-[#0F766E]'
              : 'text-[#6E7977] hover:text-[#101E1C]'
          }`}
        >
          Shared Rooms
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-[14px] font-semibold rounded-t-lg transition-colors ${
            activeTab === 'settings'
              ? 'text-[#0F766E] border-b-2 border-[#0F766E]'
              : 'text-[#6E7977] hover:text-[#101E1C]'
          }`}
        >
          Biometric & Privacy Settings
        </button>
      </div>

      {activeTab === 'rooms' ? (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-[#0F766E] to-[#005C55] rounded-2xl p-6 text-white shadow-sm">
            <h2 className="text-[20px] font-bold mb-1">
              Welcome, {currentUser.name}!
            </h2>
            <p className="text-[13px] text-[#A3FAEF] leading-relaxed max-w-lg">
              You are signed in to ChobiDeh's privacy-first vault. You can now create a shared memory room or join an existing trip with an invite code.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                type="button"
                onClick={() => alert('Room creation is part of Milestone 2 (Room Management).')}
                className="px-4 py-2 bg-white text-[#0F766E] rounded-full text-[13px] font-bold shadow-xs hover:bg-[#F8F5EF] active:scale-95 transition-all"
              >
                + Create New Room
              </button>
              <button
                type="button"
                onClick={() => alert('Room joining is part of Milestone 2 (Room Management).')}
                className="px-4 py-2 bg-[#0F766E]/60 border border-white/30 text-white rounded-full text-[13px] font-bold hover:bg-[#0F766E] active:scale-95 transition-all"
              >
                Join with Code
              </button>
            </div>
          </div>

          {/* Empty State for Rooms */}
          <div className="bg-white rounded-2xl border border-[#E6E1D8] p-8 text-center shadow-card">
            <div className="w-16 h-16 rounded-full bg-[#E7F7F4] text-[#0F766E] flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[32px]">photo_library</span>
            </div>
            <h3 className="text-[16px] font-bold text-[#101E1C] mb-1">No shared rooms yet</h3>
            <p className="text-[13px] text-[#6E7977] max-w-sm mx-auto mb-5">
              Photos uploaded to ChobiDeh remain private to shared room members only. Create a room to start sharing memories.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 3-Level AI Face Clustering Status Card */}
          <div className="bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[#101E1C] mb-1">
                  3-Level AI Face Clustering
                </h3>
                <p className="text-[13px] text-[#3E4947] leading-relaxed max-w-md">
                  In compliance with privacy policies, face clustering groups visual similarities into anonymous collections without mandatory selfies or account registration. You can toggle clustering anytime.
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[12px] font-bold ${
                  currentUser.biometricConsent
                    ? 'bg-[#E7F7F4] text-[#0F766E] border border-[#0F766E]/20'
                    : 'bg-[#FFDAD6] text-[#93000A] border border-[#BA1A1A]/20'
                }`}
              >
                {currentUser.biometricConsent ? 'Clustering Active' : 'Clustering Disabled'}
              </span>
            </div>

            <div className="mt-5 pt-4 border-t border-[#E6E1D8] flex items-center justify-between">
              <div>
                <p className="text-[12px] text-[#6E7977]">
                  {currentUser.biometricConsent
                    ? 'Active 3-level matching (Level 1: Confident, Level 2: Review, Level 3: Unsorted)'
                    : 'Face clustering paused. Photos remain in room gallery without groupings.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (currentUser.biometricConsent) {
                    setShowConsentModal(true);
                  } else {
                    updateBiometricConsent(true);
                  }
                }}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                  currentUser.biometricConsent
                    ? 'border border-[#BA1A1A] text-[#BA1A1A] hover:bg-[#FFDAD6]/20'
                    : 'bg-[#0F766E] text-white hover:bg-[#0D645E]'
                }`}
              >
                {currentUser.biometricConsent ? 'Disable Clustering & Purge Data' : 'Enable 3-Level Clustering'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Consent Withdrawal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-dock border border-[#E6E1D8]">
            <div className="w-12 h-12 rounded-full bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
            </div>
            <h4 className="text-[17px] font-bold text-[#101E1C] mb-1">Disable 3-Level Face Clustering?</h4>
            <p className="text-[13px] text-[#3E4947] leading-relaxed mb-5">
              Disabling clustering clears all anonymous face groupings and vectors for your view. You will still be able to browse and upload photos normally.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="flex-1 py-2.5 rounded-full border border-[#E2DDD4] text-[13px] font-semibold text-[#101E1C] hover:bg-[#F8F5EF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateBiometricConsent(false);
                  setShowConsentModal(false);
                }}
                className="flex-1 py-2.5 rounded-full bg-[#BA1A1A] text-white text-[13px] font-semibold hover:bg-[#93000A]"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
