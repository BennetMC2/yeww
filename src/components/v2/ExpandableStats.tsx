'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { HealthMetrics } from '@/types';

interface ExpandableStatsProps {
  metrics: HealthMetrics | null;
  isLoading?: boolean;
  onMetricTap?: (metric: string) => void;
}

interface MetricRowProps {
  label: string;
  value: string;
  subtext?: string;
  progress: number; // 0-100
  trend?: 'up' | 'down' | 'stable';
  trendGood?: boolean; // Is the trend direction good or bad?
  onClick?: () => void;
}

function MetricRow({ label, value, subtext, progress, trend, trendGood, onClick }: MetricRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 hover:bg-[#FAF6F1] rounded-xl px-2 -mx-2 transition-colors text-left"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#2D2A26]">{label}</span>
          {trend && trend !== 'stable' && (
            <span className={`text-xs ${trendGood ? 'text-green-600' : 'text-[#E07A5F]'}`}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
        </div>
        {subtext && (
          <span className="text-xs text-[#8A8580]">{subtext}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 bg-[#F5EDE4] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E07A5F] rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-[#2D2A26] w-12 text-right">{value}</span>
      </div>
    </button>
  );
}

export default function ExpandableStats({ metrics, isLoading, onMetricTap }: ExpandableStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-[#F5EDE4] rounded w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-[#F5EDE4] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const handleTap = (metric: string) => {
    if (onMetricTap) {
      onMetricTap(metric);
    }
  };

  // Build metric rows based on available data
  const rows: MetricRowProps[] = [];

  if (metrics.sleep) {
    const hours = metrics.sleep.lastNightHours;
    const progress = (hours / 9) * 100; // 9 hours = 100%
    rows.push({
      label: 'Sleep',
      value: `${hours}h`,
      subtext: `avg ${metrics.sleep.avgWeekHours}h`,
      progress,
      trend: hours > metrics.sleep.avgWeekHours ? 'up' : hours < metrics.sleep.avgWeekHours ? 'down' : 'stable',
      trendGood: hours >= metrics.sleep.avgWeekHours,
      onClick: () => handleTap('sleep'),
    });
  }

  if (metrics.recovery) {
    const score = metrics.recovery.score;
    rows.push({
      label: metrics.recovery.label || 'Recovery',
      value: `${score}`,
      subtext: metrics.recovery.status,
      progress: score,
      onClick: () => handleTap('recovery'),
    });
  }

  if (metrics.hrv) {
    const current = metrics.hrv.current;
    const baseline = metrics.hrv.baseline;
    const progress = (current / 100) * 100; // Assuming 100 is max HRV
    rows.push({
      label: 'HRV',
      value: `${current}`,
      subtext: `baseline ${baseline}`,
      progress,
      trend: metrics.hrv.trend,
      trendGood: metrics.hrv.trend === 'up',
      onClick: () => handleTap('hrv'),
    });
  }

  if (metrics.rhr) {
    const current = metrics.rhr.current;
    const baseline = metrics.rhr.baseline;
    // For RHR, lower is better, so invert the progress
    const progress = Math.max(0, 100 - ((current - 40) / 40) * 100); // 40-80 range
    rows.push({
      label: 'RHR',
      value: `${current}`,
      subtext: `baseline ${baseline}`,
      progress,
      trend: metrics.rhr.trend,
      trendGood: metrics.rhr.trend === 'down', // Lower RHR is good
      onClick: () => handleTap('rhr'),
    });
  }

  if (metrics.steps) {
    const today = metrics.steps.today;
    const progress = (today / 10000) * 100; // 10k steps = 100%
    rows.push({
      label: 'Steps',
      value: today >= 1000 ? `${(today / 1000).toFixed(1)}k` : `${today}`,
      subtext: 'today',
      progress,
      onClick: () => handleTap('steps'),
    });
  }

  if (rows.length === 0) {
    return null;
  }

  const visibleRows = isExpanded ? rows : rows.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-[#8A8580] uppercase tracking-wider">
          Today&apos;s Metrics
        </h3>
        {rows.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-[#8A8580] flex items-center gap-1 hover:text-[#2D2A26] transition-colors"
          >
            {isExpanded ? (
              <>Less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>More <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>
      <div className="divide-y divide-[#F5EDE4]">
        {visibleRows.map((row, i) => (
          <MetricRow key={i} {...row} />
        ))}
      </div>
      <p className="text-xs text-[#B5AFA8] mt-3 text-center">
        Tap any metric to discuss
      </p>
    </div>
  );
}
