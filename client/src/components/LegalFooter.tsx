import React from 'react';

interface LegalFooterProps {
  className?: string;
}

export const LegalFooter: React.FC<LegalFooterProps> = ({ className = '' }) => {
  return (
    <footer className={`mt-auto pt-4 text-center ${className}`}>
      <p className="text-[12px] text-[#6E7977] leading-relaxed px-2">
        By continuing, you agree to ChobiDeh's{' '}
        <a
          href="#terms"
          onClick={(e) => e.preventDefault()}
          className="font-medium text-[#005C55] underline hover:text-[#00504A] transition-colors"
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          href="#privacy"
          onClick={(e) => e.preventDefault()}
          className="font-medium text-[#005C55] underline hover:text-[#00504A] transition-colors"
        >
          Privacy Policy
        </a>
        .
      </p>
      {/* Home indicator bar simulator for iOS style */}
      <div className="w-32 h-1 bg-[#101E1C]/20 rounded-full mx-auto mt-4" />
    </footer>
  );
};
