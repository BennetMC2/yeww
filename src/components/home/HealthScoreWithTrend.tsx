'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import HealthScoreGauge from '@/components/scores/HealthScoreGauge';
import { HealthScoreTrend } from '@/lib/healthHistory';

interface HealthScoreWithTrendProps {
  score: number;
  trend: HealthScoreTrend | null;
  onClick?: () => void;
  isLoading?: boolean;
}

export default function HealthScoreWithTrend({
  score,
  trend,
  onClick,
  isLoading,
}: HealthScoreWithTrendProps) {
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-[#8A8580] bg-[#F5EDE4]';

    switch (trend.trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-[#8A8580] bg-[#F5EDE4]';
    }
  };

  const getTrendText = () => {
    if (!trend || trend.change === 0) return 'No change';

    const prefix = trend.change > 0 ? '+' : '';
    return `${prefix}${trend.change} this week`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-[200px] h-[200px] rounded-full bg-[#F5EDE4] animate-pulse" />
        <div className="h-6 w-24 bg-[#F5EDE4] rounded mt-3 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <HealthScoreGauge
        score={score}
        size="lg"
        animated={true}
        onClick={onClick}
      />

      {/* Trend badge */}
      <div className="mt-3 flex items-center gap-2">
        {trend && trend.change !== 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">{getTrendText()}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-[#8A8580] mt-2">Tap to see breakdown</p>
    </div>
  );
}
