/**
 * Health history and trend calculations
 * Queries health_daily table for historical data
 */

import { supabase } from './supabase';

export interface HealthScoreTrend {
  current: number;
  previousWeek: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MetricTrend {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MetricTrends {
  rhr?: MetricTrend;
  sleep?: MetricTrend;
  steps?: MetricTrend;
  hrv?: MetricTrend;
  recovery?: MetricTrend;
}

interface HealthDailyRecord {
  date: string;
  sleep_duration_minutes?: number;
  sleep_quality_score?: number;
  resting_heart_rate?: number;
  hrv_average?: number;
  steps?: number;
  recovery_score?: number;
  health_score?: number;
}

/**
 * Get health score trend - compare this week vs last week
 */
export async function getHealthScoreTrend(userId: string): Promise<HealthScoreTrend | null> {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    // Get data for the last 14 days
    const { data, error } = await supabase
      .from('health_daily')
      .select('date, health_score')
      .eq('user_id', userId)
      .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    const records = data as HealthDailyRecord[];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Split into this week and last week
    const thisWeek = records.filter(r => r.date >= sevenDaysAgoStr);
    const lastWeek = records.filter(r => r.date < sevenDaysAgoStr);

    // Calculate averages
    const thisWeekScores = thisWeek.filter(r => r.health_score != null).map(r => r.health_score!);
    const lastWeekScores = lastWeek.filter(r => r.health_score != null).map(r => r.health_score!);

    if (thisWeekScores.length === 0) {
      return null;
    }

    const current = Math.round(thisWeekScores.reduce((a, b) => a + b, 0) / thisWeekScores.length);
    const previousWeek = lastWeekScores.length > 0
      ? Math.round(lastWeekScores.reduce((a, b) => a + b, 0) / lastWeekScores.length)
      : current;

    const change = current - previousWeek;
    const trend: 'up' | 'down' | 'stable' = change > 2 ? 'up' : change < -2 ? 'down' : 'stable';

    return {
      current,
      previousWeek,
      change,
      trend,
    };
  } catch (error) {
    console.error('Error fetching health score trend:', error);
    return null;
  }
}

/**
 * Get metric trends - compare averages from last 7 days vs previous 7 days
 */
export async function getMetricTrends(userId: string): Promise<MetricTrends | null> {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    const { data, error } = await supabase
      .from('health_daily')
      .select('date, sleep_duration_minutes, resting_heart_rate, hrv_average, steps, recovery_score')
      .eq('user_id', userId)
      .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    const records = data as HealthDailyRecord[];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const thisWeek = records.filter(r => r.date >= sevenDaysAgoStr);
    const lastWeek = records.filter(r => r.date < sevenDaysAgoStr);

    const trends: MetricTrends = {};

    // Helper to calculate trend for a metric
    const calculateTrend = (
      thisWeekValues: number[],
      lastWeekValues: number[],
      invertBetter = false // true for metrics where lower is better (like RHR)
    ): MetricTrend | undefined => {
      if (thisWeekValues.length === 0) return undefined;

      const current = Math.round(thisWeekValues.reduce((a, b) => a + b, 0) / thisWeekValues.length);
      const previous = lastWeekValues.length > 0
        ? Math.round(lastWeekValues.reduce((a, b) => a + b, 0) / lastWeekValues.length)
        : current;

      const change = current - previous;
      let trend: 'up' | 'down' | 'stable' = 'stable';

      // Determine trend based on whether metric is inverted
      if (invertBetter) {
        // For RHR: decrease is positive
        trend = change <= -2 ? 'down' : change >= 2 ? 'up' : 'stable';
      } else {
        trend = change >= 2 ? 'up' : change <= -2 ? 'down' : 'stable';
      }

      return { current, previous, change, trend };
    };

    // Sleep (hours) - more is better
    const thisWeekSleep = thisWeek.filter(r => r.sleep_duration_minutes).map(r => r.sleep_duration_minutes! / 60);
    const lastWeekSleep = lastWeek.filter(r => r.sleep_duration_minutes).map(r => r.sleep_duration_minutes! / 60);
    if (thisWeekSleep.length > 0) {
      const sleepTrend = calculateTrend(thisWeekSleep, lastWeekSleep);
      if (sleepTrend) {
        trends.sleep = {
          ...sleepTrend,
          current: Math.round(sleepTrend.current * 10) / 10,
          previous: Math.round(sleepTrend.previous * 10) / 10,
          change: Math.round(sleepTrend.change * 10) / 10,
        };
      }
    }

    // RHR (lower is better)
    const thisWeekRhr = thisWeek.filter(r => r.resting_heart_rate).map(r => r.resting_heart_rate!);
    const lastWeekRhr = lastWeek.filter(r => r.resting_heart_rate).map(r => r.resting_heart_rate!);
    trends.rhr = calculateTrend(thisWeekRhr, lastWeekRhr, true);

    // HRV (higher is better)
    const thisWeekHrv = thisWeek.filter(r => r.hrv_average).map(r => r.hrv_average!);
    const lastWeekHrv = lastWeek.filter(r => r.hrv_average).map(r => r.hrv_average!);
    trends.hrv = calculateTrend(thisWeekHrv, lastWeekHrv);

    // Steps (more is better)
    const thisWeekSteps = thisWeek.filter(r => r.steps).map(r => r.steps!);
    const lastWeekSteps = lastWeek.filter(r => r.steps).map(r => r.steps!);
    if (thisWeekSteps.length > 0) {
      const stepsTrend = calculateTrend(thisWeekSteps, lastWeekSteps);
      if (stepsTrend) {
        trends.steps = stepsTrend;
      }
    }

    // Recovery (higher is better)
    const thisWeekRecovery = thisWeek.filter(r => r.recovery_score).map(r => r.recovery_score!);
    const lastWeekRecovery = lastWeek.filter(r => r.recovery_score).map(r => r.recovery_score!);
    trends.recovery = calculateTrend(thisWeekRecovery, lastWeekRecovery);

    return Object.keys(trends).length > 0 ? trends : null;
  } catch (error) {
    console.error('Error fetching metric trends:', error);
    return null;
  }
}

/**
 * Get the most recent health metrics for today
 */
export async function getTodayMetrics(userId: string): Promise<HealthDailyRecord | null> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('health_daily')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error || !data) {
      return null;
    }

    return data as HealthDailyRecord;
  } catch (error) {
    console.error('Error fetching today metrics:', error);
    return null;
  }
}
