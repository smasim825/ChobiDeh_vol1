import React, { useState } from 'react';
import type { AuthScreen } from '../types/auth';

interface NavbarProps {
  currentScreen: AuthScreen;
  onSelectScreen: (screen: AuthScreen) => void;
}

interface ScreenTab {
  id: AuthScreen;
  label: string;
  icon: string;
  category: 'auth' | 'app';
}

const SCREENS: ScreenTab[] = [
  { id: 'login', label: 'Login', icon: 'login', category: 'auth' },
  { id: 'signup', label: 'Sign Up', icon: 'person_add', category: 'auth' },
  { id: 'forgot-password', label: 'Forgot Password', icon: 'lock_reset', category: 'auth' },
  { id: 'check-email', label: 'Check Email', icon: 'mark_email_read', category: 'auth' },
  { id: 'home', label: 'Home', icon: 'photo_library', category: 'app' },
  { id: 'room-area', label: 'Room Area', icon: 'meeting_room', category: 'app' },
  { id: 'profile', label: 'Profile', icon: 'person', category: 'app' },
  { id: 'create-room', label: 'Create Room', icon: 'add_circle', category: 'app' },
  { id: 'join-room', label: 'Join Room', icon: 'group_add', category: 'app' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, onSelectScreen }) => {
  if (!import.meta.env.DEV) {
    return null;
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTab = SCREENS.find((s) => s.id === currentScreen) || SCREENS[0];

  const handleSelect = (id: AuthScreen) => {
    onSelectScreen(id);
    setMobileMenuOpen(false);
  };

  const handleBack = () => {
    if (currentScreen === 'forgot-password' || currentScreen === 'check-email') {
      onSelectScreen('login');
    } else if (
      currentScreen === 'room-area' ||
      currentScreen === 'create-room' ||
      currentScreen === 'join-room' ||
      currentScreen === 'profile'
    ) {
      onSelectScreen('home');
    } else {
      onSelectScreen('home');
    }
  };

  const showBackButton = currentScreen !== 'home' && currentScreen !== 'login';

  return (
    <aside
      aria-label="Screen preview selector"
      className="sticky top-0 z-50 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E6E1D8] px-3.5 py-2 text-[12px] shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Active Screen Info */}
        <div className="flex items-center gap-2 shrink-0">
          {showBackButton && (
            <button
              type="button"
              aria-label="Back to main view"
              onClick={handleBack}
              className="sm:hidden w-7 h-7 rounded-full flex items-center justify-center text-[#0F766E] hover:bg-[#E1F1EE] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
          )}

          <div
            onClick={() => onSelectScreen('home')}
            className="flex items-center gap-1.5 cursor-pointer select-none"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E] animate-pulse" />
            <span className="font-bold text-[14px] text-[#101E1C] tracking-tight">
              Chobi<span className="text-[#0F766E]">Deh</span>
            </span>
          </div>

          <span className="hidden md:inline text-[#6E7977] text-[11px]">
            — Archival Workspace
          </span>
        </div>

        {/* MOBILE CONTROLS (< sm breakpoint): No horizontal overflow/scrolling */}
        <div className="flex sm:hidden items-center gap-1.5">
          {/* Active Screen Pill with Menu Trigger */}
          <button
            type="button"
            aria-label="Switch screen"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F7F4] text-[#005C55] font-semibold text-[12px] border border-[#0F766E]/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">{activeTab.icon}</span>
            <span className="truncate max-w-[110px]">{activeTab.label}</span>
            <span className="material-symbols-outlined text-[16px] text-[#0F766E]">
              {mobileMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {/* DESKTOP CONTROLS (>= sm breakpoint): Full Clean Pill Tabs */}
        <nav
          aria-label="Desktop screen selector"
          className="hidden sm:flex items-center gap-1 overflow-x-auto py-0.5 custom-scrollbar"
        >
          {SCREENS.map((item) => {
            const isActive = currentScreen === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`px-3 py-1.5 rounded-full font-semibold text-[12px] transition-all flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#3E4947] hover:bg-[#E1F1EE] hover:text-[#005C55]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* MOBILE SCREEN SELECTOR DROPDOWN (Zero Horizontal Scroll, Clutter-Free) */}
      {mobileMenuOpen && (
        <div className="sm:hidden mt-2 pt-2 border-t border-[#E6E1D8] grid grid-cols-2 gap-1.5 animate-fadeIn">
          {SCREENS.map((item) => {
            const isActive = currentScreen === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full py-2 px-2.5 rounded-xl font-medium text-[12px] flex items-center gap-2 transition-all text-left ${
                  isActive
                    ? 'bg-[#0F766E] text-white font-semibold shadow-xs'
                    : 'bg-[#F8F5EF] text-[#253331] hover:bg-[#E1F1EE]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px] shrink-0">
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
};

export default Navbar;
