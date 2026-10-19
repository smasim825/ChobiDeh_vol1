import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { PrivacyCard } from '../components/PrivacyCard';
import { LegalFooter } from '../components/LegalFooter';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const SignupScreen: React.FC = () => {
  const { setScreen, signup, isLoading, errorMessage, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [biometricConsent, setBiometricConsent] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await signup({
      fullName,
      email,
      password,
      biometricConsent,
    });
  };

  const handleGoogleSignup = async () => {
    clearError();
    await signup({
      fullName: 'Google Traveler',
      email: 'google.traveler@example.com',
      password: 'SamplePassword123!',
      biometricConsent: true,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-4 sm:px-6 pt-3 pb-6">
      {/* Brand Anchor */}
      <div className="flex justify-center items-center pt-1 pb-4">
        <BrandLogo size="md" />
      </div>

      {/* Header */}
      <div className="text-center mb-5 px-2">
        <h1 className="text-[26px] sm:text-[28px] font-bold text-[#101E1C] tracking-tight mb-1">
          Create Your Account
        </h1>
        <p className="text-[14px] text-[#3E4947] max-w-xs mx-auto leading-relaxed">
          Share memories privately with close friends &amp; groups.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 p-3.5 rounded-2xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-center gap-2.5 animate-fadeIn"
        >
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span className="flex-1 font-medium">{errorMessage}</span>
          <button
            type="button"
            onClick={clearError}
            className="hover:opacity-70 text-[#93000A]"
            aria-label="Dismiss error"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Sign Up Form Card */}
      <div className="bg-white border border-[#E6E1D8] rounded-[24px] p-5 sm:p-6 shadow-sm mb-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name with moderate rounded-xl radius */}
          <Input
            id="signup-name"
            type="text"
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Maya Lin"
            required
            leadingIcon="person"
          />

          {/* Email Address with moderate rounded-xl radius */}
          <Input
            id="signup-email"
            type="email"
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maya@example.com"
            required
            leadingIcon="mail"
          />

          {/* Password with moderate rounded-xl radius */}
          <Input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            leadingIcon="lock"
            trailingIcon={
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 rounded-full text-[#6E7977] hover:text-[#101E1C] active:scale-90 transition-transform focus:outline-none"
              >
                <span className="material-symbols-outlined text-[19px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            }
          />

          {/* 3-Level AI Face Clustering Opt-in Toggle */}
          <div className="pt-2 pb-1">
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={biometricConsent}
                onChange={(e) => setBiometricConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded text-[#0F766E] border-[#6E7977] focus:ring-[#0F766E]/30 transition cursor-pointer"
              />
              <div className="flex-1 text-left">
                <span className="text-[13px] font-semibold text-[#101E1C] block leading-tight group-hover:text-[#005C55] transition-colors">
                  Enable 3-Level AI Face Clustering for room photos
                </span>
                <span className="text-[12px] text-[#3E4947] block mt-1 leading-normal font-normal">
                  Visually similar faces are grouped into anonymous collections. No mandatory selfie or account face registration is required. You can name, review, or disable clusters anytime.
                </span>
              </div>
            </label>
          </div>

          {/* Standardized Submit CTA (48-52px min-height, 16px font-semibold, rounded-full) */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              icon={<span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            >
              Create Account
            </Button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-[#E6E1D8] w-full" />
          <span className="bg-white px-3 text-[12px] text-[#6E7977] uppercase tracking-wider relative">
            or
          </span>
        </div>

        {/* Secondary Google Auth */}
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={handleGoogleSignup}
          disabled={isLoading}
          icon={
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
          }
        >
          Sign up with Google
        </Button>

        {/* Switch to Login link */}
        <div className="text-center mt-4">
          <p className="text-[13px] text-[#3E4947]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                clearError();
                setScreen('login');
              }}
              className="text-[#005C55] font-bold hover:underline ml-1 focus:outline-none"
            >
              Log In
            </button>
          </p>
        </div>
      </div>

      {/* Privacy Architecture Notice & Footer */}
      <div className="mt-auto space-y-4">
        <PrivacyCard />
        <LegalFooter />
      </div>
    </div>
  );
};
