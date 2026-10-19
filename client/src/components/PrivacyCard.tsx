import React from 'react';

interface PrivacyCardProps {
  customText?: string;
  className?: string;
}

export const PrivacyCard: React.FC<PrivacyCardProps> = ({ customText, className = '' }) => {
  return (
    <div
      className={`bg-[#E7F5F2] border border-[#CDEAE3] rounded-[20px] p-4 flex items-start gap-3.5 shadow-sm text-left ${className}`}
    >
      <div className="w-8 h-8 rounded-full bg-[#0F766E]/15 flex items-center justify-center shrink-0 mt-0.5">
        <span
          className="material-symbols-outlined text-[#0F766E] text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          verified_user
        </span>
      </div>
      <div className="space-y-0.5 flex-1">
        <h3 className="text-[14px] font-bold text-[#101E1C] leading-snug">
          Privacy-first architecture
        </h3>
        <p className="text-[13px] text-[#3E4947] font-normal leading-relaxed">
          {customText ||
            'No automatic scanning of your private camera roll. Photos are shared only when you deliberately invite travelers to a Room.'}
        </p>
      </div>
    </div>
  );
};
