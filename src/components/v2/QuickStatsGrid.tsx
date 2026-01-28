'use client';

import { Moon, Heart, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { HealthMetrics } from '@/types';

interface QuickStatsGridProps {
  metrics: HealthMetrics;
  isLoading?: boolean;
  onMetricTap?: (metric: string) => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  unit: string;
  label: string;
  trend?: { direction: 'up' | 'down' | 'stable'; value: string };
  colorClass: string;
  iconBgClass: string;
  borderColorClass: string;
  onClick?: () => void;
}

function StatCard({
  icon,
  value,
  unit,
  label,
  trend,
  colorClass,
  iconBgClass,
  borderColorClass,
  onClick,
}: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-[20px] p-4 text-center relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      style={{
        boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      {/* Top colored border */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${borderColorClass}`} />

      {/* Icon */}
      <div className={`w-9 h-9 rounded-[10px] mx-auto mb-2 flex items-center justify-center ${iconBgClass}`}>
        {icon}
      </div>

      {/* Value */}
      <div className="flex items-baseline justify-center">
        <span className="text-[22px] font-bold text-[#2D2A26] leading-none">{value}</span>
        <span className="text-[12px] font-medium text-[#8A8580] ml-0.5">{unit}</span>
      </div>

      {/* Label */}
      <div className="text-[11px] text-[#B5AFA8] mt-1">{label}</div>

      {/* Trend Badge */}
      {trend && trend.direction !== 'stable' && (
        <div
          className={`inline-flex items-center gap-0.5 text-[10px] font-semibold mt-2 px-1.5 py-0.5 rounded-md ${
            trend.direction === 'up' ? 'bg-[#E8F5E9] text-[#4CAF50]' : 'bg-[#FFEBEE] text-[#E57373]'
          }`}
        >
          {trend.direction === 'up' ? (
            <ArrowUp className="w-2.5 h-2.5" />
          ) : (
            <ArrowDown className="w-2.5 h-2.5" />
          )}
          {trend.value}
        </div>
      )}
    </button>
  );
}

export default function QuickStatsGrid({ metrics, isLoading = false, onMetricTap }: QuickStatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-[20px] p-4 animate-pulse">
            <div className="w-9 h-9 rounded-[10px] mx-auto mb-2 bg-[#F5EDE4]" />
            <div className="h-6 bg-[#F5EDE4] rounded mx-auto w-12 mb-1" />
            <div className="h-3 bg-[#F5EDE4] rounded mx-auto w-8" />
          </div>
        ))}
      </div>
    );
  }

  const sleepHours = metrics.sleep?.lastNightHours ?? 0;
  const sleepAvg = metrics.sleep?.avgWeekHours ?? sleepHours;
  const sleepDiff = sleepHours - sleepAvg;

  const hrv = metrics.hrv?.current ?? 0;
  const hrvBaseline = metrics.hrv?.baseline ?? hrv;
  const hrvDiff = hrv - hrvBaseline;

  const steps = metrics.steps?.today ?? 0;
  const stepsAvg = metrics.steps?.avgDaily ?? steps;
  const stepsDiff = steps - stepsAvg;

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Sleep */}
      <StatCard
        icon={<Moon className="w-[18px] h-[18px] text-[#5C6BC0]" />}
        value={sleepHours.toFixed(1)}
        unit="h"
        label="Sleep"
        trend={
          Math.abs(sleepDiff) >= 0.3
            ? { direction: sleepDiff > 0 ? 'up' : 'down', value: `${sleepDiff > 0 ? '+' : ''}${sleepDiff.toFixed(1)}h` }
            : undefined
        }
        colorClass="text-[#5C6BC0]"
        iconBgClass="bg-gradient-to-br from-[#E8EAF6] to-[#C5CAE9]"
        borderColorClass="bg-gradient-to-r from-[#5C6BC0] to-[#7986CB]"
        onClick={() => onMetricTap?.('sleep')}
      />

      {/* HRV */}
      <StatCard
        icon={<Heart className="w-[18px] h-[18px] text-[#81B29A]" />}
        value={hrv}
        unit="ms"
        label="HRV"
        trend={
          Math.abs(hrvDiff) >= 3
            ? { direction: hrvDiff > 0 ? 'up' : 'down', value: `${hrvDiff > 0 ? '+' : ''}${hrvDiff}` }
            : undefined
        }
        colorClass="text-[#81B29A]"
        iconBgClass="bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9]"
        borderColorClass="bg-gradient-to-r from-[#81B29A] to-[#A5D6A7]"
        onClick={() => onMetricTap?.('hrv')}
      />

      {/* Steps */}
      <StatCard
        icon={<TrendingUp className="w-[18px] h-[18px] text-[#F2CC8F]" />}
        value={(steps / 1000).toFixed(1)}
        unit="k"
        label="Steps"
        trend={
          Math.abs(stepsDiff) >= 500
            ? {
                direction: stepsDiff > 0 ? 'up' : 'down',
                value: `${stepsDiff > 0 ? '+' : ''}${(stepsDiff / 1000).toFixed(1)}k`,
              }
            : undefined
        }
        colorClass="text-[#F2CC8F]"
        iconBgClass="bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3]"
        borderColorClass="bg-gradient-to-r from-[#F2CC8F] to-[#FFE082]"
        onClick={() => onMetricTap?.('steps')}
      />
    </div>
  );
}
