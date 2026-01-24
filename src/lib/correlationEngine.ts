/**
 * Correlation Engine
 * Detects patterns and correlations in health data
 */

import { supabase } from './supabase';

// Metric types we can correlate
export type CorrelationMetric = 'steps' | 'sleep_hours' | 'hrv' | 'rhr' | 'recovery' | 'weight';

// Pattern structure
export interface DetectedPattern {
  id?: string;
  userId: string;
  patternType: 'correlation' | 'trend' | 'anomaly';
  metricA: CorrelationMetric;
  metricB?: CorrelationMetric;
  description: string;
  correlationStrength: number | null;
  confidence: number;
  timeLagDays: number;
  direction: 'positive' | 'negative' | null;
  isActive: boolean;
  lastObserved: string;
  sampleSize: number;
}

// Predefined metric pairs to check
const METRIC_PAIRS: Array<{
  metricA: CorrelationMetric;
  metricB: CorrelationMetric;
  timeLag: number;
  descriptionTemplate: string;
}> = [
  {
    metricA: 'steps',
    metricB: 'sleep_hours',
    timeLag: 0,
    descriptionTemplate: 'Steps {direction} correlates with sleep duration same day',
  },
  {
    metricA: 'steps',
    metricB: 'recovery',
    timeLag: 1,
    descriptionTemplate: 'Steps today {direction} correlates with next-day recovery',
  },
  {
    metricA: 'sleep_hours',
    metricB: 'hrv',
    timeLag: 0,
    descriptionTemplate: 'Sleep duration {direction} correlates with HRV same day',
  },
  {
    metricA: 'sleep_hours',
    metricB: 'recovery',
    timeLag: 0,
    descriptionTemplate: 'Sleep duration {direction} correlates with recovery same day',
  },
  {
    metricA: 'hrv',
    metricB: 'recovery',
    timeLag: 0,
    descriptionTemplate: 'HRV {direction} correlates with recovery same day',
  },
  {
    metricA: 'rhr',
    metricB: 'sleep_hours',
    timeLag: 0,
    descriptionTemplate: 'Resting heart rate {direction} correlates with sleep same day',
  },
  {
    metricA: 'weight',
    metricB: 'steps',
    timeLag: 0,
    descriptionTemplate: 'Weight {direction} correlates with step count same day',
  },
];

// Minimum correlation strength to be considered significant
const MIN_CORRELATION = 0.4;
const MIN_SAMPLE_SIZE = 7;

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
function extractMetricValue(row: HealthDailyRow, metric: CorrelationMetric): number | null {
  switch (metric) {
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
 * Calculate Pearson correlation coefficient
 */
function pearsonCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < MIN_SAMPLE_SIZE) {
    return null;
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

/**
 * Calculate confidence based on sample size and correlation strength
 */
function calculateConfidence(sampleSize: number, correlation: number): number {
  // Base confidence from sample size (more data = more confident)
  const sizeConfidence = Math.min(sampleSize / 30, 1); // Max out at 30 days

  // Strong correlations are more reliable
  const strengthConfidence = Math.abs(correlation);

  // Combine factors
  const confidence = (sizeConfidence * 0.6 + strengthConfidence * 0.4);

  return Math.round(confidence * 1000) / 1000;
}

/**
 * Generate human-readable description for a correlation
 */
function generateDescription(
  metricA: CorrelationMetric,
  metricB: CorrelationMetric,
  correlation: number,
  timeLag: number
): string {
  const direction = correlation > 0 ? 'positively' : 'negatively';
  const strength = Math.abs(correlation) >= 0.7 ? 'strongly' :
                   Math.abs(correlation) >= 0.5 ? 'moderately' : 'weakly';

  const metricNames: Record<CorrelationMetric, string> = {
    steps: 'steps',
    sleep_hours: 'sleep duration',
    hrv: 'HRV',
    rhr: 'resting heart rate',
    recovery: 'recovery score',
    weight: 'weight',
  };

  const aName = metricNames[metricA];
  const bName = metricNames[metricB];

  if (timeLag === 0) {
    return `Your ${aName} ${strength} ${direction} correlates with ${bName} on the same day`;
  } else if (timeLag === 1) {
    return `Your ${aName} ${strength} ${direction} affects next-day ${bName}`;
  } else {
    return `Your ${aName} ${strength} ${direction} correlates with ${bName} ${timeLag} days later`;
  }
}

/**
 * Detect correlations for a single metric pair
 */
function detectCorrelation(
  data: HealthDailyRow[],
  metricA: CorrelationMetric,
  metricB: CorrelationMetric,
  timeLag: number
): {
  correlation: number | null;
  sampleSize: number;
} {
  // Sort by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Build paired values
  const xValues: number[] = [];
  const yValues: number[] = [];

  for (let i = 0; i < sortedData.length - timeLag; i++) {
    const xVal = extractMetricValue(sortedData[i], metricA);
    const yVal = extractMetricValue(sortedData[i + timeLag], metricB);

    if (xVal !== null && yVal !== null) {
      xValues.push(xVal);
      yValues.push(yVal);
    }
  }

  const correlation = pearsonCorrelation(xValues, yValues);

  return {
    correlation,
    sampleSize: xValues.length,
  };
}

/**
 * Detect all patterns for a user
 */
export async function detectPatterns(userId: string): Promise<DetectedPattern[]> {
  // Fetch last 30 days of health_daily data
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('health_daily')
    .select('date, steps, sleep_duration_minutes, hrv_average, resting_heart_rate, recovery_score, weight_kg')
    .eq('user_id', userId)
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching health data for patterns:', error);
    return [];
  }

  if (!data || data.length < MIN_SAMPLE_SIZE) {
    console.log(`Insufficient data for pattern detection: ${data?.length || 0} rows`);
    return [];
  }

  const patterns: DetectedPattern[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Check each metric pair
  for (const pair of METRIC_PAIRS) {
    const result = detectCorrelation(
      data as HealthDailyRow[],
      pair.metricA,
      pair.metricB,
      pair.timeLag
    );

    // Only keep significant correlations
    if (result.correlation !== null && Math.abs(result.correlation) >= MIN_CORRELATION) {
      const confidence = calculateConfidence(result.sampleSize, result.correlation);
      const description = generateDescription(
        pair.metricA,
        pair.metricB,
        result.correlation,
        pair.timeLag
      );

      patterns.push({
        userId,
        patternType: 'correlation',
        metricA: pair.metricA,
        metricB: pair.metricB,
        description,
        correlationStrength: Math.round(result.correlation * 1000) / 1000,
        confidence,
        timeLagDays: pair.timeLag,
        direction: result.correlation > 0 ? 'positive' : 'negative',
        isActive: true,
        lastObserved: today,
        sampleSize: result.sampleSize,
      });
    }
  }

  return patterns;
}

/**
 * Save detected patterns to database
 */
export async function savePatterns(patterns: DetectedPattern[]): Promise<boolean> {
  if (patterns.length === 0) return true;

  const records = patterns.map(p => ({
    user_id: p.userId,
    pattern_type: p.patternType,
    metric_a: p.metricA,
    metric_b: p.metricB,
    description: p.description,
    correlation_strength: p.correlationStrength,
    confidence: p.confidence,
    time_lag_days: p.timeLagDays,
    direction: p.direction,
    is_active: p.isActive,
    last_observed: p.lastObserved,
    sample_size: p.sampleSize,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('detected_patterns')
    .upsert(records, {
      onConflict: 'user_id,pattern_type,metric_a,metric_b,time_lag_days',
    });

  if (error) {
    console.error('Error saving patterns:', error);
    return false;
  }

  return true;
}

/**
 * Get active patterns for a user
 */
export async function getActivePatterns(userId: string): Promise<DetectedPattern[]> {
  const { data, error } = await supabase
    .from('detected_patterns')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('confidence', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    patternType: row.pattern_type as 'correlation' | 'trend' | 'anomaly',
    metricA: row.metric_a as CorrelationMetric,
    metricB: row.metric_b as CorrelationMetric | undefined,
    description: row.description,
    correlationStrength: row.correlation_strength,
    confidence: row.confidence,
    timeLagDays: row.time_lag_days,
    direction: row.direction as 'positive' | 'negative' | null,
    isActive: row.is_active,
    lastObserved: row.last_observed,
    sampleSize: row.sample_size,
  }));
}

/**
 * Check if patterns need recomputation (older than 24 hours)
 */
export async function shouldRecomputePatterns(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('detected_patterns')
    .select('updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return true;
  }

  const updatedAt = new Date(data[0].updated_at);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return updatedAt < oneDayAgo;
}

/**
 * Main function: Detect and save patterns if needed
 */
export async function detectPatternsIfNeeded(userId: string): Promise<DetectedPattern[] | null> {
  const needsUpdate = await shouldRecomputePatterns(userId);

  if (!needsUpdate) {
    console.log(`Patterns for ${userId} are up to date`);
    return null;
  }

  console.log(`Detecting patterns for ${userId}`);
  const patterns = await detectPatterns(userId);

  if (patterns.length === 0) {
    console.log(`No significant patterns found for ${userId}`);
    return [];
  }

  const saved = await savePatterns(patterns);
  if (saved) {
    console.log(`Saved ${patterns.length} patterns for ${userId}`);
  }

  return patterns;
}
