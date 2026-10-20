import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const CreateRoomScreen: React.FC = () => {
  const { setScreen } = useAuth();

  const [roomName, setRoomName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Travel & Roadtrip');
  const [eventDate, setEventDate] = useState('');
  const [selectedCover, setSelectedCover] = useState('teal_gradient');
  const [passcode, setPasscode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ id: string; join_slug: string } | null>(null);

  const categories = [
    { id: 'travel', label: 'Travel & Roadtrip', icon: 'explore' },
    { id: 'family', label: 'Family & Friends', icon: 'diversity_1' },
    { id: 'campus', label: 'Campus / Alumni', icon: 'school' },
    { id: 'wedding', label: 'Wedding & Event', icon: 'celebration' },
  ];

  const coverPresets = [
    {
      id: 'teal_gradient',
      title: 'Emerald Peak',
      gradient: 'from-[#005C55] to-[#9CF2E8]',
    },
    {
      id: 'sunset_gradient',
      title: 'Warm Amber',
      gradient: 'from-[#8E4E14] to-[#FFAB69]',
    },
    {
      id: 'slate_gradient',
      title: 'Archival Slate',
      gradient: 'from-[#253331] to-[#6E7977]',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setErrorMessage('Room name is required.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);

    if (supabase) {
      const { data, error } = await supabase.rpc('create_room', {
        room_name: roomName.trim(),
        passcode: passcode.trim() || null,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setSuccessInfo(data);
      setTimeout(() => {
        setScreen('home');
      }, 1500);
      return;
    }

    // Fallback simulation mode
    setIsSubmitting(false);
    setScreen('home');
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
          onClick={() => alert('Rooms are private, invitation-only photo spaces with membership-based access isolation.')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#005C55] hover:bg-[#E1F1EE] focus:outline-none"
        >
          <span className="material-symbols-outlined text-[20px]">help_outline</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto pt-16 px-4 space-y-4 text-left">
        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-[#FFDAD6] border border-[#BA1A1A]/30 rounded-xl text-[13px] text-[#93000A] font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}
        {successInfo && (
          <div className="p-3.5 bg-[#E7F7F4] border border-[#0F766E]/30 rounded-xl text-[13px] text-[#005C55] font-semibold space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Room created successfully!</span>
            </div>
            <p className="text-[12px] font-normal text-[#3E4947]">
              Join link slug: <strong className="font-mono text-[#005C55]">{successInfo.join_slug}</strong>
            </p>
          </div>
        )}

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
              Gather everyone's high-res shots into a private room. Face grouping runs on our servers and only if you opt in.
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
                  className={`group relative aspect-video rounded-xl overflow-hidden cursor-pointer shadow-xs transition-all bg-gradient-to-br ${preset.gradient} ${
                    selectedCover === preset.id
                      ? 'ring-2 ring-[#005C55] ring-offset-2'
                      : 'border border-[#BDC9C6]/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="absolute inset-0 bg-black/15" />
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
