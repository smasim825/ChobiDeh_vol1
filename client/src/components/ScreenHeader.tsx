import React from 'react';

interface ScreenHeaderProps {
  onBack: () => void;
  badgeText?: string;
  badgeIcon?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  onBack,
  badgeText = 'SECURE LINK',
  badgeIcon = 'lock',
}) => {
  return (
    <nav className="w-full flex items-center justify-between py-2 mb-2">
      <button
        type="button"
        aria-label="Go back to previous screen"
        onClick={onBack}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/90 text-[#101E1C] shadow-sm border border-[#BDC9C6]/30 active:scale-95 hover:bg-[#E1F1EE] transition-all duration-150"
      >
        <span className="material-symbols-outlined text-[#0F766E] text-[20px]">
          arrow_back
        </span>
      </button>

      <div className="flex items-center gap-1.5 px-3 py-1 bg-[#E7F7F4] border border-[#BDC9C6]/30 rounded-full">
        <span
          className="material-symbols-outlined text-[15px] text-[#0F766E]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {badgeIcon}
        </span>
        <span className="text-[11px] font-bold tracking-wider text-[#0F766E] uppercase">
          {badgeText}
        </span>
      </div>

      <div className="w-10 h-10 opacity-0 pointer-events-none" />
    </nav>
  );
};
