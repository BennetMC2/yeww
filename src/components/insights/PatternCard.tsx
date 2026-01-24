'use client';

import { TrendingUp, TrendingDown, Link2 } from 'lucide-react';

interface PatternCardProps {
  pattern: {
    id: string;
    description: string;
    metricA: string;
    metricB?: string;
    correlationStrength?: number;
    confidence: number;
    direction?: 'positive' | 'negative';
    sampleSize?: number;
  };
  onTap?: (pattern: PatternCardProps['pattern']) => void;
}

export default function PatternCard({ pattern, onTap }: PatternCardProps) {
  const isPositive = pattern.direction === 'positive';
  const strength = pattern.correlationStrength
    ? Math.abs(pattern.correlationStrength)
    : 0;
  const strengthLabel = strength >= 0.7 ? 'Strong' : strength >= 0.5 ? 'Moderate' : 'Notable';

  // Simplify metric names for display
  const metricNames: Record<string, string> = {
    steps: 'Steps',
    sleep_hours: 'Sleep',
    hrv: 'HRV',
    rhr: 'Resting HR',
    recovery: 'Recovery',
    weight: 'Weight',
  };

  const metricA = metricNames[pattern.metricA] || pattern.metricA;
  const metricB = pattern.metricB ? metricNames[pattern.metricB] || pattern.metricB : '';

  return (
    <button
      onClick={() => onTap?.(pattern)}
      className="w-full text-left p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isPositive ? 'bg-green-50' : 'bg-amber-50'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-green-600" />
          ) : (
            <TrendingDown className="w-5 h-5 text-amber-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Metric link */}
          <div className="flex items-center gap-1 text-xs text-[#8A8580] mb-1">
            <span>{metricA}</span>
            <Link2 className="w-3 h-3" />
            <span>{metricB}</span>
            <span className="ml-2 px-1.5 py-0.5 bg-[#F5EDE4] rounded text-[10px] font-medium">
              {strengthLabel}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-[#2D2A26] leading-snug">
            {pattern.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2 text-xs text-[#B5AFA8]">
            <span>{Math.round(pattern.confidence * 100)}% confidence</span>
            {pattern.sampleSize && (
              <span>{pattern.sampleSize} days analyzed</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
