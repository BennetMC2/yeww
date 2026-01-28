import { HealthMetrics } from '@/types';

/**
 * HRV & Recovery Knowledge section
 * Deep domain expertise on HRV interpretation and recovery guidance
 */
export function buildHRVKnowledgeSection(): string {
  return `<hrv_knowledge>
HRV & RECOVERY: YOUR NERVOUS SYSTEM'S STATUS

WHAT HRV IS:
Heart Rate Variability measures the variation in time between heartbeats (in milliseconds). Despite a steady pulse, there are ms-level variations between beats. This reflects your autonomic nervous system state.

- Higher HRV = More parasympathetic ("rest and digest") = Better recovered, more adaptable
- Lower HRV = More sympathetic ("fight or flight") = Stressed, fatigued, or recovering

WHY IT MATTERS:
- Window into your nervous system's state
- Often drops 1-3 days BEFORE you feel sick
- Shows training readiness and accumulated stress
- Predictor of cardiovascular health and mortality
- Changes before you consciously feel "off"

CRITICAL INSIGHT: Individual baseline varies ENORMOUSLY. Compare to YOUR average, not population norms. Someone with baseline 45ms at 50ms is doing great; someone with baseline 90ms at 50ms is concerning.

ROUGH RANGES BY AGE (RMSSD in ms):
- 20s: Average 55-105, varies widely
- 30s: Average 45-85
- 40s: Average 35-60
- 50s: Average 30-50
- 60s: Average 25-45

But ~25% of HRV is genetic. Lifelong athletes maintain 20-30% higher than sedentary peers at any age.

NORMAL FLUCTUATIONS:
- 10-15% day-to-day variation is completely normal
- Look at 7-day rolling average for meaningful trends
- One low day = noise. Several low days = signal.

WHAT AFFECTS HRV:

Tanks it:
- Alcohol (biggest impact—2-5 days to recover, even from moderate drinking)
- Poor sleep (direct relationship)
- Intense exercise (acute drop is NORMAL, recovers in 24-48h)
- Illness (often drops before symptoms appear)
- Chronic stress
- Dehydration
- Late heavy meals

Improves it:
- Quality sleep (most powerful lever, 3-7 days to see change)
- Consistent aerobic exercise (8-12 weeks for significant gains)
- Reducing alcohol (2-3 weeks for improvement)
- HRV biofeedback/slow breathing (1-2 weeks)
- Stress management

THE ALCOHOL EFFECT (Important):
Alcohol is the SINGLE BIGGEST negative impact on next-day HRV:
- 8% average recovery drop after drinking
- Effects can last 4-5 days after heavy drinking
- Being fit does NOT protect against this
- Even 1-2 drinks can show impact

RECOVERY/READINESS SCORES:

WHOOP Recovery (0-100%):
- <33%: Not ready for hard training
- 34-66%: Train but listen to your body
- >67%: Good to push

Oura Readiness (0-100):
- <70: Take it easy
- 70-84: Moderate activity
- 85+: Optimal

IMPORTANT: These are proprietary black boxes. Use as GUIDES, not commands. If score says push but you feel exhausted—trust your body.

INTERPRETING DROPS:

Single day drop: Likely noise. Check: late meal? Alcohol? Poor sleep? If you feel fine, probably fine.

Several days low: Body is telling you something. Possibilities:
- Accumulated training stress
- Coming down with something
- Life stress catching up
- Need more recovery

Chronic decline over weeks: Red flag for:
- Overtraining
- Chronic stress
- Underlying health issue
- Worth addressing

WHAT ACTUALLY IMPROVES HRV:
1. Sleep optimization (most powerful—3-7 days)
2. Reduce/eliminate alcohol (2-3 weeks)
3. Consistent aerobic exercise (8-12 weeks for 15-30% gains)
4. HRV biofeedback: 6 breaths/min breathing (1-2 weeks)
5. Omega-3s (1-2g EPA/DHA daily—modest effect)

COMMON MISCONCEPTIONS:

"My HRV is lower than my friend's"
→ Irrelevant. Compare to YOUR baseline only.

"Low HRV = don't train"
→ One day isn't enough data. Consider the trend AND how you feel.

"I can compare WHOOP to Oura numbers"
→ No—they measure differently. Track trends on ONE device.

"Higher is always better"
→ Consistency within YOUR range matters more than chasing high numbers.

WHEN TO SURFACE THIS:
Good moments:
- User shares HRV or recovery data
- User mentions feeling run down
- User has been training hard
- User mentions alcohol
- Declining trend over days

Bad moments:
- One slightly low reading (don't overreact)
- User is already anxious about metrics
- Already discussed recently

HOW TO TALK ABOUT IT:
Do say:
- "Compare to YOUR baseline"
- "One day is noise, trends matter"
- "How do you actually feel?"
- "Sleep and alcohol are the biggest levers"

Don't say:
- "Your HRV is bad"
- "You're overtrained"
- "You should/shouldn't train" (give info, let them decide)
- Technical jargon without explanation

MEDICAL BOUNDARIES:
- Don't diagnose heart conditions
- Consistently low HRV with concerning symptoms = see doctor
- Chest pain, palpitations, breathing issues = refer to professional
</hrv_knowledge>`;
}

/**
 * Build HRV-specific insights based on user's metrics
 */
export function buildHRVInsights(metrics?: HealthMetrics): string {
  if (!metrics?.hrv) {
    return '';
  }

  const hrv = metrics.hrv;
  const insights: string[] = [];

  // Calculate percent difference from baseline
  const percentDiff = Math.round(((hrv.current - hrv.baseline) / hrv.baseline) * 100);

  if (percentDiff <= -20) {
    insights.push(`Current HRV (${hrv.current}ms) is ${Math.abs(percentDiff)}% below baseline (${hrv.baseline}ms)—significant dip worth investigating.`);
  } else if (percentDiff <= -10) {
    insights.push(`Current HRV (${hrv.current}ms) is ${Math.abs(percentDiff)}% below baseline—notable but not alarming. Check sleep, alcohol, stress.`);
  } else if (percentDiff >= 10) {
    insights.push(`Current HRV (${hrv.current}ms) is ${percentDiff}% above baseline—looking well recovered.`);
  }

  // Trend insight
  if (hrv.trend === 'down') {
    insights.push('HRV trending down—body may need more recovery.');
  } else if (hrv.trend === 'up') {
    insights.push('HRV trending up—positive sign of adaptation/recovery.');
  }

  if (insights.length === 0) {
    return '';
  }

  return `<hrv_context>
User's HRV status:
${insights.join('\n')}

Remember: Single readings are noise. Look at trends. Always consider how they actually feel.
</hrv_context>`;
}

/**
 * Build recovery-specific insights
 */
export function buildRecoveryInsights(metrics?: HealthMetrics): string {
  if (!metrics?.recovery) {
    return '';
  }

  const recovery = metrics.recovery;
  let insight = '';

  if (recovery.score < 33) {
    insight = `Recovery score of ${recovery.score}% (${recovery.status}) suggests body needs rest. But remember—scores are guides, not commands. How do they feel?`;
  } else if (recovery.score < 67) {
    insight = `Recovery at ${recovery.score}% (${recovery.status})—moderate zone. Can train but worth listening to body signals.`;
  } else {
    insight = `Recovery at ${recovery.score}% (${recovery.status})—body appears ready for training load.`;
  }

  return `<recovery_context>
${insight}
</recovery_context>`;
}
