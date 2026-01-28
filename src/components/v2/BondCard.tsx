'use client';

import { Heart, Check, Lock, Sparkles, Brain, TrendingUp } from 'lucide-react';
import { ReputationLevel } from '@/types';

interface BondCardProps {
  level: ReputationLevel;
  points: number;
  isLoading?: boolean;
}

const LEVEL_CONFIG: Record<ReputationLevel, {
  name: string;
  levelNum: number;
  nextLevel: ReputationLevel | null;
  pointsRequired: number;
  nextPointsRequired: number;
}> = {
  starter: { name: 'Starting', levelNum: 1, nextLevel: 'regular', pointsRequired: 0, nextPointsRequired: 250 },
  regular: { name: 'Growing', levelNum: 2, nextLevel: 'trusted', pointsRequired: 250, nextPointsRequired: 1000 },
  trusted: { name: 'Trusted', levelNum: 3, nextLevel: 'verified', pointsRequired: 1000, nextPointsRequired: 2500 },
  verified: { name: 'Verified', levelNum: 4, nextLevel: 'expert', pointsRequired: 2500, nextPointsRequired: 5000 },
  expert: { name: 'Expert', levelNum: 5, nextLevel: null, pointsRequired: 5000, nextPointsRequired: 5000 },
};

const BENEFITS = [
  { id: 'patterns', label: 'Pattern detection', icon: Brain, unlockedAt: 'starter' },
  { id: 'insights', label: 'Daily insights', icon: Sparkles, unlockedAt: 'starter' },
  { id: 'predictions', label: 'Predictions', icon: TrendingUp, unlockedAt: 'trusted' },
];

export default function BondCard({ level, points, isLoading = false }: BondCardProps) {
  const config = LEVEL_CONFIG[level];
  const progress = config.nextLevel
    ? ((points - config.pointsRequired) / (config.nextPointsRequired - config.pointsRequired)) * 100
    : 100;

  const levelOrder: ReputationLevel[] = ['starter', 'regular', 'trusted', 'verified', 'expert'];
  const currentLevelIndex = levelOrder.indexOf(level);

  const isBenefitUnlocked = (unlockedAt: string) => {
    const unlockedIndex = levelOrder.indexOf(unlockedAt as ReputationLevel);
    return currentLevelIndex >= unlockedIndex;
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl p-5 bg-[#2D2A26] animate-pulse">
        <div className="h-20 bg-white/10 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl p-5 overflow-hidden" style={{
      background: 'linear-gradient(135deg, #2D2A26 0%, #3D3A36 50%, #2D2A26 100%)',
      boxShadow: '0 8px 32px rgba(45, 42, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    }}>
      {/* Background glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(224, 122, 95, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(242, 204, 143, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
              boxShadow: '0 4px 12px rgba(224, 122, 95, 0.4)',
            }}
          >
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-[14px] font-semibold text-white/90">Our Bond</span>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}
        >
          <span className="text-[12px] font-bold text-[#F2CC8F]">Lv. {config.levelNum}</span>
          <span className="text-[12px] font-medium text-white/60">{config.name}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 mb-4">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
          <div
            className="h-full rounded-full relative"
            style={{
              width: `${Math.min(100, progress)}%`,
              background: 'linear-gradient(90deg, #E07A5F 0%, #F2CC8F 100%)',
              boxShadow: '0 0 12px rgba(224, 122, 95, 0.5)',
              transition: 'width 0.5s ease-out',
            }}
          >
            {/* Shimmer effect */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite',
              }}
            />
          </div>
        </div>

        <div className="flex justify-between mt-2">
          <span className="text-[12px] text-white/50">
            <strong className="text-[#F2CC8F] font-semibold">{points}</strong>
            {config.nextLevel && ` / ${config.nextPointsRequired} XP`}
          </span>
          {config.nextLevel && (
            <span className="text-[12px] text-white/40">
              Next: {LEVEL_CONFIG[config.nextLevel].name}
            </span>
          )}
        </div>
      </div>

      {/* Benefits */}
      <div className="flex gap-2 relative z-10 flex-wrap">
        {BENEFITS.map((benefit) => {
          const unlocked = isBenefitUnlocked(benefit.unlockedAt);
          const Icon = benefit.icon;
          return (
            <div
              key={benefit.id}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] ${
                unlocked ? 'text-white/70' : 'text-white/40 opacity-50'
              }`}
              style={{ background: 'rgba(255, 255, 255, 0.08)' }}
            >
              {unlocked ? (
                <Check className="w-3 h-3 text-[#81B29A]" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
              {benefit.label}
            </div>
          );
        })}
      </div>

      {/* Shimmer keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
