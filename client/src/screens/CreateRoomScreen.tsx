import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const CreateRoomScreen: React.FC = () => {
  const { setScreen } = useAuth();

  const [roomName, setRoomName] = useState('Sajek Valley Expedition');
  const [selectedCategory, setSelectedCategory] = useState('Travel & Roadtrip');
  const [eventDate, setEventDate] = useState('Oct 14 — Oct 18, 2024');
  const [selectedCover, setSelectedCover] = useState('cloud_peak');
  const [passcode, setPasscode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'travel', label: 'Travel & Roadtrip', icon: 'explore' },
    { id: 'family', label: 'Family & Friends', icon: 'diversity_1' },
    { id: 'campus', label: 'Campus / Alumni', icon: 'school' },
    { id: 'wedding', label: 'Wedding & Event', icon: 'celebration' },
  ];

  const coverPresets = [
    {
      id: 'cloud_peak',
      title: 'Cloud Peak',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaVmD4MnddAPe6CaZ6cUT6ZJykFOGBe9H3SSq_IOVedUfG0TSHW_kFCF1Ra4nEg8RIE1hoBkVMO8RcNuGSP_m2T6CI5oTk5RPw0kzTDPJHe2BiXgCjCFPzabfLHHknMf3TH381ZR-nY65ZQdOClYrGuqGM1VQ_1-6X-bef4cbp7hptMJ6NakoYsrFjLy-Q_XwQOueqVx0gyykhFJuD4m336vRJRRrHTP2JspECYqtTYACtCH0QxcBM',
    },
    {
      id: 'sunset_cove',
      title: 'Sunset Cove',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvwNHi7wAt2XVqZ-dKnyfSkiEvqAm5ahP_QFG8rERpmNnt_SPgxua6GdY1g5sjH_A2qb2cIjr5XIGFwpmMY40nOdol97rlK3TAxqjhw7c0_r-Xugr11MbfheoqzhsCb1hEr5MDe5oq5LASoGCqSaa-0S1T4IH0Kvrm8V2wzwgj0RuBR-tkfEX8R6dMI-AVFJwLAAzjPOLfzbtgWqR7lG20J7-RlFmv4-ghbH_Z5jTkI61EwSdeDOlM',
    },
    {
      id: 'tea_horizon',
      title: 'Tea Horizon',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWYrfftPQsdshkkzfF_31E5qQ1tB9MUONyujMzgYasT3aImHUzFnNEMpa8ir_rloshsfk8-3pRCE2pVoBrWsrWgx9zT30rR-D72VIEbGjZSICEbjNj8Yq3flbktTvz1P8b1Iy2eCYYmpQvcSigPmMZiV3TBovDwmwN_5NVJs9WU1oLkuRwGqq2xt-cAiJZKFQRvpIzq-o3Y5BtaJ1hQYq1lE0ZCHhAlldSkd5sz1K5U77G6YcyczRv',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setScreen('room-area');
    }, 600);
  };

  return (
    <div className="bg-[#EDFDF9] text-[#101E1C] antialiased min-h-screen pb-28 selection:bg-[#9CF2E8]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-4 h-14 bg-[#EDFDF9]/85 backdrop-blur-md shadow-xs border-b border-[#D6E6E2]/40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Back"
            onClick={() => setScreen('home')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#005C55] hover:bg-[#E1F1EE] transition-colors active:scale-95 focus:outline-none"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="flex flex-col text-left">
            <h1 className="text-[17px] font-bold text-[#005C55] tracking-tight leading-tight">Create a Room</h1>
            <span className="text-[11px] text-[#3E4947] -mt-0.5">ChobiDeh Archival</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => alert('Rooms are private, invitation-only photo spaces with end-to-end access isolation.')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#005C55] hover:bg-[#E1F1EE] focus:outline-none"
        >
          <span className="material-symbols-outlined text-[20px]">help_outline</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto pt-16 px-4 space-y-4 text-left">
        {/* Intro Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#E7F7F4] border border-[#BDC9C6]/40 p-4 mt-2">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#005C55]/10 text-[#005C55] text-[11px] font-bold">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span>Intelligent Shared Album</span>
            </div>
            <h2 className="text-[18px] text-[#101E1C] font-bold">Shared Space for Memories</h2>
            <p className="text-[13px] text-[#3E4947] leading-relaxed">
              Gather everyone's high-res shots into a curated gallery with local facial categorization.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Name */}
          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-[#101E1C] flex justify-between" htmlFor="room-title">
              <span>Room Name</span>
              <span className="text-[11px] text-[#6E7977]">Required</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#6E7977] text-[20px] pointer-events-none">
                meeting_room
              </span>
              <input
                id="room-title"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Sajek Valley Expedition"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#BDC9C6]/60 text-[14px] text-[#101E1C] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 shadow-xs"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-semibold text-[#101E1C]">Category Preset</label>
              <span className="text-[11px] font-semibold text-[#8E4E14]">Curatorial Tag</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.label)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold transition-all ${
                    selectedCategory === cat.label
                      ? 'bg-[#005C55] text-white shadow-xs'
                      : 'bg-white border border-[#BDC9C6]/60 text-[#101E1C] hover:bg-[#E1F1EE]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timeline / Date */}
          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-[#101E1C]" htmlFor="event-date">
              Timeline or Date Range
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#6E7977] text-[19px] pointer-events-none">
                calendar_today
              </span>
              <input
                id="event-date"
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#BDC9C6]/60 text-[14px] text-[#101E1C] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 shadow-xs"
              />
            </div>
          </div>

          {/* Cover Visual Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-semibold text-[#101E1C]">Cover Visual</label>
              <span className="text-[11px] text-[#3E4947]">16:9 Archival Presets</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {coverPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => setSelectedCover(preset.id)}
                  className={`group relative aspect-video rounded-xl overflow-hidden cursor-pointer shadow-xs transition-all ${
                    selectedCover === preset.id
                      ? 'ring-2 ring-[#005C55] ring-offset-2'
                      : 'border border-[#BDC9C6]/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {selectedCover === preset.id && (
                    <span className="absolute top-1.5 right-1.5 bg-[#005C55] text-white rounded-full p-0.5">
                      <span className="material-symbols-outlined text-[13px]">check</span>
                    </span>
                  )}
                  <span className="absolute bottom-1 left-1.5 text-[10px] text-white font-semibold">
                    {preset.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Passcode Security */}
          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-[#101E1C]" htmlFor="room-passcode">
              Joining Passcode (Optional)
            </label>
            <input
              id="room-passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#BDC9C6]/60 text-[14px] text-[#101E1C] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 shadow-xs"
            />
            <p className="text-[11px] text-[#6E7977]">
              Enforces passcode authentication for newly invited members.
            </p>
          </div>

          {/* Submit Action (48-52px min-height, 16px semi-bold, rounded-full) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] h-[50px] px-6 rounded-full bg-[#0F766E] hover:bg-[#005C55] text-white font-semibold text-[16px] tracking-wide shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <span>Creating Shared Space...</span>
              ) : (
                <>
                  <span>Create Shared Room</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
