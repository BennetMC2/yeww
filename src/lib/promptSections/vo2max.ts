import { HealthMetrics } from '@/types';

/**
 * VO2 Max Knowledge section
 * Deep domain expertise on VO2 max interpretation and guidance
 */
export function buildVO2MaxKnowledgeSection(): string {
  return `<vo2max_knowledge>
VO2 MAX: THE LONGEVITY METRIC

WHAT IT IS:
VO2 max measures the maximum oxygen your body can use during intense exercise (ml/kg/min). It's your aerobic ceiling—how much work your cardiovascular system can support.

WHY IT MATTERS MORE THAN ALMOST ANYTHING:
- Strongest predictor of all-cause mortality—stronger than smoking, diabetes, hypertension, or cholesterol
- Low → Average fitness = 50% reduction in mortality risk
- Low → Above average = ~70% reduction in mortality risk
- Each 1 MET increase (~3.5 ml/kg/min) = 13-15% mortality reduction
- No upper limit to benefit—the fitter, the better, with no harmful ceiling

INTERPRETING NUMBERS BY AGE:

Men (ml/kg/min):
- Age 30-39: Poor <35, Fair 35-40, Good 41-49, Excellent 50-58, Elite >58
- Age 40-49: Poor <32, Fair 32-37, Good 38-45, Excellent 46-54, Elite >54
- Age 50-59: Poor <28, Fair 28-33, Good 34-41, Excellent 42-50, Elite >50

Women (ml/kg/min):
- Age 30-39: Poor <28, Fair 28-33, Good 34-42, Excellent 43-50, Elite >50
- Age 40-49: Poor <25, Fair 25-30, Good 31-38, Excellent 39-46, Elite >46
- Age 50-59: Poor <22, Fair 22-27, Good 28-35, Excellent 36-43, Elite >43

Key context:
- Men typically score 15-30% higher than women (body composition)
- VO2 max peaks around age 30, declines ~10% per decade
- Regular training cuts that decline in half
- Biggest ROI: going from lowest category to second-lowest

SMARTWATCH ACCURACY:

Garmin:
- ~5-7% error on average
- More accurate for moderately fit (within 2-3%)
- Underestimates highly fit athletes by ~10%
- Good for tracking TRENDS over weeks/months

Apple Watch:
- ~13-16% error (less accurate than Garmin)
- Only works for outdoor walks/runs/hikes (20+ min)
- Underestimates in fit individuals
- Still useful for trend tracking

Key insight: Day-to-day fluctuations are noise. Real VO2 max doesn't change overnight. If user's watch shows a drop after a long run, the watch is confused by cardiac drift—reassure them.

HOW TO IMPROVE (The 80/20 Protocol):

Split cardio time:
- 80% Zone 2: Easy, conversational pace. Builds aerobic base, capillary density, mitochondrial efficiency.
- 20% High-intensity: VO2 max intervals. Raises the ceiling.

Zone 2 training:
- 60-70% max HR, can hold conversation
- 3-4 sessions/week, 45-90 minutes each
- Builds foundation but won't maximize VO2 max alone (~40% don't respond to Zone 2 only)

VO2 Max intervals (4x4 Protocol):
- 4 min max sustainable effort
- 4 min recovery
- Repeat 4-6 times
- 1x per week
- Use RPE over heart rate (HR varies 10+ bpm workout to workout)

Timeline for improvement:
- 4-6 weeks: First noticeable gains
- 8-12 weeks: 5-10% improvement
- 3-6 months: 10-20% improvement
- The fitter you are, the slower gains come

Loss is faster than gain: ~5% drop in 2 weeks of no training.

COMMON MYTHS TO CORRECT:

1. "Higher VO2 max = better performance"
   Reality: It's your ceiling, not your performance. Economy and lactate threshold matter more for racing.

2. "It's all genetic"
   Reality: 50-90% genetic, but everyone improves with training. Less fit = more room to grow.

3. "My watch says it dropped after a long run"
   Reality: Watch confused by cardiac drift. Look at trends over weeks, not daily readings.

4. "Zone 2 is all I need"
   Reality: ~40% don't improve VO2 max with Zone 2 alone. Need some high-intensity work.

5. "More HIIT is better"
   Reality: Without aerobic base, too much intensity = burnout. 80/20 split works for a reason.

WHEN TO SURFACE THIS KNOWLEDGE:

Good moments:
- User mentions cardio, running, cycling, endurance goals
- User asks about longevity, living longer, healthspan
- User shares VO2 max data from their watch
- User only does strength training (gentle nudge)
- User asks "what's the best exercise?"

Bad moments:
- User is venting (support first, data later)
- User is injured (don't push cardio)
- Already discussed VO2 max recently

HOW TO TALK ABOUT IT:

Do say:
- "VO2 max is basically your aerobic ceiling"
- "It's the strongest predictor of how long you'll live"
- "Even going from low to average cuts mortality risk in half"
- "Your watch is good for tracking trends over time"
- "80% easy, 20% hard seems to be the sweet spot"

Don't say:
- Clinical jargon ("cardiorespiratory fitness optimization")
- Prescriptive commands ("You should do more HIIT")
- Anxiety-inducing comparisons to elite athletes
- Guaranteed timelines ("You'll improve 10% in 8 weeks")

MEDICAL BOUNDARIES:
- Chest pain, breathing issues, dizziness during exercise = see a doctor
- Don't diagnose heart/lung conditions from low VO2 max
- Don't prescribe training plans for medical conditions
- For formal VO2 max testing, refer to sports medicine clinic
</vo2max_knowledge>`;
}

/**
 * Build VO2 max specific insights based on user's metrics
 */
export function buildVO2MaxInsights(metrics?: HealthMetrics): string {
  if (!metrics?.vo2Max) {
    return '';
  }

  const vo2 = metrics.vo2Max;

  // Determine general fitness category (simplified, would need age/sex for accuracy)
  let category = '';
  let insight = '';

  if (vo2 < 30) {
    category = 'below average';
    insight = 'Good news: this is where improvements have the biggest payoff. Even modest gains here significantly reduce mortality risk.';
  } else if (vo2 < 40) {
    category = 'average';
    insight = 'Solid foundation. Consistent training could push you into above-average territory, which comes with meaningful longevity benefits.';
  } else if (vo2 < 50) {
    category = 'above average';
    insight = 'Strong aerobic fitness. You\'re already getting significant longevity benefits. Gains will come slower but still matter.';
  } else {
    category = 'excellent';
    insight = 'Elite-level cardio fitness. Maintenance is key—even a few weeks off can drop this quickly.';
  }

  return `<vo2max_context>
User's VO2 max: ${vo2} ml/kg/min (${category} range)
${insight}

Remember: Watch estimates are best for tracking trends. Don't overreact to day-to-day changes.
</vo2max_context>`;
}
