/**
 * Health data processing functions
 * Transforms Terra data into our app's format
 */

import { supabase } from './supabase';
import { HealthMetrics } from '@/types';

interface TerraPayload {
  id: string;
  user_id: string;
  reference_id: string;
  type: string;
  data: unknown;
  created_at: string;
}

/**
 * Get the latest health metrics for a user
 * This queries Terra's data tables and transforms to our HealthMetrics format
 */
export async function getLatestHealthMetrics(userId: string): Promise<HealthMetrics | null> {
  try {
    // Query Terra data payloads for this user (via reference_id which is our userId)
    // Terra creates tables: terra_users, terra_data_payloads
    const { data: payloads, error } = await supabase
      .from('terra_data_payloads')
      .select('*')
      .eq('reference_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching Terra data:', error);
      return null;
    }

    if (!payloads || payloads.length === 0) {
      return null;
    }

    // Group by type and get most recent of each
    const latestByType: Record<string, TerraPayload> = {};
    for (const payload of payloads) {
      if (!latestByType[payload.type]) {
        latestByType[payload.type] = payload;
      }
    }

    const metrics: HealthMetrics = {};

    // Process sleep data
    if (latestByType['sleep']) {
      const sleepData = latestByType['sleep'].data as {
        sleep_durations_data?: { asleep?: { duration_asleep_state_seconds?: number } };
        sleep_efficiency?: number;
      };

      if (sleepData) {
        const sleepSeconds = sleepData.sleep_durations_data?.asleep?.duration_asleep_state_seconds || 0;
        const sleepHours = sleepSeconds / 3600;
        const efficiency = sleepData.sleep_efficiency || 0;

        metrics.sleep = {
          lastNightHours: Math.round(sleepHours * 10) / 10,
          quality: efficiency >= 85 ? 'excellent' : efficiency >= 75 ? 'good' : efficiency >= 65 ? 'fair' : 'poor',
          avgWeekHours: sleepHours, // Would need historical data for true average
        };
      }
    }

    // Process daily/body data for HRV and RHR
    if (latestByType['daily'] || latestByType['body']) {
      const dailyData = (latestByType['daily']?.data || latestByType['body']?.data) as {
        heart_rate_data?: {
          summary?: {
            resting_hr_bpm?: number;
            avg_hrv_rmssd?: number;
            avg_hrv_sdnn?: number;
          };
        };
        hrv_data?: {
          summary?: {
            avg_hrv_rmssd?: number;
          };
        };
      };

      if (dailyData) {
        const rhr = dailyData.heart_rate_data?.summary?.resting_hr_bpm;
        const hrv = dailyData.heart_rate_data?.summary?.avg_hrv_rmssd ||
                    dailyData.heart_rate_data?.summary?.avg_hrv_sdnn ||
                    dailyData.hrv_data?.summary?.avg_hrv_rmssd;

        if (rhr) {
          metrics.rhr = {
            current: Math.round(rhr),
            baseline: Math.round(rhr), // Would need historical data for true baseline
            trend: 'stable',
          };
        }

        if (hrv) {
          metrics.hrv = {
            current: Math.round(hrv),
            baseline: Math.round(hrv), // Would need historical data for true baseline
            trend: 'stable',
          };
        }
      }
    }

    // Process activity data for steps
    if (latestByType['activity'] || latestByType['daily']) {
      const activityData = (latestByType['activity']?.data || latestByType['daily']?.data) as {
        distance_data?: { steps?: number };
        active_durations_data?: { activity_seconds?: number };
      };

      if (activityData) {
        const steps = activityData.distance_data?.steps;
        if (steps) {
          metrics.steps = {
            today: steps,
            avgDaily: steps, // Would need historical data for true average
          };
        }
      }
    }

    // Process recovery/strain if available (Whoop, Oura)
    if (latestByType['body']) {
      const bodyData = latestByType['body'].data as {
        recovery_data?: { recovery_score?: number };
        stress_data?: { stress_level?: number };
      };

      if (bodyData?.recovery_data?.recovery_score) {
        const score = bodyData.recovery_data.recovery_score;
        metrics.recovery = {
          score: Math.round(score),
          status: score >= 67 ? 'high' : score >= 34 ? 'moderate' : 'low',
        };
      }
    }

    return Object.keys(metrics).length > 0 ? metrics : null;
  } catch (error) {
    console.error('Error processing health data:', error);
    return null;
  }
}

/**
 * Sync Terra data to our health_daily table
 * This aggregates Terra payloads into our daily summary format
 */
export async function syncHealthDaily(userId: string, date: string): Promise<boolean> {
  try {
    const metrics = await getLatestHealthMetrics(userId);
    if (!metrics) return false;

    // Build health_daily record
    const dailyRecord: Record<string, unknown> = {
      user_id: userId,
      date: date,
      data_sources: ['terra'],
    };

    if (metrics.sleep) {
      dailyRecord.sleep_duration_minutes = Math.round(metrics.sleep.lastNightHours * 60);
      dailyRecord.sleep_quality_score =
        metrics.sleep.quality === 'excellent' ? 90 :
        metrics.sleep.quality === 'good' ? 75 :
        metrics.sleep.quality === 'fair' ? 60 : 40;
    }

    if (metrics.rhr) {
      dailyRecord.resting_heart_rate = metrics.rhr.current;
    }

    if (metrics.hrv) {
      dailyRecord.hrv_average = metrics.hrv.current;
    }

    if (metrics.steps) {
      dailyRecord.steps = metrics.steps.today;
    }

    if (metrics.recovery) {
      dailyRecord.recovery_score = metrics.recovery.score;
    }

    // Upsert to health_daily
    const { error } = await supabase
      .from('health_daily')
      .upsert(dailyRecord, { onConflict: 'user_id,date' });

    if (error) {
      console.error('Error syncing health daily:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in syncHealthDaily:', error);
    return false;
  }
}

/**
 * Check if user has any connected Terra devices
 */
export async function hasConnectedDevices(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('terra_users')
      .select('user_id')
      .eq('reference_id', userId)
      .limit(1);

    if (error) {
      // Table might not exist yet
      return false;
    }

    return data && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get health data summary for display
 */
export async function getHealthSummary(userId: string): Promise<{
  hasData: boolean;
  lastSync: string | null;
  metrics: HealthMetrics | null;
}> {
  const metrics = await getLatestHealthMetrics(userId);

  if (!metrics) {
    return {
      hasData: false,
      lastSync: null,
      metrics: null,
    };
  }

  // Get last sync time from terra_data_payloads
  const { data } = await supabase
    .from('terra_data_payloads')
    .select('created_at')
    .eq('reference_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  return {
    hasData: true,
    lastSync: data?.[0]?.created_at || null,
    metrics,
  };
}
