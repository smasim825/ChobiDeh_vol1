import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { ScreenHeader } from '../components/ScreenHeader';
import { BrandLogo } from '../components/BrandLogo';
import { PrivacyCard } from '../components/PrivacyCard';
import { LegalFooter } from '../components/LegalFooter';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const ForgotPasswordScreen: React.FC = () => {
  const { setScreen, sendPasswordReset, isLoading, errorMessage, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await sendPasswordReset(email);
    if (success) {
      setIsSuccess(true);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 sm:px-6 pb-6 pt-2">
      {/* Navigation Header */}
      <ScreenHeader
        onBack={() => {
          clearError();
          setScreen('login');
        }}
        badgeText="SECURE LINK"
        badgeIcon="lock"
      />

      {/* Brand Logo */}
      <div className="flex flex-col items-center justify-center my-2">
        <BrandLogo size="md" />
      </div>

      {/* Main Card */}
      <main className="flex-1 flex flex-col justify-center my-2">
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#BDC9C6]/40 shadow-sm transition-all">
          {/* Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-[#E7F7F4] border border-[#0F766E]/15 flex items-center justify-center mb-5 text-[#0F766E] shadow-xs">
            <span
              className="material-symbols-outlined text-[30px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mark_email_read
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[24px] font-bold text-[#101E1C] tracking-tight mb-2">
            Forgot Password?
          </h1>
          <p className="text-[14px] text-[#3E4947] leading-relaxed mb-6">
            No worries! Enter the email address associated with your ChobiDeh account and we'll send you a verification link to reset your password.
          </p>

          {/* Error Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-2xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-center gap-2.5"
            >
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span className="flex-1 font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field with moderate rounded-xl radius */}
            <Input
              id="reset-email"
              type="email"
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tim.jennings@example.com"
              required
              leadingIcon="mail"
            />

            {/* Standardized Primary CTA Button (48-52px min-height, 16px semi-bold, rounded-full) */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
                icon={<span className="material-symbols-outlined text-[19px]">arrow_forward</span>}
              >
                Send Reset Link
              </Button>
            </div>
          </form>

          {/* Success Toast */}
          {isSuccess && (
            <div className="mt-4 p-3.5 rounded-xl bg-[#E7F7F4] border border-[#0F766E]/25 flex items-start space-x-3 transition-all">
              <span
                className="material-symbols-outlined text-[#0F766E] text-[20px] mt-0.5"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <p className="text-[13px] text-[#005C55]">
                Verification link sent! Redirecting to confirmation screen...
              </p>
            </div>
          )}

          {/* Auxiliary Back to Login Action */}
          <div className="mt-6 pt-5 border-t border-[#BDC9C6]/30 flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-[13px] text-[#3E4947]">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setScreen('login');
                }}
                className="text-[#0F766E] font-bold hover:underline ml-1 focus:outline-none"
              >
                Back to Login
              </button>
            </p>

            {/* Security note badge */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E1F1EE] text-[#3E4947] text-[11px] font-medium">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              <span>Link expires in 15 minutes for your account security</span>
            </div>
          </div>
        </div>
      </main>

      {/* Support Link */}
      <div className="my-3 text-center">
        <a
          href="#support"
          onClick={(e) => {
            e.preventDefault();
            alert('ChobiDeh Support: support@chobideh.app (24/7 Archival Vault assistance)');
          }}
          className="text-[12px] text-[#6E7977] hover:text-[#0F766E] transition-colors inline-flex items-center space-x-1"
        >
          <span className="material-symbols-outlined text-[15px]">support_agent</span>
          <span>Need help? Contact ChobiDeh Support</span>
        </a>
      </div>

      {/* Archival Privacy & Trust Footer Banner */}
      <footer className="mt-2 space-y-4">
        <PrivacyCard
          customText="We never share your email address. Password reset links are encrypted, time-limited, and single-use for total vault integrity."
        />
        <LegalFooter />
      </footer>
    </div>
  );
};
