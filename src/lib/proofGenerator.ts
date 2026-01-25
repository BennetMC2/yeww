/**
 * Proof Generator
 * Simulates ZK proof generation for health data verification
 * In production, this would integrate with actual ZK circuits
 */

import { supabase } from './supabase';
import { RequirementType } from '@/types';

interface ProofResult {
  eligible: boolean;
  proofHash?: string;
  actualValue?: number;
  message?: string;
}

/**
 * Generate a mock ZK proof hash
 * In production, this would be an actual cryptographic proof
 */
function generateMockProofHash(
  userId: string,
  requirementType: string,
  value: number
): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `zk_${timestamp}_${userId.slice(0, 8)}_${requirementType}_${randomSuffix}`;
}

/**
 * Get average metric value over a period
 */
async function getMetricAverage(
  userId: string,
  metricType: RequirementType,
  days: number
): Promise<number | null> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Query health_daily for the metric
    const { data, error } = await supabase
      .from('health_daily')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching health data:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Extract the relevant metric values
    let values: number[] = [];

    switch (metricType) {
      case 'steps_avg':
        values = data
          .map(d => d.steps)
          .filter((v): v is number => v !== null && v !== undefined);
        break;
      case 'sleep_avg':
        values = data
          .map(d => d.sleep_duration_minutes ? d.sleep_duration_minutes / 60 : null)
          .filter((v): v is number => v !== null && v !== undefined);
        break;
      case 'recovery_avg':
        values = data
          .map(d => d.recovery_score ?? d.readiness_score)
          .filter((v): v is number => v !== null && v !== undefined);
        break;
      case 'hrv_avg':
        values = data
          .map(d => d.hrv_average)
          .filter((v): v is number => v !== null && v !== undefined);
        break;
      case 'rhr_avg':
        values = data
          .map(d => d.resting_heart_rate)
          .filter((v): v is number => v !== null && v !== undefined);
        break;
      default:
        return null;
    }

    if (values.length === 0) {
      return null;
    }

    // Calculate average
    const sum = values.reduce((acc, v) => acc + v, 0);
    return Math.round((sum / values.length) * 10) / 10;
  } catch (error) {
    console.error('Error in getMetricAverage:', error);
    return null;
  }
}

/**
 * Generate a mock ZK proof for a user's health data
 */
export async function generateMockProof(
  userId: string,
  requirementType: RequirementType,
  threshold: number,
  days: number
): Promise<ProofResult> {
  try {
    // Get the user's actual average
    const actualValue = await getMetricAverage(userId, requirementType, days);

    if (actualValue === null) {
      return {
        eligible: false,
        message: 'Insufficient data to verify. Connect your wearable and sync data.',
      };
    }

    // Check if user meets the threshold
    // For steps, sleep, recovery, hrv: higher is better
    // For rhr: lower is better
    let eligible: boolean;
    if (requirementType === 'rhr_avg') {
      eligible = actualValue <= threshold;
    } else {
      eligible = actualValue >= threshold;
    }

    if (!eligible) {
      return {
        eligible: false,
        actualValue,
        message: `Your ${formatRequirementType(requirementType)} is ${actualValue.toFixed(1)}, which doesn't meet the ${threshold} threshold.`,
      };
    }

    // Generate proof hash
    const proofHash = generateMockProofHash(userId, requirementType, actualValue);

    return {
      eligible: true,
      proofHash,
      actualValue,
      message: 'Proof generated successfully!',
    };
  } catch (error) {
    console.error('Error in generateMockProof:', error);
    return {
      eligible: false,
      message: 'Error generating proof. Please try again.',
    };
  }
}

/**
 * Format requirement type for display
 */
export function formatRequirementType(type: RequirementType): string {
  switch (type) {
    case 'steps_avg':
      return 'average steps';
    case 'sleep_avg':
      return 'average sleep (hours)';
    case 'recovery_avg':
      return 'average recovery score';
    case 'hrv_avg':
      return 'average HRV';
    case 'rhr_avg':
      return 'average resting heart rate';
    default:
      return type;
  }
}

/**
 * Format threshold for display
 */
export function formatThreshold(type: RequirementType, threshold: number): string {
  switch (type) {
    case 'steps_avg':
      return `${threshold.toLocaleString()} steps`;
    case 'sleep_avg':
      return `${threshold} hours`;
    case 'recovery_avg':
      return `${threshold}+ recovery`;
    case 'hrv_avg':
      return `${threshold}+ HRV`;
    case 'rhr_avg':
      return `${threshold} or lower RHR`;
    default:
      return `${threshold}`;
  }
}

/**
 * Check user eligibility for an opportunity without generating proof
 */
export async function checkEligibility(
  userId: string,
  requirementType: RequirementType,
  threshold: number,
  days: number
): Promise<{ eligible: boolean; actualValue?: number }> {
  const actualValue = await getMetricAverage(userId, requirementType, days);

  if (actualValue === null) {
    return { eligible: false };
  }

  let eligible: boolean;
  if (requirementType === 'rhr_avg') {
    eligible = actualValue <= threshold;
  } else {
    eligible = actualValue >= threshold;
  }

  return { eligible, actualValue };
}
