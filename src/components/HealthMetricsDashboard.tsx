'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Moon, Heart, Footprints, Activity, Zap, AlertCircle } from 'lucide-react';
import { HealthMetrics } from '@/types';

interface HealthMetricsDashboardProps {
  userId: string;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  color: string;
}

function MetricCard({ icon, label, value, unit, subtext, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-xs text-[#8A8580] uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-[#2D2A26]">{value}</span>
        {unit && <span className="text-sm text-[#8A8580]">{unit}</span>}
      </div>
      {subtext && (
        <span className="text-xs text-[#8A8580] mt-1">{subtext}</span>
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

  const getSleepQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-green-400';
      case 'fair': return 'text-yellow-500';
      default: return 'text-red-400';
    }
  };

  const getRecoveryColor = (status: string) => {
    switch (status) {
      case 'high': return 'text-green-500';
      case 'moderate': return 'text-yellow-500';
      default: return 'text-red-400';
    }
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
        {/* Sleep */}
        {metrics?.sleep && (
          <MetricCard
            icon={<Moon className="w-4 h-4 text-indigo-500" />}
            label="Sleep"
            value={metrics.sleep.lastNightHours}
            unit="hrs"
            subtext={<span className={getSleepQualityColor(metrics.sleep.quality)}>{metrics.sleep.quality}</span> as unknown as string}
            color="bg-indigo-50"
          />
        )}

        {/* HRV */}
        {metrics?.hrv && (
          <MetricCard
            icon={<Activity className="w-4 h-4 text-purple-500" />}
            label="HRV"
            value={metrics.hrv.current}
            unit="ms"
            subtext={`Baseline: ${metrics.hrv.baseline}ms`}
            color="bg-purple-50"
          />
        )}

        {/* Resting Heart Rate */}
        {metrics?.rhr && (
          <MetricCard
            icon={<Heart className="w-4 h-4 text-red-500" />}
            label="Resting HR"
            value={metrics.rhr.current}
            unit="bpm"
            subtext={metrics.rhr.trend === 'up' ? '↑ trending up' : metrics.rhr.trend === 'down' ? '↓ trending down' : '→ stable'}
            color="bg-red-50"
          />
        )}

        {/* Steps */}
        {metrics?.steps && (
          <MetricCard
            icon={<Footprints className="w-4 h-4 text-green-500" />}
            label="Steps"
            value={metrics.steps.today.toLocaleString()}
            subtext={`Avg: ${metrics.steps.avgDaily.toLocaleString()}`}
            color="bg-green-50"
          />
        )}

        {/* Recovery */}
        {metrics?.recovery && (
          <MetricCard
            icon={<Zap className="w-4 h-4 text-amber-500" />}
            label="Recovery"
            value={metrics.recovery.score}
            unit="%"
            subtext={<span className={getRecoveryColor(metrics.recovery.status)}>{metrics.recovery.status}</span> as unknown as string}
            color="bg-amber-50"
          />
        )}

        {/* Strain */}
        {metrics?.strain && (
          <MetricCard
            icon={<Activity className="w-4 h-4 text-orange-500" />}
            label="Strain"
            value={metrics.strain.yesterday}
            subtext={`Weekly avg: ${metrics.strain.weeklyAvg}`}
            color="bg-orange-50"
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
