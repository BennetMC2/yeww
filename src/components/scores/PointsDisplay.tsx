'use client';

import { Coins } from 'lucide-react';

interface PointsDisplayProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function PointsDisplay({
  points,
  size = 'md',
  showLabel = false,
}: PointsDisplayProps) {
  const sizeConfig = {
    sm: { icon: 14, text: 'text-sm' },
    md: { icon: 18, text: 'text-base' },
    lg: { icon: 22, text: 'text-lg' },
  };

  const config = sizeConfig[size];

  return (
    <div className="flex items-center gap-1.5">
      <Coins
        className="text-[#F59E0B]"
        style={{ width: config.icon, height: config.icon }}
      />
      <span className={`${config.text} font-semibold text-[#2D2A26]`}>
        {points.toLocaleString()}
      </span>
      {showLabel && (
        <span className={`${config.text} text-[#8A8580]`}>pts</span>
      )}
    </div>
  );
}
