'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, glow = false, disabled, style, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E07A5F] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none';

    const sizes = {
      sm: 'px-5 py-2.5 text-[13px] rounded-[12px]',
      md: 'px-6 py-3.5 text-[14px] rounded-[16px]',
      lg: 'px-8 py-4 text-[16px] rounded-[18px]',
    };

    const widthClass = fullWidth ? 'w-full' : '';
    const glowClass = glow && !disabled ? 'animate-glow' : '';

    // Premium gradient styles
    const getVariantStyles = () => {
      if (variant === 'primary') {
        return {
          background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
          boxShadow: disabled ? 'none' : '0 4px 16px rgba(224, 122, 95, 0.35)',
          color: '#FFFFFF',
        };
      }
      if (variant === 'secondary') {
        return {
          background: 'linear-gradient(135deg, #F5EDE4 0%, #EBE3DA 100%)',
          boxShadow: '0 2px 8px rgba(45, 42, 38, 0.08)',
          color: '#2D2A26',
        };
      }
      return {
        background: 'transparent',
        color: '#8A8580',
      };
    };

    const hoverClass = variant === 'primary' || variant === 'secondary'
      ? 'hover:-translate-y-0.5 active:scale-[0.97]'
      : 'hover:text-[#2D2A26] active:scale-[0.97]';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizes[size]} ${widthClass} ${glowClass} ${hoverClass} ${className}`}
        disabled={disabled}
        style={{ ...getVariantStyles(), ...style }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
