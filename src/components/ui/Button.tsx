'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-300 ease-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-[#E07A5F] text-white hover:bg-[#D36B4F] active:scale-[0.98]',
      secondary: 'bg-[#F5EDE4] text-[#2D2A26] hover:bg-[#EBE3DA] active:scale-[0.98]',
      ghost: 'bg-transparent text-[#8A8580] hover:text-[#2D2A26]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-full',
      md: 'px-6 py-3.5 text-base rounded-full',
      lg: 'px-8 py-4 text-lg rounded-full',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
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
