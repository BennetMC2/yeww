/**
 * Baseline Computer
 * Computes and caches rolling averages for health metrics
 */

import { supabase } from './supabase';

// Metric types we compute baselines for
export type BaselineMetricType = 'steps' | 'sleep_hours' | 'hrv' | 'rhr' | 'recovery' | 'weight';

interface MetricBaseline {
  metricType: BaselineMetricType;
  avg7day: number | null;
  avg14day: number | null;
  avg30day: number | null;
  stddev7day: number | null;
  stddev14day: number | null;
  stddev30day: number | null;
  min7day: number | null;
  max7day: number | null;
  sampleCount7day: number;
  sampleCount30day: number;
}

interface HealthDailyRow {
  date: string;
  steps: number | null;
  sleep_duration_minutes: number | null;
  hrv_average: number | null;
  resting_heart_rate: number | null;
  recovery_score: number | null;
  weight_kg: number | null;
}

/**
 * Extract metric value from a health_daily row
 */
function extractMetricValue(row: HealthDailyRow, metricType: BaselineMetricType): number | null {
  switch (metricType) {
    case 'steps':
      return row.steps;
    case 'sleep_hours':
      return row.sleep_duration_minutes ? row.sleep_duration_minutes / 60 : null;
    case 'hrv':
      return row.hrv_average;
    case 'rhr':
      return row.resting_heart_rate;
    case 'recovery':
      return row.recovery_score;
    case 'weight':
      return row.weight_kg;
    default:
      return null;
  }
}

/**
 * Calculate statistics for an array of numbers
 */
function calculateStats(values: number[]): {
  avg: number | null;
  stddev: number | null;
  min: number | null;
  max: number | null;
  count: number;
} {
  if (values.length === 0) {
    return { avg: null, stddev: null, min: null, max: null, count: 0 };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;

  // Calculate standard deviation
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stddev = Math.sqrt(avgSquaredDiff);

  return {
    avg: Math.round(avg * 100) / 100,
    stddev: Math.round(stddev * 100) / 100,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  };
}

/**
 * Compute baseline for a single metric type
 */
function computeMetricBaseline(
  data: HealthDailyRow[],
  metricType: BaselineMetricType
): MetricBaseline {
  const now = new Date();

  // Extract values with their dates
  const valuesWithDates = data
    .map(row => ({
      date: new Date(row.date),
      value: extractMetricValue(row, metricType),
    }))
    .filter(v => v.value !== null) as { date: Date; value: number }[];

  // Sort by date descending
  valuesWithDates.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Filter by time windows
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const values7day = valuesWithDates.filter(v => v.date >= sevenDaysAgo).map(v => v.value);
  const values14day = valuesWithDates.filter(v => v.date >= fourteenDaysAgo).map(v => v.value);
  const values30day = valuesWithDates.filter(v => v.date >= thirtyDaysAgo).map(v => v.value);

  const stats7 = calculateStats(values7day);
  const stats14 = calculateStats(values14day);
  const stats30 = calculateStats(values30day);

  return {
    metricType,
    avg7day: stats7.avg,
    avg14day: stats14.avg,
    avg30day: stats30.avg,
    stddev7day: stats7.stddev,
    stddev14day: stats14.stddev,
    stddev30day: stats30.stddev,
    min7day: stats7.min,
    max7day: stats7.max,
    sampleCount7day: stats7.count,
    sampleCount30day: stats30.count,
  };
}

/**
 * Compute all baselines for a user
 */
export async function computeBaselines(userId: string): Promise<MetricBaseline[]> {
  // Fetch last 30 days of health_daily data
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('health_daily')
    .select('date, steps, sleep_duration_minutes, hrv_average, resting_heart_rate, recovery_score, weight_kg')
    .eq('user_id', userId)
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching health data for baselines:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Compute baselines for each metric type
  const metricTypes: BaselineMetricType[] = ['steps', 'sleep_hours', 'hrv', 'rhr', 'recovery', 'weight'];
  const baselines = metricTypes.map(metricType =>
    computeMetricBaseline(data as HealthDailyRow[], metricType)
  );

  return baselines;
}

/**
 * Save computed baselines to database
 */
export async function saveBaselines(userId: string, baselines: MetricBaseline[]): Promise<boolean> {
  const now = new Date().toISOString();

  // Prepare upsert data
  const records = baselines.map(baseline => ({
    user_id: userId,
    metric_type: baseline.metricType,
    avg_7day: baseline.avg7day,
    avg_14day: baseline.avg14day,
    avg_30day: baseline.avg30day,
    stddev_7day: baseline.stddev7day,
    stddev_14day: baseline.stddev14day,
    stddev_30day: baseline.stddev30day,
    min_7day: baseline.min7day,
    max_7day: baseline.max7day,
    sample_count_7day: baseline.sampleCount7day,
    sample_count_30day: baseline.sampleCount30day,
    computed_at: now,
  }));

  const { error } = await supabase
    .from('metric_baselines')
    .upsert(records, { onConflict: 'user_id,metric_type' });

  if (error) {
    console.error('Error saving baselines:', error);
    return false;
  }

  return true;
}

/**
 * Get cached baselines for a user
 */
export async function getCachedBaselines(userId: string): Promise<Record<BaselineMetricType, MetricBaseline> | null> {
  const { data, error } = await supabase
    .from('metric_baselines')
    .select('*')
    .eq('user_id', userId);

  if (error || !data || data.length === 0) {
    return null;
  }

  const result: Record<string, MetricBaseline> = {};
  for (const row of data) {
    result[row.metric_type as BaselineMetricType] = {
      metricType: row.metric_type as BaselineMetricType,
      avg7day: row.avg_7day,
      avg14day: row.avg_14day,
      avg30day: row.avg_30day,
      stddev7day: row.stddev_7day,
      stddev14day: row.stddev_14day,
      stddev30day: row.stddev_30day,
      min7day: row.min_7day,
      max7day: row.max_7day,
      sampleCount7day: row.sample_count_7day,
      sampleCount30day: row.sample_count_30day,
    };
  }

  return result as Record<BaselineMetricType, MetricBaseline>;
}

/**
 * Check if baselines need recomputation (older than 24 hours)
 */
export async function shouldRecomputeBaselines(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('metric_baselines')
    .select('computed_at')
    .eq('user_id', userId)
    .order('computed_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return true; // No baselines exist, need to compute
  }

  const computedAt = new Date(data[0].computed_at);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return computedAt < oneDayAgo;
}

/**
 * Main function: Compute and save baselines if needed
 */
export async function updateBaselinesIfNeeded(userId: string): Promise<boolean> {
  const needsUpdate = await shouldRecomputeBaselines(userId);

  if (!needsUpdate) {
    console.log(`Baselines for ${userId} are up to date`);
    return false;
  }

  console.log(`Computing baselines for ${userId}`);
  const baselines = await computeBaselines(userId);

  if (baselines.length === 0) {
    console.log(`No data to compute baselines for ${userId}`);
    return false;
  }

  const saved = await saveBaselines(userId, baselines);
  if (saved) {
    console.log(`Baselines updated for ${userId}`);
  }

  return saved;
}
