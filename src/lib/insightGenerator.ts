/**
 * Rule-based insight generation
 * Priority-ordered rules checking metrics + trends
 */

import { HealthMetrics } from '@/types';
import { MetricTrends } from './healthHistory';

export type InsightSentiment = 'positive' | 'neutral' | 'attention';

export interface DailyInsight {
  id: string;
  text: string;
  sentiment: InsightSentiment;
  metric?: string; // Which metric triggered this insight
  learnMoreContext?: string; // Context to pass to chat
}

interface InsightRule {
  id: string;
  condition: (context: InsightContext) => boolean;
  generate: (context: InsightContext) => DailyInsight;
  priority: number; // Lower = higher priority
}

interface InsightContext {
  metrics: HealthMetrics | null;
  trends: MetricTrends | null;
  streak: number;
  daysOnPlatform: number;
}

const INSIGHT_RULES: InsightRule[] = [
  // === Milestone celebrations (highest priority) ===
  {
    id: 'streak-7',
    priority: 1,
    condition: (ctx) => ctx.streak === 7,
    generate: () => ({
      id: 'streak-7',
      text: "7-day streak! Consistency is your superpower.",
      sentiment: 'positive',
      learnMoreContext: "I just hit a 7-day streak! What habits should I focus on to keep this momentum?",
    }),
  },
  {
    id: 'streak-14',
    priority: 1,
    condition: (ctx) => ctx.streak === 14,
    generate: () => ({
      id: 'streak-14',
      text: "Two weeks strong. You're building real habits.",
      sentiment: 'positive',
      learnMoreContext: "I've maintained a 14-day streak. How are habits typically formed and what can I do to make them stick?",
    }),
  },
  {
    id: 'streak-30',
    priority: 1,
    condition: (ctx) => ctx.streak === 30,
    generate: () => ({
      id: 'streak-30',
      text: "30 days! You're in the top 5% of users.",
      sentiment: 'positive',
      learnMoreContext: "I just completed a 30-day streak! What's the next level of health optimization I should consider?",
    }),
  },

  // === Metric trends (compare to last week) ===
  {
    id: 'rhr-dropped',
    priority: 10,
    condition: (ctx) => (ctx.trends?.rhr?.change ?? 0) <= -3,
    generate: (ctx) => ({
      id: 'rhr-dropped',
      text: `RHR dropped ${Math.abs(ctx.trends!.rhr!.change)}bpm this week—great recovery sign.`,
      sentiment: 'positive',
      metric: 'rhr',
      learnMoreContext: "My resting heart rate dropped significantly this week. What does this mean for my health?",
    }),
  },
  {
    id: 'rhr-elevated',
    priority: 15,
    condition: (ctx) => (ctx.trends?.rhr?.change ?? 0) >= 5,
    generate: (ctx) => ({
      id: 'rhr-elevated',
      text: `RHR up ${ctx.trends!.rhr!.change}bpm from last week. Keep an eye on stress and rest.`,
      sentiment: 'attention',
      metric: 'rhr',
      learnMoreContext: "My resting heart rate increased this week. What could be causing this?",
    }),
  },
  {
    id: 'sleep-improved',
    priority: 10,
    condition: (ctx) => (ctx.trends?.sleep?.change ?? 0) >= 0.5,
    generate: (ctx) => ({
      id: 'sleep-improved',
      text: `Sleeping ${ctx.trends!.sleep!.change.toFixed(1)}h more than last week. Nice.`,
      sentiment: 'positive',
      metric: 'sleep',
      learnMoreContext: "I'm sleeping more this week. How can I maintain this improvement?",
    }),
  },
  {
    id: 'steps-up',
    priority: 10,
    condition: (ctx) => (ctx.trends?.steps?.change ?? 0) >= 2000,
    generate: (ctx) => ({
      id: 'steps-up',
      text: `${ctx.trends!.steps!.change.toLocaleString()} more steps daily than last week.`,
      sentiment: 'positive',
      metric: 'steps',
      learnMoreContext: "I've been walking more this week. What are the benefits of increased daily steps?",
    }),
  },
  {
    id: 'hrv-improved',
    priority: 10,
    condition: (ctx) => (ctx.trends?.hrv?.change ?? 0) >= 5,
    generate: (ctx) => ({
      id: 'hrv-improved',
      text: `HRV up ${ctx.trends!.hrv!.change}ms—your body is adapting well.`,
      sentiment: 'positive',
      metric: 'hrv',
      learnMoreContext: "My HRV improved this week. What does this indicate about my recovery?",
    }),
  },

  // === Today's metrics ===
  {
    id: 'recovery-high',
    priority: 20,
    condition: (ctx) => (ctx.metrics?.recovery?.score ?? 0) >= 90,
    generate: (ctx) => ({
      id: 'recovery-high',
      text: `${ctx.metrics?.recovery?.label || 'Recovery'} at ${ctx.metrics!.recovery!.score}. Prime day for a challenge.`,
      sentiment: 'positive',
      metric: 'recovery',
      learnMoreContext: "My recovery is very high today. What kind of workout should I do?",
    }),
  },
  {
    id: 'recovery-good',
    priority: 25,
    condition: (ctx) => (ctx.metrics?.recovery?.score ?? 0) >= 70 && (ctx.metrics?.recovery?.score ?? 0) < 90,
    generate: (ctx) => ({
      id: 'recovery-good',
      text: `${ctx.metrics?.recovery?.label || 'Recovery'} at ${ctx.metrics!.recovery!.score}. Good day for steady effort.`,
      sentiment: 'positive',
      metric: 'recovery',
      learnMoreContext: "My recovery is good today. What activities are appropriate?",
    }),
  },
  {
    id: 'recovery-low',
    priority: 20,
    condition: (ctx) => ctx.metrics?.recovery != null && ctx.metrics.recovery.score <= 30,
    generate: (ctx) => ({
      id: 'recovery-low',
      text: `Low energy today (${ctx.metrics!.recovery!.score}). Listen to your body.`,
      sentiment: 'attention',
      metric: 'recovery',
      learnMoreContext: "My recovery is low today. What should I do to recover?",
    }),
  },
  {
    id: 'sleep-short',
    priority: 20,
    condition: (ctx) => ctx.metrics?.sleep != null && ctx.metrics.sleep.lastNightHours < 6,
    generate: (ctx) => ({
      id: 'sleep-short',
      text: `Short night (${ctx.metrics!.sleep!.lastNightHours}h). Go easy on yourself today.`,
      sentiment: 'attention',
      metric: 'sleep',
      learnMoreContext: "I didn't sleep well last night. How should I adjust my day?",
    }),
  },
  {
    id: 'sleep-great',
    priority: 25,
    condition: (ctx) => ctx.metrics?.sleep != null && ctx.metrics.sleep.lastNightHours >= 7.5 && ctx.metrics.sleep.quality === 'excellent',
    generate: (ctx) => ({
      id: 'sleep-great',
      text: `Great sleep last night (${ctx.metrics!.sleep!.lastNightHours}h, excellent quality).`,
      sentiment: 'positive',
      metric: 'sleep',
      learnMoreContext: "I slept great last night. What factors contribute to excellent sleep?",
    }),
  },
  {
    id: 'stress-high',
    priority: 20,
    condition: (ctx) => ctx.metrics?.stress?.category === 'high',
    generate: () => ({
      id: 'stress-high',
      text: "Stress elevated today. Time for a breather?",
      sentiment: 'attention',
      metric: 'stress',
      learnMoreContext: "My stress levels are high. What are some quick ways to reduce stress?",
    }),
  },
  {
    id: 'stress-low',
    priority: 25,
    condition: (ctx) => ctx.metrics?.stress?.category === 'rest',
    generate: () => ({
      id: 'stress-low',
      text: "Stress levels are calm today. Enjoy the balance.",
      sentiment: 'positive',
      metric: 'stress',
      learnMoreContext: "My stress is low today. How can I maintain this state?",
    }),
  },

  // === Steps achievements ===
  {
    id: 'steps-10k',
    priority: 25,
    condition: (ctx) => (ctx.metrics?.steps?.today ?? 0) >= 10000,
    generate: (ctx) => ({
      id: 'steps-10k',
      text: `${ctx.metrics!.steps!.today.toLocaleString()} steps—you hit 10K today!`,
      sentiment: 'positive',
      metric: 'steps',
      learnMoreContext: "I hit 10,000 steps today! What are the health benefits?",
    }),
  },

  // === Fallback insights ===
  {
    id: 'has-data',
    priority: 100,
    condition: (ctx) => ctx.metrics != null && Object.keys(ctx.metrics).length > 1,
    generate: () => ({
      id: 'has-data',
      text: "Your data is syncing. Check back for personalized insights.",
      sentiment: 'neutral',
      learnMoreContext: "How do you generate insights from my health data?",
    }),
  },
  {
    id: 'fallback',
    priority: 999,
    condition: () => true,
    generate: () => ({
      id: 'fallback',
      text: "Keep checking in to unlock personalized insights.",
      sentiment: 'neutral',
      learnMoreContext: "How can I get more personalized health insights?",
    }),
  },
];

/**
 * Generate the daily insight based on current metrics and trends
 * Returns the highest priority matching insight
 */
export function generateDailyInsight(
  metrics: HealthMetrics | null,
  trends: MetricTrends | null,
  streak: number,
  daysOnPlatform: number
): DailyInsight {
  const context: InsightContext = {
    metrics,
    trends,
    streak,
    daysOnPlatform,
  };

  // Sort rules by priority and find first matching
  const sortedRules = [...INSIGHT_RULES].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    try {
      if (rule.condition(context)) {
        return rule.generate(context);
      }
    } catch (e) {
      // Skip rules that throw errors (missing data)
      console.warn(`Insight rule ${rule.id} threw error:`, e);
    }
  }

  // Should never reach here due to fallback, but just in case
  return {
    id: 'error-fallback',
    text: "Keep checking in to unlock personalized insights.",
    sentiment: 'neutral',
  };
}

/**
 * Get multiple relevant insights (for future use in a feed)
 */
export function generateMultipleInsights(
  metrics: HealthMetrics | null,
  trends: MetricTrends | null,
  streak: number,
  daysOnPlatform: number,
  limit = 3
): DailyInsight[] {
  const context: InsightContext = {
    metrics,
    trends,
    streak,
    daysOnPlatform,
  };

  const insights: DailyInsight[] = [];
  const sortedRules = [...INSIGHT_RULES].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    if (insights.length >= limit) break;

    try {
      if (rule.condition(context)) {
        const insight = rule.generate(context);
        // Avoid duplicate metric insights
        if (!insights.some(i => i.metric && i.metric === insight.metric)) {
          insights.push(insight);
        }
      }
    } catch (e) {
      // Skip rules that throw errors
    }
  }

  return insights;
}
