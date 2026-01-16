'use client';

import { Check } from 'lucide-react';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  showCheckmark?: boolean;
}

export default function Chip({
  label,
  selected = false,
  onClick,
  disabled = false,
  size = 'md',
  icon,
  showCheckmark = true,
}: ChipProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 rounded-full border-2 transition-all duration-300
        ${sizeClasses[size]}
        ${
          selected
            ? 'bg-[#FFE8DC] border-[#E07A5F] text-[#2D2A26]'
            : 'bg-white border-[#F5EDE4] text-[#8A8580] hover:border-[#E07A5F]/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="font-medium">{label}</span>
      {selected && showCheckmark && (
        <Check className="w-4 h-4 text-[#E07A5F] flex-shrink-0" />
      )}
    </button>
  );
}
