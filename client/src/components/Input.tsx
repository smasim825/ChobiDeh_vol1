import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: string | React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      id,
      className = '',
      required,
      ...rest
    },
    ref
  ) => {
    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={id}
            className="block text-[14px] font-medium text-[#253331] mb-1.5 pl-1"
          >
            {label}
            {required && <span className="text-[#BA1A1A] ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leadingIcon && (
            <div className="absolute left-4 text-[#6E7977] pointer-events-none flex items-center justify-center">
              {typeof leadingIcon === 'string' ? (
                <span className="material-symbols-outlined text-[20px]">{leadingIcon}</span>
              ) : (
                leadingIcon
              )}
            </div>
          )}

          <input
            id={id}
            ref={ref}
            required={required}
            className={`w-full min-h-[48px] h-[50px] rounded-xl bg-white border text-[15px] text-[#253331] placeholder-[#A0AAA8] transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 ${
              error
                ? 'border-[#BA1A1A] focus:border-[#BA1A1A]'
                : 'border-[#EBE6DC] focus:border-[#0F766E]'
            } ${leadingIcon ? 'pl-11' : 'px-4'} ${
              trailingIcon ? 'pr-12' : 'pr-4'
            } ${className}`}
            {...rest}
          />

          {trailingIcon && (
            <div className="absolute right-3.5 flex items-center">
              {trailingIcon}
            </div>
          )}
        </div>

        {error && <p className="text-[12px] text-[#BA1A1A] mt-1 pl-1 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-[12px] text-[#6E7977] mt-1 pl-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
