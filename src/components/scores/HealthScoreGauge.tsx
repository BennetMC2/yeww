'use client';

import { useEffect, useState } from 'react';
import { getHealthScoreColor, getHealthScoreLabel } from '@/lib/scores';

interface HealthScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
}

export default function HealthScoreGauge({
  score,
  size = 'md',
  animated = true,
  showLabel = true,
  onClick,
}: HealthScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    // Animate from 0 to score
    const duration = 1500;
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (score - startValue) * easeOut);

      setDisplayScore(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, animated]);

  const sizeConfig = {
    sm: { width: 100, strokeWidth: 8, fontSize: 'text-2xl' },
    md: { width: 160, strokeWidth: 12, fontSize: 'text-4xl' },
    lg: { width: 200, strokeWidth: 14, fontSize: 'text-5xl' },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;
  const color = getHealthScoreColor(displayScore);
  const label = getHealthScoreLabel(displayScore);

  return (
    <div
      className={`relative inline-flex flex-col items-center ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <svg
        width={config.width}
        height={config.width}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="#F5EDE4"
          strokeWidth={config.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300"
        />
      </svg>
      {/* Score number in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${config.fontSize} font-bold text-[#2D2A26]`}>
          {displayScore}
        </span>
        {showLabel && (
          <span className="text-xs text-[#8A8580] font-medium mt-1">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
