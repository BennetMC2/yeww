/**
 * HealthID Score Calculator
 * Calculates health score and reputation based on user data
 */

import { supabase } from './supabase';
import { HealthMetrics, ReputationTier } from '@/types';
import { getCachedBaselines } from './baselineComputer';

interface HealthScoreComponents {
  sleepScore: number;      // 0-25
  recoveryScore: number;   // 0-25
  activityScore: number;   // 0-20
  hrvScore: number;        // 0-15
  rhrScore: number;        // 0-15
  total: number;           // 0-100
}

/**
 * Calculate health score from metrics
 * Returns a score from 0-100
 */
export async function calculateHealthScore(
  userId: string,
  metrics?: HealthMetrics | null
): Promise<{ score: number; components: HealthScoreComponents }> {
  // Default components
  const components: HealthScoreComponents = {
    sleepScore: 0,
    recoveryScore: 0,
    activityScore: 0,
    hrvScore: 0,
    rhrScore: 0,
    total: 0,
  };

  // If no metrics provided, try to get baselines
  let baselines = null;
  try {
    baselines = await getCachedBaselines(userId);
  } catch {
    // Continue without baselines
  }

  // Sleep score (25 points max)
  // Optimal: 7-9 hours
  if (metrics?.sleep) {
    const hours = metrics.sleep.lastNightHours;
    if (hours >= 7 && hours <= 9) {
      components.sleepScore = 25;
    } else if (hours >= 6 && hours < 7) {
      components.sleepScore = 18;
    } else if (hours > 9 && hours <= 10) {
      components.sleepScore = 20;
    } else if (hours >= 5 && hours < 6) {
      components.sleepScore = 12;
    } else {
      components.sleepScore = 5;
    }
  } else if (baselines?.sleep_hours?.avg7day) {
    const avgHours = baselines.sleep_hours.avg7day;
    if (avgHours >= 7 && avgHours <= 9) {
      components.sleepScore = 22;
    } else if (avgHours >= 6) {
      components.sleepScore = 15;
    } else {
      components.sleepScore = 8;
    }
  }

  // Recovery score (25 points max)
  // Based on provider's recovery/readiness/body battery
  if (metrics?.recovery) {
    const score = metrics.recovery.score;
    if (score >= 80) {
      components.recoveryScore = 25;
    } else if (score >= 60) {
      components.recoveryScore = 20;
    } else if (score >= 40) {
      components.recoveryScore = 15;
    } else if (score >= 20) {
      components.recoveryScore = 10;
    } else {
      components.recoveryScore = 5;
    }
  } else if (baselines?.recovery?.avg7day) {
    const avgRecovery = baselines.recovery.avg7day;
    if (avgRecovery >= 70) {
      components.recoveryScore = 20;
    } else if (avgRecovery >= 50) {
      components.recoveryScore = 15;
    } else {
      components.recoveryScore = 10;
    }
  }

  // Activity score (20 points max)
  // Based on steps relative to 10k goal
  if (metrics?.steps) {
    const steps = metrics.steps.today;
    if (steps >= 10000) {
      components.activityScore = 20;
    } else if (steps >= 8000) {
      components.activityScore = 16;
    } else if (steps >= 6000) {
      components.activityScore = 12;
    } else if (steps >= 4000) {
      components.activityScore = 8;
    } else if (steps >= 2000) {
      components.activityScore = 4;
    }
  } else if (baselines?.steps?.avg7day) {
    const avgSteps = baselines.steps.avg7day;
    if (avgSteps >= 10000) {
      components.activityScore = 18;
    } else if (avgSteps >= 7000) {
      components.activityScore = 14;
    } else if (avgSteps >= 5000) {
      components.activityScore = 10;
    } else {
      components.activityScore = 6;
    }
  }

  // HRV score (15 points max)
  // Higher HRV is generally better, trend matters
  if (metrics?.hrv) {
    const current = metrics.hrv.current;
    const trend = metrics.hrv.trend;

    // Base score from current value (assume 50+ is good)
    if (current >= 60) {
      components.hrvScore = 12;
    } else if (current >= 45) {
      components.hrvScore = 10;
    } else if (current >= 30) {
      components.hrvScore = 7;
    } else {
      components.hrvScore = 4;
    }

    // Bonus for positive trend
    if (trend === 'up') {
      components.hrvScore = Math.min(15, components.hrvScore + 3);
    } else if (trend === 'down') {
      components.hrvScore = Math.max(0, components.hrvScore - 2);
    }
  } else if (baselines?.hrv?.avg7day) {
    const avgHrv = baselines.hrv.avg7day;
    if (avgHrv >= 50) {
      components.hrvScore = 10;
    } else if (avgHrv >= 35) {
      components.hrvScore = 7;
    } else {
      components.hrvScore = 4;
    }
  }

  // RHR score (15 points max)
  // Lower RHR is generally better for cardiovascular health
  if (metrics?.rhr) {
    const current = metrics.rhr.current;
    const trend = metrics.rhr.trend;

    // Lower is better
    if (current <= 55) {
      components.rhrScore = 12;
    } else if (current <= 65) {
      components.rhrScore = 10;
    } else if (current <= 75) {
      components.rhrScore = 7;
    } else {
      components.rhrScore = 4;
    }

    // Bonus for downward trend
    if (trend === 'down') {
      components.rhrScore = Math.min(15, components.rhrScore + 3);
    } else if (trend === 'up') {
      components.rhrScore = Math.max(0, components.rhrScore - 2);
    }
  } else if (baselines?.rhr?.avg7day) {
    const avgRhr = baselines.rhr.avg7day;
    if (avgRhr <= 60) {
      components.rhrScore = 10;
    } else if (avgRhr <= 70) {
      components.rhrScore = 7;
    } else {
      components.rhrScore = 4;
    }
  }

  // Calculate total
  components.total =
    components.sleepScore +
    components.recoveryScore +
    components.activityScore +
    components.hrvScore +
    components.rhrScore;

  return {
    score: components.total,
    components,
  };
}

interface ReputationScoreComponents {
  wearableConnected: number;  // +50 for connected wearable
  dataStreakDays: number;     // +1 per day, max 100
  verifiedProofs: number;     // +10 per verified proof
  checkInStreak: number;      // +5 per 7 days of streak
  total: number;
}

/**
 * Calculate reputation score based on data trustworthiness
 */
export async function calculateReputationScore(
  userId: string
): Promise<{ score: number; tier: ReputationTier; components: ReputationScoreComponents }> {
  const components: ReputationScoreComponents = {
    wearableConnected: 0,
    dataStreakDays: 0,
    verifiedProofs: 0,
    checkInStreak: 0,
    total: 0,
  };

  try {
    // Check for connected wearable (+50)
    const { data: terraUser } = await supabase
      .from('terra_users')
      .select('user_id')
      .eq('reference_id', userId)
      .limit(1);

    if (terraUser && terraUser.length > 0) {
      components.wearableConnected = 50;
    }

    // Count days of continuous data (+1 per day, max 100)
    const { data: healthDays, error: healthError } = await supabase
      .from('health_daily')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100);

    if (!healthError && healthDays) {
      components.dataStreakDays = Math.min(100, healthDays.length);
    }

    // Count verified proofs (+10 each)
    const { data: proofs, error: proofsError } = await supabase
      .from('user_proofs')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['verified', 'claimed']);

    if (!proofsError && proofs) {
      components.verifiedProofs = proofs.length * 10;
    }

    // Get check-in streak from user profile (+5 per 7 days)
    const { data: user } = await supabase
      .from('users')
      .select('check_in_streak')
      .eq('id', userId)
      .single();

    if (user?.check_in_streak) {
      const weeks = Math.floor(user.check_in_streak / 7);
      components.checkInStreak = weeks * 5;
    }
  } catch (error) {
    console.error('Error calculating reputation score:', error);
  }

  // Calculate total
  components.total =
    components.wearableConnected +
    components.dataStreakDays +
    components.verifiedProofs +
    components.checkInStreak;

  // Determine tier
  let tier: ReputationTier;
  if (components.total >= 300) {
    tier = 'elite';
  } else if (components.total >= 150) {
    tier = 'trusted';
  } else if (components.total >= 50) {
    tier = 'verified';
  } else {
    tier = 'starter';
  }

  return {
    score: components.total,
    tier,
    components,
  };
}

/**
 * Get tier benefits description
 */
export function getTierBenefits(tier: ReputationTier): string[] {
  switch (tier) {
    case 'elite':
      return [
        '+25% HP bonus on all earnings',
        'Exclusive reward opportunities',
        'Priority partner access',
        'VIP support',
      ];
    case 'trusted':
      return [
        '+15% HP bonus on all earnings',
        'Premium opportunities unlocked',
        'Early access to new features',
      ];
    case 'verified':
      return [
        '+10% HP bonus on all earnings',
        'Standard opportunities unlocked',
      ];
    case 'starter':
      return [
        'Basic opportunities available',
        'Connect wearable to level up',
      ];
  }
}

/**
 * Get points needed for next tier
 */
export function getPointsToNextTier(currentScore: number): { nextTier: ReputationTier | null; pointsNeeded: number } {
  if (currentScore >= 300) {
    return { nextTier: null, pointsNeeded: 0 };
  } else if (currentScore >= 150) {
    return { nextTier: 'elite', pointsNeeded: 300 - currentScore };
  } else if (currentScore >= 50) {
    return { nextTier: 'trusted', pointsNeeded: 150 - currentScore };
  } else {
    return { nextTier: 'verified', pointsNeeded: 50 - currentScore };
  }
}
