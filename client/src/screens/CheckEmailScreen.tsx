import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { BrandLogo } from '../components/BrandLogo';
import { PrivacyCard } from '../components/PrivacyCard';
import { LegalFooter } from '../components/LegalFooter';

export const CheckEmailScreen: React.FC = () => {
  const { setScreen, pendingEmail, setPendingEmail, resendVerificationEmail, isLoading } = useAuth();

  const [countdown, setCountdown] = useState<number>(54);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [tempEmail, setTempEmail] = useState<string>(pendingEmail);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!canResend && countdown > 0) return;
    await resendVerificationEmail();
    setResendNotice('New verification link sent to your inbox!');
    setCountdown(60);
    setCanResend(false);
    setTimeout(() => setResendNotice(null), 4000);
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempEmail.trim() && tempEmail.includes('@')) {
      setPendingEmail(tempEmail.trim());
      setIsEditingEmail(false);
      setResendNotice('Email updated. Reset instructions sent!');
      setCountdown(60);
      setCanResend(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 sm:px-6 pb-6 pt-2">
      {/* Navigation Header */}
      <ScreenHeader
        onBack={() => setScreen('login')}
        badgeText="SECURE VERIFICATION"
        badgeIcon="lock"
      />

      {/* Brand Header */}
      <div className="flex flex-col items-center justify-center my-2">
        <BrandLogo size="md" />
      </div>

      {/* Main Content Card */}
      <div className="w-full bg-white rounded-[28px] border border-[#BDC9C6]/40 shadow-sm p-6 sm:p-7 flex flex-col items-center text-center relative overflow-hidden mt-1 mb-4">
        {/* Subtle Archival Top Border Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0F766E]/40 to-transparent" />

        {/* Envelope Sent Illustration Badge */}
        <div className="relative my-2">
          <div className="w-20 h-20 rounded-full bg-[#E7F7F4] flex items-center justify-center border border-[#BDC9C6]/30 shadow-inner">
            <span
              className="material-symbols-outlined text-[38px] text-[#0F766E]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mark_email_read
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0F766E] text-white flex items-center justify-center shadow-md border-2 border-white">
            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-[24px] font-bold text-[#101E1C] mt-4 mb-2 tracking-tight">
          Check Your Email
        </h1>

        {/* Explanatory Copy */}
        <p className="text-[14px] text-[#3E4947] max-w-[280px] leading-relaxed mb-4">
          We have sent password recovery instructions and a secure reset link to:
        </p>

        {/* Email Pill / Editor */}
        {!isEditingEmail ? (
          <div className="w-full bg-[#E7F7F4] border border-[#BDC9C6]/50 rounded-full py-2.5 px-4 flex items-center justify-between mb-4 group">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="material-symbols-outlined text-[18px] text-[#0F766E] shrink-0">
                alternate_email
              </span>
              <span className="text-[14px] text-[#101E1C] truncate font-semibold">
                {pendingEmail}
              </span>
            </div>
            <button
              type="button"
              aria-label="Edit email address"
              onClick={() => {
                setTempEmail(pendingEmail);
                setIsEditingEmail(true);
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#3E4947] hover:text-[#0F766E] hover:bg-[#D6E6E2]/60 transition-colors shrink-0 focus:outline-none"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveEmail} className="w-full flex items-center gap-2 mb-4">
            <input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              className="flex-1 px-4 py-2 rounded-full border border-[#0F766E] text-[13px] text-[#101E1C] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
              required
              autoFocus
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-[#0F766E] text-white text-[12px] font-semibold rounded-full hover:bg-[#0D645E]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditingEmail(false)}
              className="px-2.5 py-2 text-[#3E4947] text-[12px] hover:underline"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Resend Notice Toast */}
        {resendNotice && (
          <div className="w-full mb-4 p-2.5 rounded-xl bg-[#E7F7F4] border border-[#0F766E]/30 text-[#005C55] text-[12px] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{resendNotice}</span>
          </div>
        )}

        {/* Expiry Notice */}
        <div className="w-full bg-[#E1F1EE]/60 border border-[#BDC9C6]/30 rounded-xl p-3 flex items-start gap-2.5 text-left mb-5">
          <span className="material-symbols-outlined text-[18px] text-[#0F766E] shrink-0 mt-0.5">
            schedule
          </span>
          <p className="text-[13px] text-[#3E4947] leading-snug">
            Link valid for <span className="font-semibold text-[#101E1C]">15 minutes</span>. For security, old links expire immediately upon issuing.
          </p>
        </div>

        {/* Primary CTA Button: Open Email App */}
        <a
          href="mailto:"
          className="w-full bg-[#0F766E] text-white py-3.5 px-5 rounded-full font-semibold text-[14px] shadow-sm hover:bg-[#005C55] transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <span>Open Email App</span>
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
        </a>

        {/* Resend Counter Section */}
        <div className="mt-5 flex flex-col items-center gap-1.5">
          <p className="text-[13px] text-[#3E4947]">
            Didn't receive the email?
          </p>
          <div className="flex items-center gap-1.5 text-[#6E7977]">
            <span className="material-symbols-outlined text-[16px]">history</span>
            {!canResend ? (
              <span className="text-[12px] font-semibold text-[#6E7977]">
                Resend in <span className="text-[#0F766E] font-bold">{countdown}</span>s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-[#0F766E] text-[13px] font-bold hover:underline transition-all focus:outline-none"
              >
                {isLoading ? 'Sending...' : 'Resend Email'}
              </button>
            )}
          </div>
        </div>

        <div className="w-full my-5 border-t border-[#BDC9C6]/30" />

        {/* Back to Login Navigation */}
        <button
          type="button"
          onClick={() => setScreen('login')}
          className="inline-flex items-center gap-1.5 text-[14px] text-[#0F766E] hover:text-[#00504A] font-semibold transition-colors group focus:outline-none"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          <span>Back to Login</span>
        </button>
      </div>

      {/* Support Helper */}
      <div className="w-full flex items-center justify-center mb-3">
        <p className="text-[13px] text-[#3E4947] flex items-center gap-1.5">
          <span>Need help?</span>
          <a
            href="#support"
            onClick={(e) => {
              e.preventDefault();
              alert('Contact support at support@chobideh.app');
            }}
            className="text-[13px] text-[#0F766E] font-semibold hover:underline flex items-center gap-0.5"
          >
            <span>Contact ChobiDeh Support</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </a>
        </p>
      </div>

      {/* Bottom Privacy Callout Card */}
      <div className="w-full mb-3">
        <PrivacyCard customText="Password reset tokens are end-to-end encrypted, single-use, and automatically sanitized from collective room access logs." />
      </div>

      {/* Legal Footer */}
      <LegalFooter />
    </div>
  );
};
