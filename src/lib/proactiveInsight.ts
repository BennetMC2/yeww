/**
 * Proactive Insight Generation
 * Analyzes new health data and generates AI comments when notable changes occur
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';
import { HealthMetrics, ProactiveInsight, ProactiveInsightType, ProactiveInsightPriority, InsightMetricType } from '@/types';

const anthropic = new Anthropic();

// Daily limit for proactive insights per user (max 3 unique metrics)
const MAX_DAILY_INSIGHTS = 3;

// Threshold for "notable" changes (percentage)
const NOTABLE_CHANGE_THRESHOLD = 0.15; // 15%

// Date boundaries extracted from Terra data
interface DateBoundaries {
  metricDate: string;        // ISO date (YYYY-MM-DD) for the metric
  yesterdayDate: string;     // ISO date for yesterday relative to metric date
  baselineStartDate: string; // 7 days before metric date
}

// Dual comparison structure for generating insights
interface DualComparison {
  metricType: InsightMetricType;
  todayValue: number;
  yesterdayValue: number | null;
  baseline7day: number | null;
  percentChangeYesterday: number | null;
  percentChangeBaseline: number | null;
  directionYesterday: 'up' | 'down' | 'same' | null;
  directionBaseline: 'above' | 'below' | 'at' | null;
}

/**
 * Get user's name from profiles table
 */
async function getUserName(userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .single();

  return data?.name || 'there';
}

/**
 * Count today's unique metric types for rate limiting
 * Only counts new-style insights with metric_type populated
 */
async function getTodayUniqueMetricCount(userId: string, metricDate: string): Promise<number> {
  const { data } = await supabase
    .from('proactive_insights')
    .select('metric_type')
    .eq('user_id', userId)
    .eq('metric_date', metricDate)
    .not('metric_type', 'is', null);

  if (!data) return 0;

  // Count unique metric types
  const uniqueMetrics = new Set(data.map(d => d.metric_type));
  return uniqueMetrics.size;
}

/**
 * Extract date boundaries from Terra data metadata
 * Terra data includes metadata with start/end timestamps
 */
function getDateBoundaries(terraData: unknown, dataType: string): DateBoundaries {
  const data = terraData as {
    metadata?: {
      start_time?: string;
      end_time?: string;
    };
    sleep_durations_data?: {
      awake?: { start_time?: string };
    };
  };

  let metricDate: string;

  // Try to extract date from metadata
  if (data?.metadata?.start_time) {
    metricDate = data.metadata.start_time.split('T')[0];
  } else if (dataType === 'sleep' && data?.sleep_durations_data?.awake?.start_time) {
    // For sleep, use the wake time's date
    metricDate = data.sleep_durations_data.awake.start_time.split('T')[0];
  } else {
    // Fallback to today
    metricDate = new Date().toISOString().split('T')[0];
  }

  // Calculate yesterday and baseline start dates
  const metricDateObj = new Date(metricDate);
  const yesterdayObj = new Date(metricDateObj);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const baselineStartObj = new Date(metricDateObj);
  baselineStartObj.setDate(baselineStartObj.getDate() - 7);

  return {
    metricDate,
    yesterdayDate: yesterdayObj.toISOString().split('T')[0],
    baselineStartDate: baselineStartObj.toISOString().split('T')[0],
  };
}

/**
 * Get yesterday's specific metric values (not an average)
 */
async function getYesterdayMetrics(
  userId: string,
  dataType: string,
  boundaries: DateBoundaries
): Promise<HealthMetrics | null> {
  // Query for data from yesterday specifically
  const yesterdayStart = `${boundaries.yesterdayDate}T00:00:00.000Z`;
  const yesterdayEnd = `${boundaries.yesterdayDate}T23:59:59.999Z`;

  const { data } = await supabase
    .from('terra_data_payloads')
    .select('data')
    .eq('reference_id', userId)
    .eq('type', dataType)
    .gte('created_at', yesterdayStart)
    .lte('created_at', yesterdayEnd)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return null;

  // Use extractCurrentMetrics to get yesterday's values
  return extractCurrentMetrics(data[0].data, dataType);
}

/**
 * Get 7-day baseline average (excludes today and yesterday for clean comparison)
 */
async function get7DayBaseline(
  userId: string,
  dataType: string,
  boundaries: DateBoundaries
): Promise<HealthMetrics | null> {
  // Get data from 7 days before metric date up to (but not including) yesterday
  const baselineStart = `${boundaries.baselineStartDate}T00:00:00.000Z`;
  const baselineEnd = `${boundaries.yesterdayDate}T00:00:00.000Z`; // Exclude yesterday

  const { data } = await supabase
    .from('terra_data_payloads')
    .select('data')
    .eq('reference_id', userId)
    .eq('type', dataType)
    .gte('created_at', baselineStart)
    .lt('created_at', baselineEnd)
    .order('created_at', { ascending: false })
    .limit(7);

  if (!data || data.length === 0) return null;

  // Aggregate into average metrics
  return aggregateMetrics(data.map(d => d.data), dataType);
}

/**
 * Build dual comparison structure for a specific metric
 */
function buildDualComparison(
  metricType: InsightMetricType,
  todayValue: number,
  yesterdayValue: number | null,
  baseline7day: number | null
): DualComparison {
  // Calculate percent change vs yesterday
  let percentChangeYesterday: number | null = null;
  let directionYesterday: 'up' | 'down' | 'same' | null = null;

  if (yesterdayValue !== null && yesterdayValue !== 0) {
    percentChangeYesterday = Math.round(((todayValue - yesterdayValue) / yesterdayValue) * 100);
    if (percentChangeYesterday > 2) {
      directionYesterday = 'up';
    } else if (percentChangeYesterday < -2) {
      directionYesterday = 'down';
    } else {
      directionYesterday = 'same';
    }
  }

  // Calculate comparison vs baseline
  let percentChangeBaseline: number | null = null;
  let directionBaseline: 'above' | 'below' | 'at' | null = null;

  if (baseline7day !== null && baseline7day !== 0) {
    percentChangeBaseline = Math.round(((todayValue - baseline7day) / baseline7day) * 100);
    if (percentChangeBaseline > 5) {
      directionBaseline = 'above';
    } else if (percentChangeBaseline < -5) {
      directionBaseline = 'below';
    } else {
      directionBaseline = 'at';
    }
  }

  return {
    metricType,
    todayValue,
    yesterdayValue,
    baseline7day,
    percentChangeYesterday,
    percentChangeBaseline,
    directionYesterday,
    directionBaseline,
  };
}

/**
 * Find existing insight for deduplication
 */
async function findExistingInsight(
  userId: string,
  metricType: InsightMetricType,
  metricDate: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from('proactive_insights')
    .select('id')
    .eq('user_id', userId)
    .eq('metric_type', metricType)
    .eq('metric_date', metricDate)
    .single();

  return data;
}

/**
 * Upsert insight: update if exists, insert if new and under limit
 */
async function upsertInsight(
  userId: string,
  message: string,
  type: ProactiveInsightType,
  priority: ProactiveInsightPriority,
  dualComparison: DualComparison,
  metricDate: string,
  context: Record<string, unknown>
): Promise<ProactiveInsight | null> {
  const existingInsight = await findExistingInsight(userId, dualComparison.metricType, metricDate);

  if (existingInsight) {
    // Update existing insight
    const { data, error } = await supabase
      .from('proactive_insights')
      .update({
        message,
        type,
        priority,
        data_context: context,
        today_value: dualComparison.todayValue,
        yesterday_value: dualComparison.yesterdayValue,
        baseline_7day: dualComparison.baseline7day,
        updated_at: new Date().toISOString(),
        read: false, // Mark as unread since it's updated
      })
      .eq('id', existingInsight.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating insight:', error);
      return null;
    }

    return mapDbRowToInsight(data);
  }

  // Check rate limit before inserting new insight
  const uniqueMetricCount = await getTodayUniqueMetricCount(userId, metricDate);
  if (uniqueMetricCount >= MAX_DAILY_INSIGHTS) {
    console.log(`Rate limit reached: ${uniqueMetricCount} unique metrics for ${metricDate}`);
    return null;
  }

  // Insert new insight
  const { data, error } = await supabase
    .from('proactive_insights')
    .insert({
      user_id: userId,
      message,
      type,
      priority,
      data_context: context,
      metric_type: dualComparison.metricType,
      metric_date: metricDate,
      today_value: dualComparison.todayValue,
      yesterday_value: dualComparison.yesterdayValue,
      baseline_7day: dualComparison.baseline7day,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting insight:', error);
    return null;
  }

  return mapDbRowToInsight(data);
}

/**
 * Map database row to ProactiveInsight type
 */
function mapDbRowToInsight(row: Record<string, unknown>): ProactiveInsight {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    message: row.message as string,
    type: row.type as ProactiveInsightType,
    priority: row.priority as ProactiveInsightPriority,
    dataContext: row.data_context as Record<string, unknown>,
    createdAt: row.created_at as string,
    read: row.read as boolean,
    metricType: row.metric_type as InsightMetricType | undefined,
    metricDate: row.metric_date as string | undefined,
    todayValue: row.today_value as number | undefined,
    yesterdayValue: row.yesterday_value as number | undefined,
    baseline7day: row.baseline_7day as number | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

/**
 * Aggregate raw data into comparable metrics
 */
function aggregateMetrics(dataItems: unknown[], dataType: string): HealthMetrics {
  const metrics: HealthMetrics = {};

  if (dataType === 'sleep' && dataItems.length > 0) {
    // Average sleep metrics
    let totalSleep = 0;
    let count = 0;

    for (const item of dataItems) {
      const data = item as {
        sleep_durations_data?: {
          asleep?: { duration_asleep_state_seconds?: number };
          sleep_efficiency?: number;
        };
      };

      const sleepSeconds = data?.sleep_durations_data?.asleep?.duration_asleep_state_seconds;
      if (sleepSeconds) {
        totalSleep += sleepSeconds / 3600;
        count++;
      }
    }

    if (count > 0) {
      metrics.sleep = {
        lastNightHours: Math.round((totalSleep / count) * 10) / 10,
        quality: 'good', // Placeholder
        avgWeekHours: Math.round((totalSleep / count) * 10) / 10,
      };
    }
  }

  if (dataType === 'daily' && dataItems.length > 0) {
    // Average daily metrics
    let totalRhr = 0, totalHrv = 0, totalSteps = 0, totalRecovery = 0;
    let rhrCount = 0, hrvCount = 0, stepsCount = 0, recoveryCount = 0;

    for (const item of dataItems) {
      const data = item as {
        heart_rate_data?: { summary?: { resting_hr_bpm?: number; avg_hrv_rmssd?: number } };
        distance_data?: { steps?: number };
        stress_data?: { body_battery_samples?: { level?: number }[] };
      };

      if (data?.heart_rate_data?.summary?.resting_hr_bpm) {
        totalRhr += data.heart_rate_data.summary.resting_hr_bpm;
        rhrCount++;
      }
      if (data?.heart_rate_data?.summary?.avg_hrv_rmssd) {
        totalHrv += data.heart_rate_data.summary.avg_hrv_rmssd;
        hrvCount++;
      }
      if (data?.distance_data?.steps) {
        totalSteps += data.distance_data.steps;
        stepsCount++;
      }
      if (data?.stress_data?.body_battery_samples?.length) {
        const samples = data.stress_data.body_battery_samples;
        const latest = samples[samples.length - 1];
        if (latest?.level) {
          totalRecovery += latest.level;
          recoveryCount++;
        }
      }
    }

    if (rhrCount > 0) {
      metrics.rhr = {
        current: Math.round(totalRhr / rhrCount),
        baseline: Math.round(totalRhr / rhrCount),
        trend: 'stable',
      };
    }
    if (hrvCount > 0) {
      metrics.hrv = {
        current: Math.round(totalHrv / hrvCount),
        baseline: Math.round(totalHrv / hrvCount),
        trend: 'stable',
      };
    }
    if (stepsCount > 0) {
      metrics.steps = {
        today: Math.round(totalSteps / stepsCount),
        avgDaily: Math.round(totalSteps / stepsCount),
      };
    }
    if (recoveryCount > 0) {
      metrics.recovery = {
        score: Math.round(totalRecovery / recoveryCount),
        status: 'moderate',
        label: 'Body Battery',
      };
    }
  }

  return metrics;
}

/**
 * Extract current metrics from new data payload
 */
function extractCurrentMetrics(data: unknown, dataType: string): HealthMetrics {
  const metrics: HealthMetrics = {};

  if (dataType === 'sleep') {
    const sleepData = data as {
      sleep_durations_data?: {
        asleep?: { duration_asleep_state_seconds?: number };
        sleep_efficiency?: number;
      };
    };

    const sleepSeconds = sleepData?.sleep_durations_data?.asleep?.duration_asleep_state_seconds;
    const efficiency = sleepData?.sleep_durations_data?.sleep_efficiency;

    if (sleepSeconds) {
      const hours = sleepSeconds / 3600;
      metrics.sleep = {
        lastNightHours: Math.round(hours * 10) / 10,
        quality: efficiency != null ? (efficiency >= 0.85 ? 'excellent' : efficiency >= 0.75 ? 'good' : efficiency >= 0.65 ? 'fair' : 'poor') : 'good',
        avgWeekHours: Math.round(hours * 10) / 10,
      };
    }
  }

  if (dataType === 'daily') {
    const dailyData = data as {
      heart_rate_data?: { summary?: { resting_hr_bpm?: number; avg_hrv_rmssd?: number } };
      distance_data?: { steps?: number };
      stress_data?: { body_battery_samples?: { level?: number }[] };
    };

    if (dailyData?.heart_rate_data?.summary?.resting_hr_bpm) {
      metrics.rhr = {
        current: Math.round(dailyData.heart_rate_data.summary.resting_hr_bpm),
        baseline: Math.round(dailyData.heart_rate_data.summary.resting_hr_bpm),
        trend: 'stable',
      };
    }
    if (dailyData?.heart_rate_data?.summary?.avg_hrv_rmssd) {
      metrics.hrv = {
        current: Math.round(dailyData.heart_rate_data.summary.avg_hrv_rmssd),
        baseline: Math.round(dailyData.heart_rate_data.summary.avg_hrv_rmssd),
        trend: 'stable',
      };
    }
    if (dailyData?.distance_data?.steps) {
      metrics.steps = {
        today: dailyData.distance_data.steps,
        avgDaily: dailyData.distance_data.steps,
      };
    }
    if (dailyData?.stress_data?.body_battery_samples?.length) {
      const samples = dailyData.stress_data.body_battery_samples;
      const latest = samples[samples.length - 1];
      if (latest?.level) {
        metrics.recovery = {
          score: latest.level,
          status: latest.level >= 67 ? 'high' : latest.level >= 34 ? 'moderate' : 'low',
          label: 'Body Battery',
        };
      }
    }
  }

  return metrics;
}

/**
 * Generate AI insight message with dual comparison format
 */
async function generateInsightMessage(
  userName: string,
  dualComparison: DualComparison
): Promise<string | null> {
  // Format values for readability
  const formatValue = (value: number, metricType: InsightMetricType): string => {
    if (metricType === 'steps') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
    }
    if (metricType === 'sleep_hours') {
      return `${value.toFixed(1)}h`;
    }
    return `${Math.round(value)}`;
  };

  const metricLabels: Record<InsightMetricType, string> = {
    steps: 'Steps',
    sleep_hours: 'Sleep',
    hrv: 'HRV',
    rhr: 'Resting heart rate',
    recovery: 'Recovery score',
  };

  const todayFormatted = formatValue(dualComparison.todayValue, dualComparison.metricType);
  const yesterdayFormatted = dualComparison.yesterdayValue !== null
    ? formatValue(dualComparison.yesterdayValue, dualComparison.metricType)
    : 'N/A';
  const baselineFormatted = dualComparison.baseline7day !== null
    ? formatValue(dualComparison.baseline7day, dualComparison.metricType)
    : 'N/A';

  // Build comparison context
  let vsYesterdayStr = '';
  if (dualComparison.yesterdayValue !== null && dualComparison.percentChangeYesterday !== null) {
    const arrow = dualComparison.directionYesterday === 'up' ? '↑' : dualComparison.directionYesterday === 'down' ? '↓' : '→';
    vsYesterdayStr = `Vs Yesterday: ${yesterdayFormatted} → ${todayFormatted} (${arrow} ${Math.abs(dualComparison.percentChangeYesterday)}%)`;
  } else {
    vsYesterdayStr = 'Vs Yesterday: No data';
  }

  let vsBaselineStr = '';
  if (dualComparison.baseline7day !== null && dualComparison.directionBaseline !== null) {
    vsBaselineStr = `7-day average: ${baselineFormatted} (currently ${dualComparison.directionBaseline})`;
  } else {
    vsBaselineStr = '7-day average: Not enough data';
  }

  const prompt = `Generate a brief health insight (1-2 sentences) for ${userName}.

DATA:
${metricLabels[dualComparison.metricType]}: ${todayFormatted} today
${vsYesterdayStr}
${vsBaselineStr}

Guidelines:
- ALWAYS mention both comparisons when data is available (yesterday AND average)
- Use the format: "X [direction] from yesterday (old → new), [but still above/and also below] your Y average."
- Sound like a knowledgeable friend, not an alert system
- Be specific with numbers (use the formatted values provided)
- Keep it SHORT: 1-2 sentences max

GOOD EXAMPLES:
- "Steps down from yesterday (8.2k → 5.1k), but still close to your 6k weekly average."
- "HRV dropped 15 points since yesterday (52 → 37). Below your 48 baseline too—might want to take it easy."
- "Sleep improved from last night (6.2h → 7.8h), now above your 7h average."
- "RHR up slightly from yesterday (58 → 62), though still in line with your 60 baseline."

BAD EXAMPLES (don't do these):
- "Great job on your steps!" (too generic, no numbers)
- "Your HRV is 45." (only one number, no comparison)
- "Steps dropped from 7,489 to 2,101" (no baseline context)

Generate ONLY the insight message, nothing else:`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (textContent && textContent.type === 'text') {
      let message = textContent.text.trim();
      message = message.replace(/^["']|["']$/g, '');
      return message;
    }

    return null;
  } catch (error) {
    console.error('Error generating insight message:', error);
    return null;
  }
}

/**
 * Extract metric values from current data and map to metric types
 */
function extractMetricValues(
  currentMetrics: HealthMetrics,
  dataType: string
): Array<{ metricType: InsightMetricType; value: number }> {
  const metrics: Array<{ metricType: InsightMetricType; value: number }> = [];

  if (dataType === 'sleep') {
    if (currentMetrics.sleep?.lastNightHours) {
      metrics.push({ metricType: 'sleep_hours', value: currentMetrics.sleep.lastNightHours });
    }
  }

  if (dataType === 'daily') {
    if (currentMetrics.steps?.today) {
      metrics.push({ metricType: 'steps', value: currentMetrics.steps.today });
    }
    if (currentMetrics.hrv?.current) {
      metrics.push({ metricType: 'hrv', value: currentMetrics.hrv.current });
    }
    if (currentMetrics.rhr?.current) {
      metrics.push({ metricType: 'rhr', value: currentMetrics.rhr.current });
    }
    if (currentMetrics.recovery?.score) {
      metrics.push({ metricType: 'recovery', value: currentMetrics.recovery.score });
    }
  }

  return metrics;
}

/**
 * Get the value for a specific metric type from HealthMetrics
 */
function getMetricValue(metrics: HealthMetrics | null, metricType: InsightMetricType): number | null {
  if (!metrics) return null;

  switch (metricType) {
    case 'sleep_hours':
      return metrics.sleep?.lastNightHours ?? null;
    case 'steps':
      return metrics.steps?.today ?? metrics.steps?.avgDaily ?? null;
    case 'hrv':
      return metrics.hrv?.current ?? null;
    case 'rhr':
      return metrics.rhr?.current ?? null;
    case 'recovery':
      return metrics.recovery?.score ?? null;
    default:
      return null;
  }
}

/**
 * Determine insight type and priority based on dual comparison
 */
function determineInsightTypeAndPriority(
  metricType: InsightMetricType,
  dualComparison: DualComparison
): { type: ProactiveInsightType; priority: ProactiveInsightPriority } {
  let type: ProactiveInsightType = 'notable_change';
  let priority: ProactiveInsightPriority = 'medium';

  const percentChange = dualComparison.percentChangeYesterday;
  const direction = dualComparison.directionYesterday;

  // Check for concerning patterns
  if (
    (metricType === 'rhr' && direction === 'up' && percentChange !== null && percentChange >= 10) ||
    (metricType === 'hrv' && direction === 'down' && percentChange !== null && Math.abs(percentChange) >= 20) ||
    (metricType === 'recovery' && direction === 'down' && percentChange !== null && Math.abs(percentChange) >= 25)
  ) {
    type = 'concern';
    priority = 'high';
  } else if (
    // Positive changes
    (metricType === 'sleep_hours' && direction === 'up') ||
    (metricType === 'hrv' && direction === 'up') ||
    (metricType === 'steps' && direction === 'up') ||
    (metricType === 'recovery' && direction === 'up')
  ) {
    priority = 'low';
  }

  // Check for milestones
  if (
    (metricType === 'sleep_hours' && dualComparison.todayValue >= 8) ||
    (metricType === 'steps' && dualComparison.todayValue >= 10000)
  ) {
    type = 'milestone';
    priority = 'low';
  }

  return { type, priority };
}

/**
 * Main function: Process new health data and generate proactive insight if warranted
 *
 * New flow:
 * 1. Extract metric date from Terra metadata
 * 2. Get yesterday's specific data (same metric, previous day)
 * 3. Get 7-day average (baseline context)
 * 4. Build dual comparison
 * 5. Check for existing insight for this metric today
 * 6. UPSERT (update if exists, insert if new and under limit)
 */
export async function processNewHealthData(
  userId: string,
  dataType: string,
  newData: unknown
): Promise<ProactiveInsight | null> {
  try {
    // Only process sleep and daily data for now
    if (!['sleep', 'daily'].includes(dataType)) {
      return null;
    }

    // Step 1: Extract date boundaries from Terra metadata
    const boundaries = getDateBoundaries(newData, dataType);
    console.log(`Processing ${dataType} data for ${boundaries.metricDate}`);

    // Get user name
    const userName = await getUserName(userId);

    // Step 2: Extract current metrics from new data
    const currentMetrics = extractCurrentMetrics(newData, dataType);
    const metricValues = extractMetricValues(currentMetrics, dataType);

    if (metricValues.length === 0) {
      console.log(`No extractable metrics from ${dataType} data`);
      return null;
    }

    // Step 3: Get yesterday's data and 7-day baseline
    const [yesterdayMetrics, baselineMetrics] = await Promise.all([
      getYesterdayMetrics(userId, dataType, boundaries),
      get7DayBaseline(userId, dataType, boundaries),
    ]);

    // Step 4: Process each metric and find the most notable one
    let mostNotableComparison: DualComparison | null = null;
    let mostNotablePriority: ProactiveInsightPriority = 'low';

    for (const { metricType, value: todayValue } of metricValues) {
      const yesterdayValue = getMetricValue(yesterdayMetrics, metricType);
      const baselineValue = getMetricValue(baselineMetrics, metricType);

      const dualComparison = buildDualComparison(metricType, todayValue, yesterdayValue, baselineValue);

      // Check if this is a notable change (>= 15% vs yesterday or significant vs baseline)
      const isNotable =
        (dualComparison.percentChangeYesterday !== null && Math.abs(dualComparison.percentChangeYesterday) >= NOTABLE_CHANGE_THRESHOLD * 100) ||
        (dualComparison.percentChangeBaseline !== null && Math.abs(dualComparison.percentChangeBaseline) >= 20) ||
        (metricType === 'steps' && todayValue >= 10000) ||
        (metricType === 'sleep_hours' && todayValue >= 8);

      if (!isNotable) continue;

      // Determine priority for this metric
      const { priority } = determineInsightTypeAndPriority(metricType, dualComparison);

      // Keep track of the most notable (highest priority) comparison
      const priorityRank = { high: 3, medium: 2, low: 1 };
      if (!mostNotableComparison || priorityRank[priority] > priorityRank[mostNotablePriority]) {
        mostNotableComparison = dualComparison;
        mostNotablePriority = priority;
      }
    }

    if (!mostNotableComparison) {
      console.log(`No notable changes for ${dataType} data, skipping insight generation`);
      return null;
    }

    // Step 5: Generate AI message with dual comparison
    const message = await generateInsightMessage(userName, mostNotableComparison);

    if (!message) {
      console.log('Failed to generate insight message');
      return null;
    }

    // Step 6: Determine insight type and priority
    const { type, priority } = determineInsightTypeAndPriority(
      mostNotableComparison.metricType,
      mostNotableComparison
    );

    // Step 7: Upsert insight (update if exists, insert if new and under limit)
    const context = {
      dataType,
      currentMetrics,
      yesterdayMetrics,
      baselineMetrics,
      boundaries,
    };

    const insight = await upsertInsight(
      userId,
      message,
      type,
      priority,
      mostNotableComparison,
      boundaries.metricDate,
      context
    );

    if (insight) {
      console.log(`Generated/updated proactive insight for ${userId}:`, insight.message);
    }

    return insight;
  } catch (error) {
    console.error('Error processing health data for insight:', error);
    return null;
  }
}

/**
 * Get unread proactive insights for a user
 */
export async function getUnreadInsights(userId: string): Promise<ProactiveInsight[]> {
  const { data, error } = await supabase
    .from('proactive_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching unread insights:', error);
    return [];
  }

  return (data || []).map(row => mapDbRowToInsight(row));
}

/**
 * Mark insight as read
 */
export async function markInsightAsRead(insightId: string): Promise<boolean> {
  const { error } = await supabase
    .from('proactive_insights')
    .update({ read: true })
    .eq('id', insightId);

  return !error;
}

/**
 * Dismiss (mark as read) all insights for a user
 */
export async function dismissAllInsights(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('proactive_insights')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  return !error;
}

/**
 * Generate insight from a detected pattern
 */
export async function generatePatternInsight(
  userId: string,
  pattern: {
    description: string;
    metricA: string;
    metricB?: string;
    correlationStrength: number;
    confidence: number;
    direction: 'positive' | 'negative';
    sampleSize: number;
  },
  currentMetrics: {
    metricA?: number;
    metricB?: number;
  }
): Promise<ProactiveInsight | null> {
  try {
    const userName = await getUserName(userId);

    // Build context for the insight
    const strengthLabel = Math.abs(pattern.correlationStrength) >= 0.7 ? 'strong' :
                          Math.abs(pattern.correlationStrength) >= 0.5 ? 'moderate' : 'notable';

    const prompt = `Generate a brief, actionable health insight (1-2 sentences) for ${userName}.

PATTERN DATA:
${pattern.description}
Correlation strength: ${strengthLabel} (${pattern.direction})
Confidence: ${Math.round(pattern.confidence * 100)}%
Based on ${pattern.sampleSize} days of data

${currentMetrics.metricA ? `Current ${pattern.metricA}: ${currentMetrics.metricA}` : ''}
${currentMetrics.metricB && pattern.metricB ? `Current ${pattern.metricB}: ${currentMetrics.metricB}` : ''}

Guidelines:
- Make it personal and conversational
- Include specific implications or suggestions if appropriate
- Don't repeat the raw statistics
- Sound like a knowledgeable friend sharing an observation

Example good outputs:
- "Your data shows a clear pattern: better sleep leads to better recovery for you. Last night's 7+ hours should set you up well for today."
- "Interesting trend in your data—your recovery tends to dip after high-step days. Might want to plan some rest after that 12k day."

Generate ONLY the insight message:`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return null;
    }

    let message = textContent.text.trim();
    message = message.replace(/^["']|["']$/g, '');

    // Store as a pattern-type insight
    const { data, error } = await supabase
      .from('proactive_insights')
      .insert({
        user_id: userId,
        message,
        type: 'pattern',
        priority: pattern.confidence >= 0.7 ? 'medium' : 'low',
        data_context: {
          pattern,
          currentMetrics,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing pattern insight:', error);
      return null;
    }

    return mapDbRowToInsight(data);
  } catch (error) {
    console.error('Error generating pattern insight:', error);
    return null;
  }
}
