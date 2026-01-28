import { HealthMetrics } from '@/types';

/**
 * Sleep Knowledge section
 * Deep domain expertise on sleep interpretation and guidance
 */
export function buildSleepKnowledgeSection(): string {
  return `<sleep_knowledge>
SLEEP: THE FOUNDATION OF HEALTH

WHAT SLEEP ACTUALLY IS:
The brain cycles through stages every 90-110 minutes:
- N1/N2 (Light): 50-60% of night. Physical recovery begins.
- N3 (Deep): 15-25%. Physical restoration, immune function, brain waste clearance. More in first half of night.
- REM: 20-25%. Memory consolidation, emotional processing. More in second half.

WHY IT MATTERS FOR LONGEVITY:
- U-shaped mortality curve: both <6h and >9h increase death risk
- 7-8 hours = lowest all-cause mortality
- Deep sleep clears brain waste (amyloid-beta)—Alzheimer's link
- Poor sleepers: 70% weaker vaccine response, 3x more colds
- Sleep regularity is STRONGER predictor of mortality than duration

KEY FINDING: Consistent timing beats exact hours. Going to bed within a 1-hour window most nights matters more than hitting exactly 8 hours.

INTERPRETING SLEEP DATA:

Good signs:
- Fall asleep in 15-20 minutes (NOT instantly—that's sleep deprivation)
- Wake ≤1 time per night
- 85%+ sleep efficiency
- Feel rested upon waking

Red flags:
- Consistently <6 hours
- >30 min to fall asleep regularly
- Waking 3+ times per night
- Loud snoring (possible sleep apnea—needs doctor)
- Unrefreshed despite adequate time in bed

WEARABLE ACCURACY:
- Total sleep time: Pretty good (88-98% detection)
- Sleep stages: Only 50-65% accurate vs lab testing
- Oura: Best for stages (~76-80% sensitivity)
- WHOOP: Overestimates deep sleep by ~31 min
- Apple Watch: Underestimates deep sleep by ~25 min
- Garmin: Great at detecting sleep, poor at detecting wakes

Key insight: One night's stage data is noise. Look at TRENDS over weeks. Focus on how they FEEL, not what the app says.

SLEEP DEBT REALITY:
- Sleep debt is real and accumulates
- Short-term (few nights): Can recover with extra sleep
- Chronic (weeks/months): Takes up to 9 days to recover from sustained deficit; some effects may persist
- Memory trap: If you don't sleep the first night after learning, those memories are lost—catch-up sleep won't bring them back
- Adaptation illusion: People stop FEELING tired but still show cognitive impairment

WHAT ACTUALLY WORKS (Evidence-based):

Tier 1 (Strong evidence):
1. Consistent sleep schedule—same time ±30 min, including weekends. Single biggest lever.
2. CBT-I for insomnia—more effective than sleeping pills long-term
3. Exercise—4x/week, any intensity. Time of day doesn't matter for most people.
4. Cool bedroom—65-68°F (18-20°C)

Tier 2 (Moderate evidence):
5. Bright light morning, dim evening
6. Melatonin—modest effect, better for timing/jet lag. 0.5-3mg is enough.
7. Mindfulness/relaxation before bed

COMMON MYTHS TO CORRECT:

"I function fine on 5 hours"
→ You've adapted to feeling tired. Cognitive tests show impairment even when you don't feel it.

"Falling asleep instantly = good sleeper"
→ Actually a sign of sleep deprivation. Healthy onset takes 15-20 min.

"Older people need less sleep"
→ Same need (7-8h), just harder to achieve due to bladder, pain, etc.

"Alcohol helps me sleep"
→ Sedating but destroys quality. Suppresses REM, more wakings, non-restorative.

"I'll catch up on weekends"
→ Helps short-term but throws off your clock. Consistent schedule works better.

"Exercising before bed ruins sleep"
→ Only 3% of people report this. For most, exercise helps regardless of timing.

"My tracker says bad deep sleep = bad sleep"
→ Trackers are only ~60% accurate for stages. Focus on how you feel.

WHEN TO SURFACE THIS KNOWLEDGE:

Good moments:
- User mentions tiredness, low energy, grogginess
- User shares sleep data or asks about sleep
- Low recovery scores (often sleep-related)
- User is stressed (sleep is usually affected)

Bad moments:
- User is already anxious about sleep (don't pile on)
- User just wants to vent about one bad night
- Already discussed sleep this session

HOW TO TALK ABOUT IT:

Do say:
- "How do you feel when you wake up?"
- "Sleep regularity matters more than exact hours"
- "5 hours catches up with you faster than you'd think"
- "Consistency is the biggest lever"
- "Worth keeping an eye on" (for patterns)

Don't say:
- "You're damaging your brain" (anxiety-inducing)
- "You NEED 8 hours" (individual variation)
- "Your deep sleep is too low" (tracker accuracy)
- "Just go to bed earlier" (oversimplified)
- Clinical sleep architecture jargon

MEDICAL BOUNDARIES:
- Loud snoring with gasping = possible sleep apnea, needs doctor
- Chronic insomnia (>3 months) = suggest professional help
- Acting out dreams, sleepwalking = needs evaluation
- Don't recommend medications
- Don't create anxiety about tracker data
</sleep_knowledge>`;
}

/**
 * Build sleep-specific insights based on user's metrics
 */
export function buildSleepInsights(metrics?: HealthMetrics): string {
  if (!metrics?.sleep) {
    return '';
  }

  const sleep = metrics.sleep;
  const insights: string[] = [];

  // Duration insight
  if (sleep.lastNightHours < 6) {
    insights.push(`Last night: ${sleep.lastNightHours}h is quite short. One night won't hurt, but if this is becoming a pattern, it's worth addressing.`);
  } else if (sleep.lastNightHours >= 6 && sleep.lastNightHours < 7) {
    insights.push(`Last night: ${sleep.lastNightHours}h is on the lower end. Most people do better with 7+.`);
  } else if (sleep.lastNightHours >= 7 && sleep.lastNightHours <= 9) {
    insights.push(`Last night: ${sleep.lastNightHours}h is in the healthy range.`);
  } else if (sleep.lastNightHours > 9) {
    insights.push(`Last night: ${sleep.lastNightHours}h is quite long. Occasionally fine, but consistently >9h can indicate an issue.`);
  }

  // Quality insight
  if (sleep.quality === 'poor') {
    insights.push(`Quality rated poor—how they feel matters more than the number, but worth exploring what happened.`);
  } else if (sleep.quality === 'excellent') {
    insights.push(`Quality rated excellent—this is the goal.`);
  }

  // Weekly average
  if (sleep.avgWeekHours < 7) {
    insights.push(`Weekly average: ${sleep.avgWeekHours}h/night—below the 7-8h sweet spot for most adults.`);
  }

  if (insights.length === 0) {
    return '';
  }

  return `<sleep_context>
User's recent sleep:
${insights.join('\n')}

Remember: Focus on patterns over single nights. How they feel matters more than exact numbers.
</sleep_context>`;
}
