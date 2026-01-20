'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Moon, Heart, Footprints, Activity, Zap, AlertCircle, TrendingUp, TrendingDown, Minus, Brain, Battery } from 'lucide-react';
import { HealthMetrics } from '@/types';

interface HealthMetricsDashboardProps {
  userId: string;
}

type TrendDirection = 'up' | 'down' | 'stable';
type TrendSentiment = 'positive' | 'negative' | 'neutral';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  trend?: TrendDirection;
  trendSentiment?: TrendSentiment;
  delta?: number;
  deltaUnit?: string;
  comparison?: string;
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  color,
  trend,
  trendSentiment = 'neutral',
  delta,
  deltaUnit = '',
  comparison,
}: MetricCardProps) {
  const getTrendColor = () => {
    if (trendSentiment === 'positive') return 'text-green-500';
    if (trendSentiment === 'negative') return 'text-red-500';
    return 'text-[#8A8580]';
  };

  const getDeltaBgColor = () => {
    if (trendSentiment === 'positive') return 'bg-green-50 text-green-600';
    if (trendSentiment === 'negative') return 'bg-red-50 text-red-600';
    return 'bg-[#F5EDE4] text-[#8A8580]';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
          <span className="text-xs text-[#8A8580] uppercase tracking-wide">{label}</span>
        </div>
        {trend && (
          <TrendIcon className={`w-4 h-4 ${getTrendColor()}`} />
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-[#2D2A26]">{value}</span>
        {unit && <span className="text-sm text-[#8A8580]">{unit}</span>}
        {delta !== undefined && delta !== 0 && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getDeltaBgColor()}`}>
            {delta > 0 ? '+' : ''}{delta}{deltaUnit}
          </span>
        )}
      </div>
      {comparison && (
        <span className="text-xs text-[#8A8580] mt-1">{comparison}</span>
      )}
    </div>
  );
}

export default function HealthMetricsDashboard({ userId }: HealthMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/health/metrics?userId=${encodeURIComponent(userId)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data.metrics);
      setLastSync(data.lastSync);
      setHasData(data.hasData);
    } catch (err) {
      console.error('Error fetching health metrics:', err);
      setError('Could not load health data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-[#F5EDE4] rounded-2xl p-6">
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="w-5 h-5 text-[#B5AFA8] animate-spin" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-[#F5EDE4] rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="w-5 h-5 text-[#B5AFA8]" />
          <span className="font-medium text-[#2D2A26]">No health data yet</span>
        </div>
        <p className="text-sm text-[#8A8580]">
          Connect a wearable in your Profile to see your health metrics here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with last sync and refresh */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-[#8A8580]">
          Last updated: {formatLastSync(lastSync)}
        </span>
        <button
          onClick={() => fetchMetrics(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs text-[#E07A5F] hover:text-[#D36B4F] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Sleep - more is better */}
        {metrics?.sleep && (() => {
          const delta = Math.round((metrics.sleep.lastNightHours - metrics.sleep.avgWeekHours) * 10) / 10;
          const trend: TrendDirection = delta > 0.3 ? 'up' : delta < -0.3 ? 'down' : 'stable';
          const sentiment: TrendSentiment = delta > 0.3 ? 'positive' : delta < -0.3 ? 'negative' : 'neutral';
          return (
            <MetricCard
              icon={<Moon className="w-4 h-4 text-indigo-500" />}
              label="Sleep"
              value={metrics.sleep.lastNightHours}
              unit="hrs"
              color="bg-indigo-50"
              trend={trend}
              trendSentiment={sentiment}
              delta={delta}
              deltaUnit="h"
              comparison={`vs ${metrics.sleep.avgWeekHours}h avg`}
            />
          );
        })()}

        {/* HRV - higher is better */}
        {metrics?.hrv && (() => {
          const delta = metrics.hrv.current - metrics.hrv.baseline;
          // For HRV: up is good, down is bad
          const sentiment: TrendSentiment =
            metrics.hrv.trend === 'up' ? 'positive' :
            metrics.hrv.trend === 'down' ? 'negative' : 'neutral';
          return (
            <MetricCard
              icon={<Activity className="w-4 h-4 text-purple-500" />}
              label="HRV"
              value={metrics.hrv.current}
              unit="ms"
              color="bg-purple-50"
              trend={metrics.hrv.trend}
              trendSentiment={sentiment}
              delta={delta}
              deltaUnit="ms"
              comparison={`baseline ${metrics.hrv.baseline}ms`}
            />
          );
        })()}

        {/* Resting Heart Rate - lower is better */}
        {metrics?.rhr && (() => {
          const delta = metrics.rhr.current - metrics.rhr.baseline;
          // For RHR: down is good, up is bad (inverted)
          const sentiment: TrendSentiment =
            metrics.rhr.trend === 'down' ? 'positive' :
            metrics.rhr.trend === 'up' ? 'negative' : 'neutral';
          return (
            <MetricCard
              icon={<Heart className="w-4 h-4 text-red-500" />}
              label="Resting HR"
              value={metrics.rhr.current}
              unit="bpm"
              color="bg-red-50"
              trend={metrics.rhr.trend}
              trendSentiment={sentiment}
              delta={delta}
              deltaUnit=""
              comparison={`baseline ${metrics.rhr.baseline}`}
            />
          );
        })()}

        {/* Steps - more is better */}
        {metrics?.steps && (() => {
          const delta = metrics.steps.today - metrics.steps.avgDaily;
          const deltaPercent = Math.round((delta / metrics.steps.avgDaily) * 100);
          const trend: TrendDirection = deltaPercent > 10 ? 'up' : deltaPercent < -10 ? 'down' : 'stable';
          const sentiment: TrendSentiment = deltaPercent > 10 ? 'positive' : deltaPercent < -10 ? 'negative' : 'neutral';
          return (
            <MetricCard
              icon={<Footprints className="w-4 h-4 text-green-500" />}
              label="Steps"
              value={metrics.steps.today.toLocaleString()}
              color="bg-green-50"
              trend={trend}
              trendSentiment={sentiment}
              delta={deltaPercent}
              deltaUnit="%"
              comparison={`avg ${metrics.steps.avgDaily.toLocaleString()}`}
            />
          );
        })()}

        {/* Recovery/Body Battery - higher is better */}
        {metrics?.recovery && (() => {
          const sentiment: TrendSentiment =
            metrics.recovery.status === 'high' ? 'positive' :
            metrics.recovery.status === 'low' ? 'negative' : 'neutral';
          const trend: TrendDirection =
            metrics.recovery.status === 'high' ? 'up' :
            metrics.recovery.status === 'low' ? 'down' : 'stable';
          // Use Battery icon for Garmin Body Battery, Zap for others
          const isBodyBattery = metrics.recovery.label === 'Body Battery';
          return (
            <MetricCard
              icon={isBodyBattery
                ? <Battery className="w-4 h-4 text-amber-500" />
                : <Zap className="w-4 h-4 text-amber-500" />
              }
              label={metrics.recovery.label || 'Recovery'}
              value={metrics.recovery.score}
              unit={isBodyBattery ? '' : '%'}
              color="bg-amber-50"
              trend={trend}
              trendSentiment={sentiment}
              comparison={metrics.recovery.status}
            />
          );
        })()}

        {/* Stress - Garmin specific (lower is better) */}
        {metrics?.stress && (() => {
          // For stress: lower is better (calmer)
          const sentiment: TrendSentiment =
            metrics.stress.category === 'rest' ? 'positive' :
            metrics.stress.category === 'high' ? 'negative' : 'neutral';
          const trend: TrendDirection =
            metrics.stress.category === 'rest' || metrics.stress.category === 'low' ? 'down' :
            metrics.stress.category === 'high' ? 'up' : 'stable';
          return (
            <MetricCard
              icon={<Brain className="w-4 h-4 text-blue-500" />}
              label="Stress"
              value={metrics.stress.level}
              color="bg-blue-50"
              trend={trend}
              trendSentiment={sentiment}
              comparison={metrics.stress.category}
            />
          );
        })()}

        {/* Strain - Whoop specific */}
        {metrics?.strain && (() => {
          const delta = Math.round((metrics.strain.score - metrics.strain.weeklyAvg) * 10) / 10;
          const trend: TrendDirection = delta > 1 ? 'up' : delta < -1 ? 'down' : 'stable';
          return (
            <MetricCard
              icon={<Activity className="w-4 h-4 text-orange-500" />}
              label="Strain"
              value={metrics.strain.score}
              color="bg-orange-50"
              trend={trend}
              trendSentiment="neutral"
              delta={delta}
              comparison={`avg ${metrics.strain.weeklyAvg}`}
            />
          );
        })()}

        {/* Fitness Age - if available */}
        {metrics?.fitnessAge && (
          <MetricCard
            icon={<Activity className="w-4 h-4 text-teal-500" />}
            label="Fitness Age"
            value={metrics.fitnessAge}
            unit="yrs"
            color="bg-teal-50"
          />
        )}
      </div>

      {/* No specific metrics message */}
      {metrics && !metrics.sleep && !metrics.hrv && !metrics.rhr && !metrics.steps && (
        <div className="bg-[#F5EDE4] rounded-2xl p-4 text-center">
          <p className="text-sm text-[#8A8580]">
            Waiting for data from your wearable...
          </p>
        </div>
      )}
    </div>
  );
}
