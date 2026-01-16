'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#8A8580] mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-5 py-4 bg-[#F5EDE4] text-[#2D2A26] placeholder-[#B5AFA8] rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#E07A5F]/30 focus:bg-white transition-all duration-300 ease-out text-lg ${error ? 'border-[#E07A5F]' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-[#E07A5F]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
