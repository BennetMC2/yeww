'use client';

import { Flame, Coins } from 'lucide-react';
import { ReputationLevel, REPUTATION_THRESHOLDS } from '@/types';
import { getNextReputationLevel, getReputationLevelLabel } from '@/lib/scores';

interface ProgressFooterProps {
  streak: number;
  points: number;
  reputationLevel: ReputationLevel;
  reputationPoints: number;
}

// Streak milestones
const STREAK_MILESTONES = [7, 14, 30, 60, 100];

function getNextStreakMilestone(currentStreak: number): number {
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak < milestone) {
      return milestone;
    }
  }
  return STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
}

function getStreakProgress(currentStreak: number): number {
  const nextMilestone = getNextStreakMilestone(currentStreak);
  const previousMilestone = STREAK_MILESTONES.find((m, i) =>
    i > 0 && STREAK_MILESTONES[i - 1] < currentStreak && m >= currentStreak
  ) ? STREAK_MILESTONES[STREAK_MILESTONES.indexOf(getNextStreakMilestone(currentStreak)) - 1] : 0;

  const progress = (currentStreak - previousMilestone) / (nextMilestone - previousMilestone);
  return Math.min(1, Math.max(0, progress));
}

export default function ProgressFooter({
  streak,
  points,
  reputationLevel,
  reputationPoints,
}: ProgressFooterProps) {
  const nextStreakMilestone = getNextStreakMilestone(streak);
  const daysToMilestone = nextStreakMilestone - streak;
  const streakProgress = getStreakProgress(streak);

  const nextLevel = getNextReputationLevel(reputationLevel);
  const nextLevelThreshold = nextLevel ? REPUTATION_THRESHOLDS[nextLevel] : REPUTATION_THRESHOLDS.expert;
  const currentLevelThreshold = REPUTATION_THRESHOLDS[reputationLevel];
  const pointsToNextLevel = nextLevel ? nextLevelThreshold - reputationPoints : 0;

  // Calculate reputation progress
  const reputationProgress = nextLevel
    ? (reputationPoints - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)
    : 1;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex gap-6">
        {/* Streak Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-[#E07A5F]" />
            <span className="font-semibold text-[#2D2A26]">{streak}</span>
            <span className="text-sm text-[#8A8580]">day{streak !== 1 ? 's' : ''}</span>
          </div>

          {/* Streak Progress Bar */}
          <div className="h-2 bg-[#F5EDE4] rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-gradient-to-r from-[#E07A5F] to-[#F4A261] rounded-full transition-all duration-500"
              style={{ width: `${streakProgress * 100}%` }}
            />
          </div>

          <p className="text-xs text-[#8A8580]">
            {daysToMilestone > 0
              ? `${daysToMilestone} to ${nextStreakMilestone}-day milestone`
              : `${nextStreakMilestone}-day milestone reached!`}
          </p>
        </div>

        {/* Divider */}
        <div className="w-px bg-[#F5EDE4]" />

        {/* Points/Reputation Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-[#2D2A26]">{points}</span>
            <span className="text-sm text-[#8A8580]">pts</span>
          </div>

          {/* Reputation Progress Bar */}
          <div className="h-2 bg-[#F5EDE4] rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(1, reputationProgress) * 100}%` }}
            />
          </div>

          <p className="text-xs text-[#8A8580]">
            {nextLevel
              ? `${pointsToNextLevel} pts to ${getReputationLevelLabel(nextLevel)}`
              : `${getReputationLevelLabel(reputationLevel)} level`}
          </p>
        </div>
      </div>
    </div>
  );
}
