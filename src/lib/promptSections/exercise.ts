import { HealthMetrics } from '@/types';

/**
 * Exercise & Training Knowledge section
 */
export function buildExerciseKnowledgeSection(): string {
  return `<exercise_knowledge>
EXERCISE & TRAINING: STRESS + RECOVERY = ADAPTATION

CORE PRINCIPLE:
Training applies stress. Recovery is when adaptation happens. Without adequate recovery, you break down instead of building up.

THE OVERTRAINING SPECTRUM:
- Acute fatigue: Normal, recovers in hours/1-2 days
- Functional overreaching: Planned hard block, recovers in days/1-2 weeks
- Non-functional overreaching: Unplanned stagnation, 2-4 weeks to recover
- Overtraining Syndrome (OTS): Systemic breakdown, weeks to MONTHS to recover

20-60% of athletes experience OTS at some point.

EARLY WARNING SIGNS OF OVERTRAINING:
- Workouts feel harder than usual at same intensity
- No progress or going backward
- Persistent soreness (>72 hours)
- Elevated resting heart rate (5-10+ bpm above baseline)
- HRV declining over several days
- Sleep problems despite tiredness
- Mood changes, irritability
- Getting sick more often

RED FLAGS (Stop and recover):
- Chronic fatigue that rest doesn't fix
- Depression or loss of motivation
- Performance declining for weeks
- Frequent illness

THE LONGEVITY TRAINING FORMULA:

Zone 2 cardio: 150-180 min/week (3-4 sessions of 45-60 min)
- Builds mitochondrial density
- Foundation for all fitness
- Conversational pace

Strength training: 3x/week
- Preserves muscle (lose 3-8%/decade after 30)
- Maintains bone density
- Critical for aging well

VO2 max intervals: 1x/week
- 4x4 protocol or similar
- Pushes aerobic ceiling
- Where the longevity gains come from

Rest: At least 1 full day/week
- Adaptation happens during rest
- Even elite athletes take rest days

RECOVERY ESSENTIALS:
1. Sleep (7-9 hours)—most powerful recovery tool
2. Adequate protein (1.6-2.2g/kg for active people)
3. Rest days (at least 1/week)
4. Periodization (deload every 4-6 weeks)

WHEN TO PUSH VS REST:

Green light: HRV at baseline, rested, no unusual soreness, motivated
Yellow: HRV slightly low, somewhat tired, mild soreness—train but listen
Red: HRV down multiple days, exhausted, persistent soreness, early illness signs—rest

COMMON MISTAKES:
"More is better" → Adaptation requires recovery
"No pain no gain" → Pain is a warning signal
"Rest days are lazy" → Rest is when you get stronger
"I can train through illness" → You'll make it worse and delay recovery

LIFE STRESS MATTERS:
Training stress + life stress = total stress. High life stress? Reduce training volume. Your nervous system doesn't distinguish sources.
</exercise_knowledge>`;
}

/**
 * Build exercise-specific insights based on user's metrics
 */
export function buildExerciseInsights(metrics?: HealthMetrics): string {
  if (!metrics?.strain && !metrics?.steps) {
    return '';
  }

  const insights: string[] = [];

  if (metrics.strain) {
    if (metrics.strain.score > metrics.strain.weeklyAvg * 1.3) {
      insights.push(`Today's strain (${metrics.strain.score}) is notably higher than your weekly average (${metrics.strain.weeklyAvg})—recovery will be important.`);
    }
  }

  if (metrics.steps) {
    const percentOfAvg = Math.round((metrics.steps.today / metrics.steps.avgDaily) * 100);
    if (percentOfAvg < 50) {
      insights.push(`Steps today (${metrics.steps.today.toLocaleString()}) are well below your average—low activity day.`);
    } else if (percentOfAvg > 150) {
      insights.push(`Steps today (${metrics.steps.today.toLocaleString()}) are well above average—active day.`);
    }
  }

  if (insights.length === 0) return '';

  return `<exercise_context>
${insights.join('\n')}
</exercise_context>`;
}
