'use client';

import { Star, Shield, Award, Crown, Sparkles } from 'lucide-react';
import { ReputationLevel } from '@/types';
import { getReputationLevelLabel } from '@/lib/scores';

interface ReputationBadgeProps {
  level: ReputationLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const levelIcons: Record<ReputationLevel, React.ReactNode> = {
  starter: <Star className="w-full h-full" />,
  regular: <Shield className="w-full h-full" />,
  trusted: <Award className="w-full h-full" />,
  verified: <Sparkles className="w-full h-full" />,
  expert: <Crown className="w-full h-full" />,
};

const levelColors: Record<ReputationLevel, string> = {
  starter: '#8A8580',
  regular: '#E07A5F',
  trusted: '#4ADE80',
  verified: '#60A5FA',
  expert: '#F59E0B',
};

export default function ReputationBadge({
  level,
  size = 'md',
  showLabel = true,
}: ReputationBadgeProps) {
  const sizeConfig = {
    sm: { icon: 16, text: 'text-xs' },
    md: { icon: 20, text: 'text-sm' },
    lg: { icon: 24, text: 'text-base' },
  };

  const config = sizeConfig[size];
  const color = levelColors[level];

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center justify-center"
        style={{ width: config.icon, height: config.icon, color }}
      >
        {levelIcons[level]}
      </div>
      {showLabel && (
        <span className={`${config.text} font-medium text-[#2D2A26]`}>
          {getReputationLevelLabel(level)}
        </span>
      )}
    </div>
  );
}
