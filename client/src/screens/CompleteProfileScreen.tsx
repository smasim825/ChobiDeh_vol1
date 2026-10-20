import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PrivacyCard } from '../components/PrivacyCard';
import { LegalFooter } from '../components/LegalFooter';

export const CompleteProfileScreen: React.FC = () => {
  const { currentUser, completeGoogleProfile, isLoading, errorMessage, clearError } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [biometricConsent, setBiometricConsent] = useState(currentUser?.biometricConsent ?? false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (!fullName.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }

    await completeGoogleProfile(fullName.trim(), biometricConsent);
  };

  return (
    <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-4 sm:px-6 pt-4 pb-6 text-left antialiased">
      {/* Brand Anchor */}
      <div className="flex justify-center items-center pt-1 pb-4">
        <BrandLogo size="md" />
      </div>

      {/* Header */}
      <div className="text-center mb-5 px-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E1F1EE] text-[#005C55] text-[12px] font-semibold mb-2">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Google Account Verified
        </div>
        <h1 className="text-[26px] sm:text-[28px] font-bold text-[#101E1C] tracking-tight mb-1">
          Complete Your Profile
        </h1>
        <p className="text-[14px] text-[#3E4947] max-w-xs mx-auto leading-relaxed">
          Confirm your display name so friends recognize you in shared rooms.
        </p>
      </div>

      {/* Error Alert */}
      {(errorMessage || validationError) && (
        <div
          role="alert"
          className="mb-4 p-3.5 rounded-xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-center gap-2.5 animate-fadeIn"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
          <span>{errorMessage || validationError}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E6E1D8] shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Primary Email (Restricted / Read-Only) */}
          <Input
            id="google-email"
            type="email"
            label="Verified Email Address"
            value={currentUser?.email || ''}
            disabled
            helperText="Restricted: Permanently linked to your Google login."
            leadingIcon={<span className="material-symbols-outlined text-[20px] text-[#6E7977]">mail</span>}
            trailingIcon={<span className="material-symbols-outlined text-[18px] text-[#0F766E]">lock</span>}
          />

          {/* Full Name */}
          <Input
            id="display-name"
            type="text"
            label="Full Name / Display Name"
            placeholder="e.g. Tasnim Rahman"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (validationError) setValidationError(null);
            }}
            required
            leadingIcon={<span className="material-symbols-outlined text-[20px] text-[#6E7977]">person</span>}
            helperText="This name will appear on your shared room collections."
          />

          {/* 3-Level AI Face Clustering Preference */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8F5EF] border border-[#E2DDD4] cursor-pointer hover:bg-[#F3EFE7] transition-colors">
              <input
                type="checkbox"
                checked={biometricConsent}
                onChange={(e) => setBiometricConsent(e.target.checked)}
                className="mt-0.5 w-[18px] h-[18px] rounded-[5px] border-[#BDC9C6] text-[#0F766E] focus:ring-[#0F766E] focus:ring-offset-0 cursor-pointer"
              />
              <div className="text-left text-[13px]">
                <p className="font-semibold text-[#101E1C] leading-snug">
                  Enable 3-Level AI Face Clustering
                </p>
                <p className="text-[12px] text-[#3E4947] mt-0.5 leading-relaxed">
                  Automatically group visually similar faces from shared room photos. No selfies or account biometric templates required.
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              icon={<span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            >
              Complete Setup &amp; Enter
            </Button>
          </div>
        </form>
      </div>

      {/* Privacy Architecture Notice */}
      <div className="mt-6">
        <PrivacyCard />
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6">
        <LegalFooter />
      </div>
    </div>
  );
};
