import { NextRequest, NextResponse } from 'next/server';
import { getLatestHealthMetrics } from '@/lib/healthData';
import {
  awardHP,
  hasDailyRewardBeenClaimed,
  recordDailyRewardClaim
} from '@/lib/rewardsEngine';

interface DailyRewardResult {
  type: 'steps' | 'sleep' | 'recovery';
  amount: number;
  description: string;
}

// Thresholds for daily rewards
const DAILY_THRESHOLDS = {
  steps: { threshold: 8000, reward: 10, description: 'Hit 8k+ steps today' },
  sleep: { threshold: 7, reward: 10, description: 'Got 7+ hours of sleep' },
  recovery: { threshold: 70, reward: 5, description: 'Recovery score 70+' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const awarded: DailyRewardResult[] = [];

    // Get user's health metrics
    const metrics = await getLatestHealthMetrics(userId);

    if (!metrics) {
      return NextResponse.json({
        awarded: [],
        message: 'No health data available. Connect a wearable to earn daily rewards.',
      });
    }

    // Check steps reward
    if (metrics.steps?.today && metrics.steps.today >= DAILY_THRESHOLDS.steps.threshold) {
      const alreadyClaimed = await hasDailyRewardBeenClaimed(userId, 'steps', today);
      if (!alreadyClaimed) {
        const result = await awardHP(
          userId,
          DAILY_THRESHOLDS.steps.reward,
          'earn_behavior',
          DAILY_THRESHOLDS.steps.description,
          `daily_steps_${today}`
        );
        if (result.success) {
          await recordDailyRewardClaim(userId, 'steps', today, DAILY_THRESHOLDS.steps.reward);
          awarded.push({
            type: 'steps',
            amount: DAILY_THRESHOLDS.steps.reward,
            description: DAILY_THRESHOLDS.steps.description,
          });
        }
      }
    }

    // Check sleep reward
    if (metrics.sleep?.lastNightHours && metrics.sleep.lastNightHours >= DAILY_THRESHOLDS.sleep.threshold) {
      const alreadyClaimed = await hasDailyRewardBeenClaimed(userId, 'sleep', today);
      if (!alreadyClaimed) {
        const result = await awardHP(
          userId,
          DAILY_THRESHOLDS.sleep.reward,
          'earn_behavior',
          DAILY_THRESHOLDS.sleep.description,
          `daily_sleep_${today}`
        );
        if (result.success) {
          await recordDailyRewardClaim(userId, 'sleep', today, DAILY_THRESHOLDS.sleep.reward);
          awarded.push({
            type: 'sleep',
            amount: DAILY_THRESHOLDS.sleep.reward,
            description: DAILY_THRESHOLDS.sleep.description,
          });
        }
      }
    }

    // Check recovery reward
    if (metrics.recovery?.score && metrics.recovery.score >= DAILY_THRESHOLDS.recovery.threshold) {
      const alreadyClaimed = await hasDailyRewardBeenClaimed(userId, 'recovery', today);
      if (!alreadyClaimed) {
        const result = await awardHP(
          userId,
          DAILY_THRESHOLDS.recovery.reward,
          'earn_behavior',
          DAILY_THRESHOLDS.recovery.description,
          `daily_recovery_${today}`
        );
        if (result.success) {
          await recordDailyRewardClaim(userId, 'recovery', today, DAILY_THRESHOLDS.recovery.reward);
          awarded.push({
            type: 'recovery',
            amount: DAILY_THRESHOLDS.recovery.reward,
            description: DAILY_THRESHOLDS.recovery.description,
          });
        }
      }
    }

    const totalAwarded = awarded.reduce((sum, r) => sum + r.amount, 0);

    return NextResponse.json({
      awarded,
      totalAwarded,
      message: awarded.length > 0
        ? `Earned ${totalAwarded} HP from daily goals!`
        : 'Keep it up! Check back after hitting your goals.',
    });
  } catch (error) {
    console.error('Check daily rewards API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
