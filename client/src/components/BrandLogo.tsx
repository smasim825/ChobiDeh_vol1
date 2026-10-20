import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const [imageError, setImageError] = useState(false);

  // Height mappings based on screen sizes
  const heightClass = {
    sm: 'h-8',
    md: 'h-10 sm:h-11',
    lg: 'h-12',
  }[size];

  // Official logo hosted asset
  const logoUrl = '/chobideh-logo.svg';

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {!imageError ? (
        <img
          src={logoUrl}
          alt="ChobiDeh"
          className={`${heightClass} w-auto object-contain transition-transform duration-200 hover:scale-105`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#0F766E] flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-[20px]">photo_library</span>
          </div>
          <span className="text-[22px] font-extrabold tracking-tight text-[#101E1C] font-manrope">
            Chobi<span className="text-[#0F766E]">Deh</span>
          </span>
        </div>
      )}
    </div>
  );
};
