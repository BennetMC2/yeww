'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, glow = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E07A5F] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none';

    const variants = {
      primary: 'bg-[#E07A5F] text-white hover:bg-[#D36B4F] hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0',
      secondary: 'bg-[#F5EDE4] text-[#2D2A26] hover:bg-[#EBE3DA] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0',
      ghost: 'bg-transparent text-[#8A8580] hover:text-[#2D2A26] active:scale-[0.97]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-full',
      md: 'px-6 py-3.5 text-base rounded-full',
      lg: 'px-8 py-4 text-lg rounded-full',
    };

    const widthClass = fullWidth ? 'w-full' : '';
    const glowClass = glow && !disabled ? 'animate-glow' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${glowClass} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
