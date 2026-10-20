import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const JoinRoomScreen: React.FC = () => {
  const { setScreen } = useAuth();
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [joinSlug, setJoinSlug] = useState(routeSlug || '');
  const [passcode, setPasscode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (routeSlug) {
      setJoinSlug(routeSlug);
    }
  }, [routeSlug]);

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const cleaned = text.trim().replace(/\/$/, '').split('/').pop() || text.trim();
        setJoinSlug(cleaned.toLowerCase());
      }
    } catch {
      setErrorMessage('Clipboard permission denied. Please paste or type manually.');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinSlug.trim()) {
      setErrorMessage('Please enter a room invite code or link slug.');
      return;
    }
    setErrorMessage(null);
    setIsJoining(true);

    if (supabase) {
      const { error } = await supabase.rpc('join_room', {
        slug: joinSlug.trim().toLowerCase(),
        passcode: passcode.trim() || null,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsJoining(false);
        return;
      }

      setIsJoining(false);
      setSuccess(true);
      setTimeout(() => {
        setScreen('home');
        navigate('/');
      }, 1200);
      return;
    }

    // Fallback simulation mode
    setIsJoining(false);
    setScreen('home');
    navigate('/');
  };

  return (
    <div className="bg-[#EDFDF9] text-[#101E1C] antialiased min-h-screen pb-28 selection:bg-[#9CF2E8]">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-4 h-14 bg-[#EDFDF9]/85 backdrop-blur-md shadow-xs border-b border-[#D6E6E2]/40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Back"
            onClick={() => {
              setScreen('home');
              navigate('/');
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#0F766E] hover:bg-[#E1F1EE] active:scale-95 transition-all focus:outline-none"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 className="text-[17px] font-bold text-[#005C55] tracking-tight">Join a Room</h1>
        </div>
        <button
          type="button"
          onClick={() => alert('Ask your room host for the invite code or join link.')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#005C55] hover:bg-[#E1F1EE] focus:outline-none"
        >
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto pt-16 px-4 space-y-4 text-left">
        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-[#FFDAD6] border border-[#BA1A1A]/30 rounded-xl text-[13px] text-[#93000A] font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}
        {success && (
          <div className="p-3.5 bg-[#E7F7F4] border border-[#0F766E]/30 rounded-xl text-[13px] text-[#005C55] font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Joined room successfully! Redirecting...</span>
          </div>
        )}

        {/* Hero Card */}
        <section className="relative overflow-hidden rounded-2xl bg-white p-5 border border-[#BDC9C6]/40 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[#0F766E] bg-[#9CF2E8]/40 text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[13px]">meeting_room</span>
              Collective Canvas
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#6E7977]">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Private Room
            </span>
          </div>
          <h2 className="text-[20px] font-bold text-[#101E1C] tracking-tight mb-1">
            Enter Room Code or Scan QR
          </h2>
          <p className="text-[13px] text-[#3E4947] leading-relaxed">
            Enter the room invite slug or link provided by the room host.
          </p>
        </section>

        {/* Room Key Input */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <label className="text-[13px] font-semibold text-[#101E1C]" htmlFor="join-slug">
                Room Invite Code or Slug
              </label>
              <button
                type="button"
                onClick={handlePasteCode}
                className="inline-flex items-center gap-1 text-[#005C55] hover:underline text-[12px] font-semibold"
              >
                <span className="material-symbols-outlined text-[15px]">content_paste</span>
                Paste from Clipboard
              </button>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#6E7977] text-[20px] pointer-events-none">
                link
              </span>
              <input
                id="join-slug"
                type="text"
                value={joinSlug}
                onChange={(e) => setJoinSlug(e.target.value)}
                placeholder="e.g. 7f8a9b2c3d4e or room link"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#BDC9C6]/60 text-[14px] text-[#101E1C] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 shadow-xs font-mono"
              />
            </div>
          </div>

          {/* Passcode input */}
          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-[#101E1C]" htmlFor="join-passcode">
              Room Secret / Passcode
            </label>
            <input
              id="join-passcode"
              type="password"
              placeholder="••••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#BDC9C6]/60 text-[14px] text-[#101E1C] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 shadow-xs"
            />
          </div>

          {/* QR Scanner trigger / view */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowScanner(!showScanner)}
              className="w-full py-2.5 px-4 rounded-xl border border-[#005C55]/30 bg-white hover:bg-[#E7F7F4] text-[#005C55] text-[13px] font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              <span>{showScanner ? 'Hide QR Viewfinder' : 'Scan Host QR Code'}</span>
            </button>
          </div>

          {showScanner && (
            <div className="p-4 rounded-2xl bg-[#101E1C] text-white text-center space-y-3 animate-fadeIn">
              <div className="relative w-48 h-48 mx-auto border-2 border-dashed border-[#9CF2E8] rounded-xl flex items-center justify-center overflow-hidden">
                <div className="w-full h-1 bg-[#0F766E] absolute top-1/2 -translate-y-1/2 animate-pulse shadow-md" />
                <span className="material-symbols-outlined text-[48px] text-[#9CF2E8]/40">photo_camera</span>
              </div>
              <p className="text-[12px] text-[#BDC9C6]">Point camera at the room host's screen</p>
            </div>
          )}

          {/* Submit Action (48-52px min-height, 16px font-semibold, rounded-full) */}
          <button
            type="submit"
            disabled={isJoining}
            className="w-full min-h-[48px] h-[50px] px-6 rounded-full bg-[#0F766E] hover:bg-[#005C55] text-white font-semibold text-[16px] tracking-wide shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
          >
            {isJoining ? (
              <span>Connecting to Vault...</span>
            ) : (
              <>
                <span>Join Room</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};
