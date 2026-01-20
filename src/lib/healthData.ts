/**
 * Health data processing functions
 * Transforms Terra data into our app's format
 */

import { supabase } from './supabase';
import { HealthMetrics, HealthProvider } from '@/types';

interface TerraPayload {
  id: string;
  type: string;
  data: unknown;
  created_at: string;
}

interface TerraUser {
  provider: string;
}

/**
 * Get the provider for a user from terra_users
 */
async function getProvider(userId: string): Promise<HealthProvider> {
  const { data } = await supabase
    .from('terra_users')
    .select('provider')
    .eq('reference_id', userId)
    .order('last_webhook_update', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const provider = (data[0] as TerraUser).provider?.toUpperCase();
    if (['GARMIN', 'WHOOP', 'OURA', 'FITBIT', 'APPLE', 'GOOGLE'].includes(provider)) {
      return provider as HealthProvider;
    }
  }
  return 'UNKNOWN';
}

/**
 * Get recovery label based on provider
 */
function getRecoveryLabel(provider: HealthProvider): string {
  switch (provider) {
    case 'GARMIN':
      return 'Body Battery';
    case 'OURA':
      return 'Readiness';
    case 'WHOOP':
      return 'Recovery';
    default:
      return 'Recovery';
  }
}

/**
 * Get stress category from level (Garmin: 0-100, lower is calmer)
 */
function getStressCategory(level: number): 'rest' | 'low' | 'medium' | 'high' {
  if (level <= 25) return 'rest';
  if (level <= 50) return 'low';
  if (level <= 75) return 'medium';
  return 'high';
}

/**
 * Timeout wrapper for database queries
 * Returns fallback value if query exceeds timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  const timeout = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error('Query timeout')), ms)
  );
  try {
    return await Promise.race([promise, timeout]);
  } catch (error) {
    console.warn('Query timed out, using fallback:', error);
    return fallback;
  }
}

/**
 * Get the latest health metrics for a user
 * This queries Terra's data tables and transforms to our HealthMetrics format
 */
export async function getLatestHealthMetrics(userId: string): Promise<HealthMetrics | null> {
  try {
    // Only fetch data from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Run provider and payloads queries IN PARALLEL
    const providerPromise = withTimeout(getProvider(userId), 3000, 'UNKNOWN' as HealthProvider);

    const payloadsPromise = (async () => {
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      );

      const queryPromise = supabase
        .from('terra_data_payloads')
        .select('id, type, data, created_at')
        .eq('reference_id', userId)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(50) // Need enough to get all data types (sleep, daily, body, etc.)
        .then(res => {
          if (res.error) throw res.error;
          return res.data as TerraPayload[];
        });

      return Promise.race([queryPromise, timeoutPromise]);
    })();

    // Wait for both in parallel
    const [provider, payloads] = await Promise.all([
      providerPromise,
      payloadsPromise.catch(() => null),
    ]);

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

    // For sleep, find the most recent by sleep END time (not created_at)
    const sleepPayloads = payloads.filter(p => p.type === 'sleep');
    let mostRecentSleep: TerraPayload | null = null;
    let mostRecentSleepEnd: Date | null = null;

    for (const payload of sleepPayloads) {
      const sleepData = payload.data as { metadata?: { end_time?: string } };
      const endTime = sleepData?.metadata?.end_time;
      if (endTime) {
        const endDate = new Date(endTime);
        if (!mostRecentSleepEnd || endDate > mostRecentSleepEnd) {
          mostRecentSleepEnd = endDate;
          mostRecentSleep = payload;
        }
      }
    }

    const metrics: HealthMetrics = {
      provider,
    };

    // Process sleep data - use most recent by sleep date
    if (mostRecentSleep) {
      const sleepData = mostRecentSleep.data as {
        metadata?: { start_time?: string; end_time?: string };
        sleep_durations_data?: {
          asleep?: { duration_asleep_state_seconds?: number };
          other?: { duration_in_bed_seconds?: number };
          sleep_efficiency?: number;
        };
        sleep_efficiency?: number;
      };

      if (sleepData) {
        // Use duration_asleep_state_seconds for actual sleep time
        const sleepSeconds = sleepData.sleep_durations_data?.asleep?.duration_asleep_state_seconds || 0;
        const sleepHours = sleepSeconds / 3600;

        // Get efficiency from nested location or top level
        const efficiency = sleepData.sleep_durations_data?.sleep_efficiency ||
                          sleepData.sleep_efficiency || 0;

        // Extract sleep date from start_time
        const startTime = sleepData.metadata?.start_time;
        const sleepDate = startTime ? startTime.substring(0, 10) : undefined;

        metrics.sleep = {
          lastNightHours: Math.round(sleepHours * 10) / 10,
          quality: efficiency >= 0.85 ? 'excellent' : efficiency >= 0.75 ? 'good' : efficiency >= 0.65 ? 'fair' : 'poor',
          avgWeekHours: sleepHours, // TODO: compute from historical data
          sleepDate,
        };
      }
    }

    // Process daily data for RHR, HRV, steps, stress, body battery
    if (latestByType['daily']) {
      const dailyData = latestByType['daily'].data as {
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
        distance_data?: { steps?: number };
        stress_data?: {
          avg_stress_level?: number;
          body_battery_samples?: { level?: number; timestamp?: string }[];
        };
        oxygen_data?: {
          vo2max_ml_per_min_per_kg?: number;
        };
      };

      if (dailyData) {
        // Resting heart rate
        const rhr = dailyData.heart_rate_data?.summary?.resting_hr_bpm;
        if (rhr) {
          metrics.rhr = {
            current: Math.round(rhr),
            baseline: Math.round(rhr), // TODO: compute from historical data
            trend: 'stable',
          };
        }

        // HRV (only if available - not all devices export this)
        const hrv = dailyData.heart_rate_data?.summary?.avg_hrv_rmssd ||
                    dailyData.heart_rate_data?.summary?.avg_hrv_sdnn ||
                    dailyData.hrv_data?.summary?.avg_hrv_rmssd;
        if (hrv) {
          metrics.hrv = {
            current: Math.round(hrv),
            baseline: Math.round(hrv), // TODO: compute from historical data
            trend: 'stable',
          };
        }

        // Steps
        const steps = dailyData.distance_data?.steps;
        if (steps) {
          metrics.steps = {
            today: steps,
            avgDaily: steps, // TODO: compute from historical data
          };
        }

        // VO2 Max (if available)
        const vo2max = dailyData.oxygen_data?.vo2max_ml_per_min_per_kg;
        if (vo2max) {
          metrics.vo2Max = Math.round(vo2max * 10) / 10;
        }

        // Garmin-specific: Body Battery and Stress
        if (provider === 'GARMIN' && dailyData.stress_data) {
          // Body Battery as recovery - get most recent sample
          if (dailyData.stress_data.body_battery_samples?.length) {
            const samples = dailyData.stress_data.body_battery_samples;
            const latestSample = samples[samples.length - 1];
            if (latestSample?.level != null) {
              metrics.recovery = {
                score: latestSample.level,
                status: latestSample.level >= 67 ? 'high' : latestSample.level >= 34 ? 'moderate' : 'low',
                label: getRecoveryLabel(provider),
              };
            }
          }

          // Stress level (Garmin-specific, NOT strain)
          if (dailyData.stress_data.avg_stress_level != null) {
            const level = dailyData.stress_data.avg_stress_level;
            metrics.stress = {
              level,
              category: getStressCategory(level),
            };
          }
        }
      }
    }

    // Process body data for fitness metrics and non-Garmin recovery
    if (latestByType['body']) {
      const bodyData = latestByType['body'].data as {
        recovery_data?: { recovery_score?: number };
        measurements_data?: {
          measurements?: { estimated_fitness_age?: number }[];
        };
      };

      // Recovery score (Whoop, Oura)
      if (bodyData?.recovery_data?.recovery_score && !metrics.recovery) {
        const score = bodyData.recovery_data.recovery_score;
        metrics.recovery = {
          score: Math.round(score),
          status: score >= 67 ? 'high' : score >= 34 ? 'moderate' : 'low',
          label: getRecoveryLabel(provider),
        };
      }

      // Fitness age
      if (bodyData?.measurements_data?.measurements?.length) {
        const measurement = bodyData.measurements_data.measurements[0];
        if (measurement?.estimated_fitness_age) {
          metrics.fitnessAge = measurement.estimated_fitness_age;
        }
      }
    }

    // Whoop-specific: Strain (different from Garmin stress)
    if (provider === 'WHOOP' && latestByType['daily']) {
      const dailyData = latestByType['daily'].data as {
        strain_data?: { strain_level?: number };
      };

      if (dailyData?.strain_data?.strain_level != null) {
        metrics.strain = {
          score: dailyData.strain_data.strain_level,
          weeklyAvg: dailyData.strain_data.strain_level, // TODO: compute from historical
        };
      }
    }

    return Object.keys(metrics).length > 1 ? metrics : null; // > 1 because provider is always set
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
