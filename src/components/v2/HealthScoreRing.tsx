'use client';

import { useEffect, useState } from 'react';
import { Moon, Zap, TrendingUp } from 'lucide-react';

interface HealthScoreRingProps {
  score: number;
  sleepQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  recoveryScore?: number;
  activityStatus?: string;
  isLoading?: boolean;
}

export default function HealthScoreRing({
  score,
  sleepQuality = 'good',
  recoveryScore = 75,
  activityStatus = 'On track',
  isLoading = false,
}: HealthScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [strokeOffset, setStrokeOffset] = useState(339.292); // Full circle

  // Animate score on mount
  useEffect(() => {
    if (isLoading) return;

    // Animate the number
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(interval);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    // Animate the ring
    const targetOffset = 339.292 * (1 - score / 100);
    setTimeout(() => setStrokeOffset(targetOffset), 100);

    return () => clearInterval(interval);
  }, [score, isLoading]);

  const getStatusText = () => {
    if (score >= 80) return 'Thriving';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs attention';
  };

  const getStatusColor = () => {
    if (score >= 65) return 'bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9] text-[#2E7D32]';
    if (score >= 50) return 'bg-gradient-to-r from-[#FFF8E1] to-[#FFECB3] text-[#F57F17]';
    return 'bg-gradient-to-r from-[#FFEBEE] to-[#FFCDD2] text-[#C62828]';
  };

  const sleepLabels = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center gap-6">
          <div className="w-[130px] h-[130px] rounded-full bg-[#F5EDE4]" />
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-[#F5EDE4] rounded-full w-24" />
            <div className="h-4 bg-[#F5EDE4] rounded w-32" />
            <div className="h-4 bg-[#F5EDE4] rounded w-28" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      {/* Score Ring */}
      <div className="relative w-[130px] h-[130px] flex-shrink-0">
        <svg
          width="130"
          height="130"
          viewBox="0 0 130 130"
          className="transform -rotate-90"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(224, 122, 95, 0.3))' }}
        >
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E07A5F" />
              <stop offset="50%" stopColor="#F2CC8F" />
              <stop offset="100%" stopColor="#81B29A" />
            </linearGradient>
          </defs>
          {/* Glow layer */}
          <circle
            cx="65"
            cy="65"
            r="54"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray="339.292"
            strokeDashoffset={strokeOffset}
            opacity="0.3"
            style={{ filter: 'blur(8px)', transition: 'stroke-dashoffset 1.5s ease-out' }}
          />
          {/* Background ring */}
          <circle
            cx="65"
            cy="65"
            r="54"
            fill="none"
            stroke="#F5EDE4"
            strokeWidth="12"
          />
          {/* Progress ring */}
          <circle
            cx="65"
            cy="65"
            r="54"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="339.292"
            strokeDashoffset={strokeOffset}
            style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[42px] font-extrabold text-[#2D2A26] leading-none tracking-tight">
            {animatedScore}
          </span>
          <span className="text-[11px] text-[#8A8580] font-medium mt-0.5">out of 100</span>
        </div>
      </div>

      {/* Score Details */}
      <div className="flex-1 min-w-0">
        {/* Status Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3 ${getStatusColor()}`}>
          <span className="w-2 h-2 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
          <span className="text-[13px] font-semibold">{getStatusText()}</span>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E8EAF6] to-[#C5CAE9] flex items-center justify-center">
              <Moon className="w-3.5 h-3.5 text-[#5C6BC0]" />
            </div>
            <span className="text-[13px] text-[#6B6560]">
              <strong className="text-[#2D2A26] font-semibold">Sleep</strong> — {sleepLabels[sleepQuality]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-[#F2994A]" />
            </div>
            <span className="text-[13px] text-[#6B6560]">
              <strong className="text-[#2D2A26] font-semibold">Recovery</strong> — {recoveryScore}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F3E5F5] to-[#E1BEE7] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-[#9C27B0]" />
            </div>
            <span className="text-[13px] text-[#6B6560]">
              <strong className="text-[#2D2A26] font-semibold">Activity</strong> — {activityStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
