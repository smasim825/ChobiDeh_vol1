import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
export type ButtonSize = 'default' | 'sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  isLoading = false,
  icon,
  className = '',
  disabled,
  type = 'button',
  ...rest
}) => {
  // Standard design system sizing: 48px–52px min-height, 16px font-size, 600 weight, rounded-full
  const baseStyles =
    'rounded-full font-semibold tracking-wide inline-flex items-center justify-center select-none transition-all duration-150 focus:outline-none';

  const sizeStyles =
    size === 'default'
      ? 'min-h-[48px] h-[50px] px-6 text-[16px] gap-2.5'
      : 'min-h-[40px] h-[42px] px-4 text-[14px] gap-2';

  const variantStyles = {
    primary:
      'bg-[#0F766E] text-white shadow-sm hover:bg-[#0D645E] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
    secondary:
      'bg-[#E7F7F4] text-[#005C55] hover:bg-[#D8F1EB] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed',
    outline:
      'bg-white border border-[#EBE6DC] text-[#253331] shadow-xs hover:bg-[#F3EFE7] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed',
    danger:
      'bg-[#BA1A1A] text-white shadow-sm hover:bg-[#93000A] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span className="flex items-center shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;
