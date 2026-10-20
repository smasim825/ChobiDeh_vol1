import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BrandLogo } from '../components/BrandLogo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';

export const ResetPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setErrorMessage(error.message);
          setIsLoading(false);
          return;
        }
      }

      setSuccessMessage('Password reset successfully! Redirecting...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 sm:px-6 pb-6 pt-2">
      <ScreenHeader
        onBack={() => navigate('/login')}
        badgeText="SECURE RESET"
        badgeIcon="lock"
      />

      <div className="flex flex-col items-center justify-center my-2">
        <BrandLogo size="md" />
      </div>

      <main className="flex-1 flex flex-col justify-center my-2">
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#BDC9C6]/40 shadow-sm transition-all">
          <div className="w-14 h-14 rounded-2xl bg-[#E7F7F4] border border-[#0F766E]/15 flex items-center justify-center mb-5 text-[#0F766E] shadow-xs">
            <span
              className="material-symbols-outlined text-[30px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              password
            </span>
          </div>

          <h1 className="text-[24px] font-bold text-[#101E1C] tracking-tight mb-2">
            Set New Password
          </h1>
          <p className="text-[14px] text-[#3E4947] leading-relaxed mb-6">
            Choose a strong password with at least 8 characters to secure your ChobiDeh account.
          </p>

          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-2xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-center gap-2.5"
            >
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span className="flex-1 font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-[#E7F7F4] border border-[#0F766E]/20 text-[#005C55] text-[13px] flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-[#0F766E]">check_circle</span>
              <span className="flex-1 font-medium">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              leadingIcon="lock"
              trailingIcon={
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#6E7977] hover:text-[#101E1C] focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              }
            />

            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              leadingIcon="lock_clock"
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
                icon={<span className="material-symbols-outlined text-[19px]">arrow_forward</span>}
              >
                Reset Password
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#BDC9C6]/30 flex flex-col items-center justify-center text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[13px] text-[#005C55] font-semibold hover:underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
