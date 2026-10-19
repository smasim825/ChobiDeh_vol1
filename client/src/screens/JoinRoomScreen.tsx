import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const JoinRoomScreen: React.FC = () => {
  const { setScreen } = useAuth();

  const [codeChars, setCodeChars] = useState<string[]>(['C', 'H', 'B', '9', '8', '2']);
  const [passcode, setPasscode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCharChange = (index: number, val: string) => {
    const updated = [...codeChars];
    updated[index] = val.slice(-1).toUpperCase();
    setCodeChars(updated);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`char-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePasteCode = async () => {
    const sample = 'CB9821';
    const split = sample.split('');
    setCodeChars(split);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    setTimeout(() => {
      setIsJoining(false);
      setScreen('room-area');
    }, 700);
  };

  return (
    <div className="bg-[#EDFDF9] text-[#101E1C] antialiased min-h-screen pb-28 selection:bg-[#9CF2E8]">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-4 h-14 bg-[#EDFDF9]/85 backdrop-blur-md shadow-xs border-b border-[#D6E6E2]/40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Back"
            onClick={() => setScreen('home')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#005C55] hover:bg-[#E1F1EE] active:scale-95 transition-all focus:outline-none"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 className="text-[17px] font-bold text-[#005C55] tracking-tight">Join a Room</h1>
        </div>
        <button
          type="button"
          onClick={() => alert('Ask your room creator for the 6-character room access key or camera QR code.')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#005C55] hover:bg-[#E1F1EE] focus:outline-none"
        >
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto pt-16 px-4 space-y-4 text-left">
        {/* Hero Card */}
        <section className="relative overflow-hidden rounded-2xl bg-white p-5 border border-[#BDC9C6]/40 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[#0F766E] bg-[#9CF2E8]/40 text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[13px]">meeting_room</span>
              Collective Canvas
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#6E7977]">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Encrypted
            </span>
          </div>
          <h2 className="text-[20px] font-bold text-[#101E1C] tracking-tight mb-1">
            Enter Room Code or Scan QR
          </h2>
          <p className="text-[13px] text-[#3E4947] leading-relaxed">
            Ask the room host for the 6-character room code or invite link to join shared memories.
          </p>
        </section>

        {/* 6-Char Room Key Segmented Inputs */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <label className="text-[13px] font-semibold text-[#101E1C]" htmlFor="char-0">
                Room Access Key
              </label>
              <button
                type="button"
                onClick={handlePasteCode}
                className="inline-flex items-center gap-1 text-[#005C55] hover:underline text-[12px] font-semibold"
              >
                <span className="material-symbols-outlined text-[15px]">content_paste</span>
                Paste CB-9821
              </button>
            </div>

            {/* 6 Input Boxes */}
            <div className="grid grid-cols-6 gap-2 w-full">
              {codeChars.map((char, i) => (
                <input
                  key={i}
                  id={`char-${i}`}
                  type="text"
                  maxLength={1}
                  value={char}
                  onChange={(e) => handleCharChange(i, e.target.value)}
                  className="w-full h-13 text-center text-[22px] font-extrabold text-[#005C55] bg-white border-2 border-[#0F766E]/40 focus:border-[#0F766E] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 shadow-xs"
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5 px-1 text-[11px] text-[#005E3F] font-medium">
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              <span>Node verified: <strong>ChobiDeh Verified Room</strong></span>
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

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isJoining}
            className="w-full py-3.5 px-6 rounded-full bg-[#0F766E] hover:bg-[#005C55] text-white font-semibold text-[15px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
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
