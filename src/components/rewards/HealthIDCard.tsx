'use client';

import { Star, Shield, TrendingUp, Sparkles } from 'lucide-react';
import { ReputationTier } from '@/types';

interface HealthIDCardProps {
  name: string;
  healthScore: number;
  reputationScore: number;
  reputationTier: ReputationTier;
  memberSince: string;
  className?: string;
}

const TIER_CONFIG: Record<ReputationTier, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof Star;
}> = {
  starter: {
    label: 'Starter',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: Shield,
  },
  verified: {
    label: 'Verified',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Shield,
  },
  trusted: {
    label: 'Trusted',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: Star,
  },
  elite: {
    label: 'Elite',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: Sparkles,
  },
};

const TIER_THRESHOLDS = {
  verified: 50,
  trusted: 150,
  elite: 300,
};

export default function HealthIDCard({
  name,
  healthScore,
  reputationScore,
  reputationTier,
  memberSince,
  className = '',
}: HealthIDCardProps) {
  const tierConfig = TIER_CONFIG[reputationTier];
  const TierIcon = tierConfig.icon;

  // Calculate progress to next tier
  const getNextTierProgress = (): { nextTier: string; progress: number; pointsNeeded: number } | null => {
    if (reputationTier === 'elite') return null;

    let nextTierThreshold: number;
    let nextTierName: string;
    let currentThreshold = 0;

    if (reputationTier === 'starter') {
      nextTierThreshold = TIER_THRESHOLDS.verified;
      nextTierName = 'Verified';
    } else if (reputationTier === 'verified') {
      currentThreshold = TIER_THRESHOLDS.verified;
      nextTierThreshold = TIER_THRESHOLDS.trusted;
      nextTierName = 'Trusted';
    } else {
      currentThreshold = TIER_THRESHOLDS.trusted;
      nextTierThreshold = TIER_THRESHOLDS.elite;
      nextTierName = 'Elite';
    }

    const progressInTier = reputationScore - currentThreshold;
    const tierRange = nextTierThreshold - currentThreshold;
    const progress = Math.min(100, (progressInTier / tierRange) * 100);
    const pointsNeeded = nextTierThreshold - reputationScore;

    return { nextTier: nextTierName, progress, pointsNeeded };
  };

  const nextTierInfo = getNextTierProgress();

  // Format member since date
  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Get health score color
  const getHealthScoreColor = () => {
    if (healthScore >= 80) return 'text-green-500';
    if (healthScore >= 60) return 'text-yellow-500';
    if (healthScore >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2D2A26] to-[#1a1816] p-5 text-white shadow-xl ${className}`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Card content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">HealthID</p>
            <h2 className="text-xl font-semibold">{name}</h2>
          </div>
          {/* Tier badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tierConfig.bgColor}`}>
            <TierIcon className={`w-4 h-4 ${tierConfig.color}`} />
            <span className={`text-sm font-semibold ${tierConfig.color}`}>{tierConfig.label}</span>
          </div>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-6 mb-6">
          {/* Health Score */}
          <div className="flex-1">
            <p className="text-xs text-white/50 mb-1">Health Score</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-bold ${getHealthScoreColor()}`}>{healthScore}</span>
              <span className="text-sm text-white/50">/100</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-white/20" />

          {/* Reputation Score */}
          <div className="flex-1">
            <p className="text-xs text-white/50 mb-1">Reputation</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{reputationScore}</span>
              <span className="text-sm text-white/50">pts</span>
            </div>
          </div>
        </div>

        {/* Tier progress */}
        {nextTierInfo && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-white/50">Progress to {nextTierInfo.nextTier}</span>
              <span className="text-white/70">{nextTierInfo.pointsNeeded} pts needed</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E07A5F] to-[#F4A261] rounded-full transition-all duration-500"
                style={{ width: `${nextTierInfo.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Member since {formatMemberSince(memberSince)}</span>
          </div>
          <div className="text-xs text-white/30">yeww.health</div>
        </div>
      </div>
    </div>
  );
}
