/**
 * Proactive Insight Generation
 * Analyzes new health data and generates AI comments when notable changes occur
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';
import { HealthMetrics, ProactiveInsight, ProactiveInsightType, ProactiveInsightPriority } from '@/types';

const anthropic = new Anthropic();

// Daily limit for proactive insights per user
const MAX_DAILY_INSIGHTS = 3;

// Threshold for "notable" changes (percentage)
const NOTABLE_CHANGE_THRESHOLD = 0.15; // 15%

interface MetricComparison {
  metric: string;
  current: number;
  previous: number;
  percentChange: number;
  direction: 'up' | 'down';
}

interface AnalysisResult {
  shouldGenerate: boolean;
  insightType: ProactiveInsightType;
  priority: ProactiveInsightPriority;
  notableChanges: MetricComparison[];
  context: Record<string, unknown>;
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
 * Count today's insights for rate limiting
 */
async function getTodayInsightCount(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('proactive_insights')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  return count || 0;
}

/**
 * Get previous metrics for comparison (from the last 7 days, excluding today)
 */
async function getPreviousMetrics(userId: string, dataType: string): Promise<HealthMetrics | null> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('terra_data_payloads')
    .select('data')
    .eq('reference_id', userId)
    .eq('type', dataType)
    .gte('created_at', sevenDaysAgo)
    .lt('created_at', oneDayAgo)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!data || data.length === 0) return null;

  // Aggregate previous data into comparable metrics
  return aggregateMetrics(data.map(d => d.data), dataType);
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
 * Analyze whether new data warrants a proactive insight
 */
function analyzeForInsight(
  currentMetrics: HealthMetrics,
  previousMetrics: HealthMetrics | null,
  dataType: string
): AnalysisResult {
  const notableChanges: MetricComparison[] = [];
  let insightType: ProactiveInsightType = 'notable_change';
  let priority: ProactiveInsightPriority = 'medium';

  // If no previous data, only generate for exceptional values
  if (!previousMetrics) {
    // Check for milestone-worthy values
    if (currentMetrics.sleep?.lastNightHours && currentMetrics.sleep.lastNightHours >= 8) {
      return {
        shouldGenerate: true,
        insightType: 'milestone',
        priority: 'low',
        notableChanges: [],
        context: { sleepHours: currentMetrics.sleep.lastNightHours },
      };
    }
    if (currentMetrics.steps?.today && currentMetrics.steps.today >= 10000) {
      return {
        shouldGenerate: true,
        insightType: 'milestone',
        priority: 'low',
        notableChanges: [],
        context: { steps: currentMetrics.steps.today },
      };
    }

    return { shouldGenerate: false, insightType, priority, notableChanges, context: {} };
  }

  // Compare metrics
  const compareMetric = (
    metric: string,
    current: number | undefined,
    previous: number | undefined
  ) => {
    if (current == null || previous == null || previous === 0) return;

    const percentChange = (current - previous) / previous;

    if (Math.abs(percentChange) >= NOTABLE_CHANGE_THRESHOLD) {
      notableChanges.push({
        metric,
        current,
        previous,
        percentChange: Math.round(percentChange * 100),
        direction: percentChange > 0 ? 'up' : 'down',
      });
    }
  };

  // Sleep comparisons
  if (dataType === 'sleep') {
    compareMetric('sleep_hours', currentMetrics.sleep?.lastNightHours, previousMetrics.sleep?.lastNightHours);
  }

  // Daily comparisons
  if (dataType === 'daily') {
    compareMetric('rhr', currentMetrics.rhr?.current, previousMetrics.rhr?.current);
    compareMetric('hrv', currentMetrics.hrv?.current, previousMetrics.hrv?.current);
    compareMetric('steps', currentMetrics.steps?.today, previousMetrics.steps?.avgDaily);
    compareMetric('recovery', currentMetrics.recovery?.score, previousMetrics.recovery?.score);
  }

  // Determine if we should generate and set priority
  if (notableChanges.length === 0) {
    return { shouldGenerate: false, insightType, priority, notableChanges, context: {} };
  }

  // Check for concerning patterns (high priority)
  const concerningChanges = notableChanges.filter(c =>
    (c.metric === 'rhr' && c.direction === 'up' && Math.abs(c.percentChange) >= 10) ||
    (c.metric === 'hrv' && c.direction === 'down' && Math.abs(c.percentChange) >= 20) ||
    (c.metric === 'recovery' && c.direction === 'down' && Math.abs(c.percentChange) >= 25)
  );

  if (concerningChanges.length > 0) {
    insightType = 'concern';
    priority = 'high';
  } else {
    // Positive changes are medium priority
    const positiveChanges = notableChanges.filter(c =>
      (c.metric === 'sleep_hours' && c.direction === 'up') ||
      (c.metric === 'hrv' && c.direction === 'up') ||
      (c.metric === 'steps' && c.direction === 'up') ||
      (c.metric === 'recovery' && c.direction === 'up')
    );

    if (positiveChanges.length > 0) {
      priority = 'low';
    }
  }

  return {
    shouldGenerate: true,
    insightType,
    priority,
    notableChanges,
    context: {
      currentMetrics,
      previousMetrics,
      dataType,
    },
  };
}

/**
 * Generate AI insight message
 */
async function generateInsightMessage(
  userName: string,
  dataType: string,
  analysis: AnalysisResult
): Promise<string | null> {
  const { notableChanges, insightType, context } = analysis;

  // Build context summary
  let currentSummary = '';
  let previousSummary = '';

  if (notableChanges.length > 0) {
    currentSummary = notableChanges.map(c => `${c.metric}: ${c.current}`).join(', ');
    previousSummary = notableChanges.map(c => `${c.metric}: ${c.previous}`).join(', ');
  } else if (context.sleepHours) {
    currentSummary = `sleep: ${context.sleepHours} hours`;
    previousSummary = 'N/A (first notable data)';
  } else if (context.steps) {
    currentSummary = `steps: ${context.steps}`;
    previousSummary = 'N/A (first notable data)';
  }

  const prompt = `Generate a SINGLE brief comment (1-2 sentences max) for ${userName} about their new ${dataType} data.

CURRENT: ${currentSummary}
PREVIOUS: ${previousSummary}
INSIGHT TYPE: ${insightType}

Guidelines:
- Sound like a knowledgeable friend texting, not an alert system
- Be specific about the numbers when relevant
- For concerns, be matter-of-fact without being alarming
- For positive changes, acknowledge without over-celebrating
- Don't ask questions—this is an observation, not a conversation starter
- Keep it SHORT: 1-2 sentences max

Examples of good tone:
- "Solid sleep—7.5 hours with great efficiency. Your HRV should reflect that tomorrow."
- "Heads up: RHR jumped 8 bpm. Could be stress or dehydration. Worth taking it easy."
- "10K steps three days running. You're building a habit."
- "HRV's down 20% from baseline—recovery's taking a hit. Yesterday was probably rough."

Generate ONLY the comment, nothing else:`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (textContent && textContent.type === 'text') {
      // Clean up the response
      let message = textContent.text.trim();
      // Remove any quotes if Claude wrapped the response
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
 * Store insight in database
 */
async function storeInsight(
  userId: string,
  message: string,
  type: ProactiveInsightType,
  priority: ProactiveInsightPriority,
  context: Record<string, unknown>
): Promise<ProactiveInsight | null> {
  const { data, error } = await supabase
    .from('proactive_insights')
    .insert({
      user_id: userId,
      message,
      type,
      priority,
      data_context: context,
    })
    .select()
    .single();

  if (error) {
    console.error('Error storing insight:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    message: data.message,
    type: data.type,
    priority: data.priority,
    dataContext: data.data_context,
    createdAt: data.created_at,
    read: data.read,
  };
}

/**
 * Main function: Process new health data and generate proactive insight if warranted
 */
export async function processNewHealthData(
  userId: string,
  dataType: string,
  newData: unknown
): Promise<ProactiveInsight | null> {
  try {
    // Check rate limit
    const todayCount = await getTodayInsightCount(userId);
    if (todayCount >= MAX_DAILY_INSIGHTS) {
      console.log(`Rate limit reached for user ${userId}`);
      return null;
    }

    // Only process sleep and daily data for now
    if (!['sleep', 'daily'].includes(dataType)) {
      return null;
    }

    // Get user name
    const userName = await getUserName(userId);

    // Extract current metrics from new data
    const currentMetrics = extractCurrentMetrics(newData, dataType);

    // Get previous metrics for comparison
    const previousMetrics = await getPreviousMetrics(userId, dataType);

    // Analyze if insight is warranted
    const analysis = analyzeForInsight(currentMetrics, previousMetrics, dataType);

    if (!analysis.shouldGenerate) {
      console.log(`No notable changes for ${dataType} data, skipping insight generation`);
      return null;
    }

    // Generate AI message
    const message = await generateInsightMessage(userName, dataType, analysis);

    if (!message) {
      console.log('Failed to generate insight message');
      return null;
    }

    // Store and return insight
    const insight = await storeInsight(
      userId,
      message,
      analysis.insightType,
      analysis.priority,
      analysis.context as Record<string, unknown>
    );

    console.log(`Generated proactive insight for ${userId}:`, insight?.message);
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

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    message: row.message,
    type: row.type,
    priority: row.priority,
    dataContext: row.data_context,
    createdAt: row.created_at,
    read: row.read,
  }));
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
