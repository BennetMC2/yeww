/**
 * Context-aware check-in question generation
 * Generates personalized questions and response options based on health data
 */

import { HealthMetrics } from '@/types';

export interface CheckInOption {
  label: string;
  value: string;
  emoji?: string;
}

export interface CheckInContext {
  question: string;
  options: CheckInOption[];
  contextType: string; // What triggered this context
}

interface CheckInRule {
  id: string;
  priority: number;
  condition: (ctx: CheckInInput) => boolean;
  generate: (ctx: CheckInInput) => CheckInContext;
}

interface CheckInInput {
  metrics: HealthMetrics | null;
  streak: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  daysSinceLastCheckIn: number | null;
}

const CHECK_IN_RULES: CheckInRule[] = [
  // === Streak milestones ===
  {
    id: 'streak-7',
    priority: 1,
    condition: (ctx) => ctx.streak === 7,
    generate: () => ({
      question: "Day 7! How's the momentum?",
      options: [
        { label: 'Strong', value: 'strong', emoji: '💪' },
        { label: 'Building', value: 'building', emoji: '📈' },
        { label: 'Wavering', value: 'wavering', emoji: '🤔' },
      ],
      contextType: 'streak-milestone',
    }),
  },
  {
    id: 'streak-14',
    priority: 1,
    condition: (ctx) => ctx.streak === 14,
    generate: () => ({
      question: "Two weeks in! How are you feeling about your progress?",
      options: [
        { label: 'Great', value: 'great', emoji: '🎉' },
        { label: 'Steady', value: 'steady', emoji: '✨' },
        { label: 'Mixed', value: 'mixed', emoji: '🤷' },
      ],
      contextType: 'streak-milestone',
    }),
  },

  // === Recovery-based ===
  {
    id: 'recovery-high',
    priority: 10,
    condition: (ctx) => (ctx.metrics?.recovery?.score ?? 0) >= 90,
    generate: (ctx) => ({
      question: `${ctx.metrics?.recovery?.label || 'Recovery'} at ${ctx.metrics!.recovery!.score}. Feeling energized?`,
      options: [
        { label: 'Energized', value: 'energized', emoji: '⚡' },
        { label: 'Normal', value: 'normal', emoji: '😊' },
        { label: 'Tired', value: 'tired', emoji: '😴' },
      ],
      contextType: 'recovery-high',
    }),
  },
  {
    id: 'recovery-moderate',
    priority: 15,
    condition: (ctx) => (ctx.metrics?.recovery?.score ?? 0) >= 50 && (ctx.metrics?.recovery?.score ?? 0) < 90,
    generate: (ctx) => ({
      question: `${ctx.metrics?.recovery?.label || 'Recovery'} at ${ctx.metrics!.recovery!.score}. How's your energy?`,
      options: [
        { label: 'Good', value: 'good', emoji: '👍' },
        { label: 'Okay', value: 'okay', emoji: '😐' },
        { label: 'Low', value: 'low', emoji: '😔' },
      ],
      contextType: 'recovery-moderate',
    }),
  },
  {
    id: 'recovery-low',
    priority: 10,
    condition: (ctx) => ctx.metrics?.recovery != null && ctx.metrics.recovery.score < 50,
    generate: (ctx) => ({
      question: `${ctx.metrics?.recovery?.label || 'Recovery'} is low (${ctx.metrics!.recovery!.score}). How are you holding up?`,
      options: [
        { label: 'Managing', value: 'managing', emoji: '💪' },
        { label: 'Struggling', value: 'struggling', emoji: '😓' },
        { label: 'Need rest', value: 'need-rest', emoji: '🛌' },
      ],
      contextType: 'recovery-low',
    }),
  },

  // === Sleep-based ===
  {
    id: 'sleep-poor',
    priority: 10,
    condition: (ctx) => ctx.metrics?.sleep != null && ctx.metrics.sleep.lastNightHours < 6,
    generate: (ctx) => ({
      question: `Rough night (${ctx.metrics!.sleep!.lastNightHours}h). How are you holding up?`,
      options: [
        { label: 'Managing', value: 'managing', emoji: '💪' },
        { label: 'Struggling', value: 'struggling', emoji: '😓' },
        { label: 'Need coffee', value: 'need-coffee', emoji: '☕' },
      ],
      contextType: 'sleep-poor',
    }),
  },
  {
    id: 'sleep-great',
    priority: 15,
    condition: (ctx) => ctx.metrics?.sleep != null && ctx.metrics.sleep.lastNightHours >= 7.5 && ctx.metrics.sleep.quality === 'excellent',
    generate: (ctx) => ({
      question: `Great sleep (${ctx.metrics!.sleep!.lastNightHours}h). Feeling refreshed?`,
      options: [
        { label: 'Refreshed', value: 'refreshed', emoji: '🌟' },
        { label: 'Pretty good', value: 'pretty-good', emoji: '😊' },
        { label: 'Still tired', value: 'still-tired', emoji: '🥱' },
      ],
      contextType: 'sleep-great',
    }),
  },

  // === Stress-based ===
  {
    id: 'stress-high',
    priority: 10,
    condition: (ctx) => ctx.metrics?.stress?.category === 'high',
    generate: () => ({
      question: "Stress is elevated today. How's your head?",
      options: [
        { label: 'Clear', value: 'clear', emoji: '🧘' },
        { label: 'Foggy', value: 'foggy', emoji: '🌫️' },
        { label: 'Overwhelmed', value: 'overwhelmed', emoji: '😰' },
      ],
      contextType: 'stress-high',
    }),
  },

  // === Return after absence ===
  {
    id: 'returning-user',
    priority: 5,
    condition: (ctx) => ctx.daysSinceLastCheckIn != null && ctx.daysSinceLastCheckIn >= 3,
    generate: () => ({
      question: "Good to see you back! How are things?",
      options: [
        { label: 'Good', value: 'good', emoji: '😊' },
        { label: 'Busy', value: 'busy', emoji: '🏃' },
        { label: 'Rough', value: 'rough', emoji: '😔' },
      ],
      contextType: 'returning',
    }),
  },

  // === Time of day defaults ===
  {
    id: 'morning',
    priority: 50,
    condition: (ctx) => ctx.timeOfDay === 'morning',
    generate: () => ({
      question: "Good morning! How are you starting the day?",
      options: [
        { label: 'Energized', value: 'energized', emoji: '⚡' },
        { label: 'Okay', value: 'okay', emoji: '😊' },
        { label: 'Groggy', value: 'groggy', emoji: '😴' },
      ],
      contextType: 'time-morning',
    }),
  },
  {
    id: 'evening',
    priority: 50,
    condition: (ctx) => ctx.timeOfDay === 'evening' || ctx.timeOfDay === 'night',
    generate: () => ({
      question: "How was your day?",
      options: [
        { label: 'Great', value: 'great', emoji: '🌟' },
        { label: 'Okay', value: 'okay', emoji: '😊' },
        { label: 'Tough', value: 'tough', emoji: '😓' },
      ],
      contextType: 'time-evening',
    }),
  },

  // === Default fallback ===
  {
    id: 'default',
    priority: 100,
    condition: () => true,
    generate: () => ({
      question: "How's your energy today?",
      options: [
        { label: 'High', value: 'high', emoji: '⚡' },
        { label: 'Medium', value: 'medium', emoji: '😊' },
        { label: 'Low', value: 'low', emoji: '😔' },
      ],
      contextType: 'default',
    }),
  },
];

/**
 * Get current time of day
 */
export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Calculate days since last check-in
 */
export function getDaysSinceLastCheckIn(lastCheckIn: string | null): number | null {
  if (!lastCheckIn) return null;

  const last = new Date(lastCheckIn);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Generate context-aware check-in question and options
 */
export function generateCheckInContext(
  metrics: HealthMetrics | null,
  streak: number,
  lastCheckIn: string | null
): CheckInContext {
  const input: CheckInInput = {
    metrics,
    streak,
    timeOfDay: getTimeOfDay(),
    daysSinceLastCheckIn: getDaysSinceLastCheckIn(lastCheckIn),
  };

  // Sort rules by priority and find first matching
  const sortedRules = [...CHECK_IN_RULES].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    try {
      if (rule.condition(input)) {
        return rule.generate(input);
      }
    } catch (e) {
      // Skip rules that throw errors
      console.warn(`Check-in rule ${rule.id} threw error:`, e);
    }
  }

  // Should never reach here due to fallback
  return {
    question: "How's your energy today?",
    options: [
      { label: 'High', value: 'high', emoji: '⚡' },
      { label: 'Medium', value: 'medium', emoji: '😊' },
      { label: 'Low', value: 'low', emoji: '😔' },
    ],
    contextType: 'error-fallback',
  };
}

/**
 * Get the response message based on check-in answer
 */
export function getCheckInResponse(value: string, contextType: string): string {
  // Positive responses
  if (['energized', 'strong', 'great', 'refreshed', 'good', 'high'].includes(value)) {
    const responses = [
      "That's great to hear! Make the most of it.",
      "Awesome! Keep that energy going.",
      "Love to hear it! You're on a roll.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Neutral responses
  if (['okay', 'normal', 'building', 'steady', 'medium', 'pretty-good', 'managing', 'busy'].includes(value)) {
    const responses = [
      "Thanks for checking in. I'm here if you want to talk more.",
      "Steady days matter too. Keep it up!",
      "Every day counts. You're doing great.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Low energy / struggling responses
  if (['tired', 'low', 'struggling', 'wavering', 'groggy', 'foggy', 'still-tired', 'need-coffee', 'rough', 'tough'].includes(value)) {
    const responses = [
      "Thanks for being honest. Take it easy today if you can.",
      "Listen to your body. Rest is productive too.",
      "I hear you. Let's focus on small wins today.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Need rest / overwhelmed
  if (['need-rest', 'overwhelmed', 'mixed'].includes(value)) {
    const responses = [
      "That's okay. Recovery is part of the journey.",
      "Take the time you need. I'm here when you're ready.",
      "Thanks for sharing. Sometimes we just need a reset.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Default
  return "Thanks for checking in. I'm here if you want to talk more.";
}
