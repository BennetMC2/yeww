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
  sparkline?: number[]; // Optional 7-day sparkline data
  onClick?: () => void;
}

function MiniSparkline({ data, highlight }: { data: number[]; highlight?: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5 h-4">
      {data.map((val, i) => {
        const height = ((val - min) / range) * 100;
        const isLast = i === data.length - 1;
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all ${isLast && highlight ? 'bg-[#E07A5F]' : 'bg-[#E07A5F]/30'}`}
            style={{ height: `${Math.max(height, 15)}%` }}
          />
        );
      })}
    </div>
  );
}

function MetricRow({ label, value, subtext, progress, trend, trendGood, sparkline, onClick }: MetricRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 hover:bg-[#FAF6F1] rounded-xl px-2 -mx-2 transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
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
        {sparkline ? (
          <MiniSparkline data={sparkline} highlight />
        ) : (
          <div className="w-16 h-2 bg-[#F5EDE4] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E07A5F] rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
        <span className="text-sm font-semibold text-[#2D2A26] w-12 text-right">{value}</span>
      </div>
    </button>
  );
}

export default function ExpandableStats({ metrics, isLoading, onMetricTap }: ExpandableStatsProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Default expanded for demo

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
    const avgHours = metrics.sleep.avgWeekHours;
    const progress = (hours / 9) * 100; // 9 hours = 100%
    // Mock 7-day sleep data showing improvement
    const sleepSparkline = [6.5, 7.0, 6.2, 7.4, 6.8, 7.2, hours];
    rows.push({
      label: 'Sleep',
      value: `${hours.toFixed(1)}h`,
      subtext: `avg ${avgHours.toFixed(1)}h/night`,
      progress,
      trend: hours > avgHours ? 'up' : hours < avgHours ? 'down' : 'stable',
      trendGood: hours >= avgHours,
      sparkline: sleepSparkline,
      onClick: () => handleTap('sleep'),
    });
  }

  if (metrics.recovery) {
    const score = metrics.recovery.score;
    // Mock 7-day recovery data
    const recoverySparkline = [65, 72, 58, 75, 80, 78, score];
    rows.push({
      label: metrics.recovery.label || 'Recovery',
      value: `${score}`,
      subtext: metrics.recovery.status,
      progress: score,
      sparkline: recoverySparkline,
      onClick: () => handleTap('recovery'),
    });
  }

  if (metrics.hrv) {
    const current = metrics.hrv.current;
    const baseline = metrics.hrv.baseline;
    const progress = (current / 100) * 100;
    // Mock 7-day HRV data showing upward trend
    const hrvSparkline = [48, 52, 46, 54, 51, 55, current];
    rows.push({
      label: 'HRV',
      value: `${current} ms`,
      subtext: `baseline ${baseline} ms`,
      progress,
      trend: metrics.hrv.trend,
      trendGood: metrics.hrv.trend === 'up',
      sparkline: hrvSparkline,
      onClick: () => handleTap('hrv'),
    });
  }

  if (metrics.rhr) {
    const current = metrics.rhr.current;
    const baseline = metrics.rhr.baseline;
    const progress = Math.max(0, 100 - ((current - 40) / 40) * 100);
    // Mock 7-day RHR data showing downward trend (good)
    const rhrSparkline = [58, 57, 59, 56, 55, 55, current];
    rows.push({
      label: 'Resting HR',
      value: `${current} bpm`,
      subtext: `baseline ${baseline} bpm`,
      progress,
      trend: metrics.rhr.trend,
      trendGood: metrics.rhr.trend === 'down',
      sparkline: rhrSparkline,
      onClick: () => handleTap('rhr'),
    });
  }

  if (metrics.steps) {
    const today = metrics.steps.today;
    const progress = (today / 10000) * 100;
    // Mock 7-day steps data
    const stepsSparkline = [6200, 8100, 5400, 7800, 9200, 7600, today];
    rows.push({
      label: 'Steps',
      value: today >= 1000 ? `${(today / 1000).toFixed(1)}k` : `${today}`,
      subtext: `goal 10k`,
      progress,
      sparkline: stepsSparkline,
      onClick: () => handleTap('steps'),
    });
  }

  if (metrics.stress) {
    const level = metrics.stress.level;
    // Mock 7-day stress data showing low trend
    const stressSparkline = [42, 35, 48, 32, 38, 30, level];
    rows.push({
      label: 'Stress',
      value: `${level}`,
      subtext: metrics.stress.category,
      progress: 100 - level, // Inverted - lower stress = higher progress
      sparkline: stressSparkline,
      onClick: () => handleTap('stress'),
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
