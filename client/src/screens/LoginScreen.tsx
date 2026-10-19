import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { PrivacyCard } from '../components/PrivacyCard';
import { LegalFooter } from '../components/LegalFooter';

export const LoginScreen: React.FC = () => {
  const { setScreen, login, isLoading, errorMessage, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login({ email, password, rememberMe });
  };

  const handleGoogleLogin = async () => {
    clearError();
    await login({
      email: 'google.traveler@example.com',
      password: 'SamplePassword123!',
      rememberMe: true,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-4 sm:px-6 pt-3 pb-6">
      {/* Brand Logo */}
      <div className="flex justify-center items-center mt-2 mb-3">
        <BrandLogo size="md" />
      </div>

      {/* Headings */}
      <div className="text-center mt-1 mb-5">
        <h1 className="text-[28px] sm:text-[30px] font-extrabold text-[#253331] tracking-tight leading-tight">
          Welcome Back
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#6E7977] font-normal mt-1">
          Login to access your account
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-[14px] font-medium text-[#253331] mb-1.5 pl-1" htmlFor="login-email">
            Email address
          </label>
          <div className="relative">
            <input
              id="login-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tim.jennings@example.com"
              required
              className="w-full h-[50px] px-5 rounded-full bg-white border border-[#EBE6DC] text-[#253331] placeholder-[#A0AAA8] text-[15px] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-[14px] font-medium text-[#253331] mb-1.5 pl-1" htmlFor="login-password">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={`w-full h-[50px] pl-5 pr-12 rounded-full bg-white border border-[#EBE6DC] text-[#253331] placeholder-[#A0AAA8] text-[15px] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 transition-all shadow-xs ${
                !showPassword ? 'tracking-widest' : ''
              }`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#6E7977] hover:text-[#253331] transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        {/* Utilities: Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-0.5 px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-[18px] h-[18px] rounded-[5px] border-[#BDC9C6] text-[#0F766E] focus:ring-[#0F766E] focus:ring-offset-0 cursor-pointer transition-colors"
            />
            <span className="text-[14px] text-[#253331] font-normal">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => {
              clearError();
              setScreen('forgot-password');
            }}
            className="text-[14px] font-medium text-[#0F766E] hover:underline transition-colors focus:outline-none"
          >
            Forgot password?
          </button>
        </div>

        {/* Primary CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[50px] rounded-full bg-[#0F766E] text-white font-semibold text-[16px] tracking-wide shadow-sm hover:bg-[#0D645E] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Logging in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </div>

        {/* Secondary Signup Link */}
        <div className="text-center pt-1.5">
          <p className="text-[14px] text-[#253331]">
            Don't have account?{' '}
            <button
              type="button"
              onClick={() => {
                clearError();
                setScreen('signup');
              }}
              className="font-bold text-[#0F766E] hover:underline ml-1 focus:outline-none"
            >
              Sign Up
            </button>
          </p>
        </div>

        {/* Social Login Button */}
        <div className="pt-1.5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-[50px] rounded-full bg-white border border-[#EBE6DC] text-[#253331] font-medium text-[15px] flex items-center justify-center gap-3 shadow-xs hover:bg-[#F3EFE7] active:scale-[0.98] transition-all"
          >
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
            <span>Login with Google</span>
          </button>
        </div>
      </form>

      {/* Privacy Architecture Notice & Footer */}
      <div className="mt-auto pt-6 space-y-4">
        <PrivacyCard />
        <LegalFooter />
      </div>
    </div>
  );
};
