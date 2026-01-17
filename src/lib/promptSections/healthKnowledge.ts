import { HealthMetrics } from '@/types';

/**
 * Health Domain Knowledge section
 * Teaches the AI how to interpret health metrics
 */
export function buildHealthKnowledgeSection(): string {
  return `<health_knowledge>
HOW TO INTERPRET HEALTH METRICS:

HEART RATE VARIABILITY (HRV):
- HRV measures variation between heartbeats—higher generally means better recovery
- Personal baseline matters MORE than absolute numbers (40ms for one person = 80ms for another)
- Normal range: 20-100ms, but varies hugely by age, fitness, genetics
- What affects HRV negatively: poor sleep, alcohol, stress, illness, overtraining, dehydration
- What affects HRV positively: good sleep, relaxation, fitness, proper recovery
- Trend matters more than single readings—look for patterns over weeks
- Morning readings (before getting up) are most reliable
- IMPORTANT: Don't alarm users about single low readings—context matters

RESTING HEART RATE (RHR):
- Measured at complete rest, ideally upon waking
- Lower is generally better for cardiovascular health
- Normal: 60-100 bpm; athletes often 40-60 bpm
- Trending UP over days/weeks can indicate: overtraining, illness coming, stress, poor sleep
- Sudden spikes (10+ bpm above baseline): often precedes getting sick
- Use RHR trends to suggest recovery days or flag early warning signs

SLEEP:
- Adults need 7-9 hours; quality matters as much as quantity
- Sleep stages matter:
  - Light sleep: 45-55% of night, physical recovery
  - Deep sleep: 15-25%, crucial for physical restoration, immune function
  - REM sleep: 20-25%, memory consolidation, emotional processing
- What to flag:
  - Consistently under 7 hours
  - Low deep sleep percentage (<15%)
  - High wake time during night
  - Irregular sleep/wake times
- Sleep debt accumulates and takes time to repay
- Timing matters: consistent bedtime often more impactful than total hours

RECOVERY SCORES (Whoop/Oura style):
- Composite of HRV, RHR, sleep, and previous strain
- Low recovery doesn't mean "don't move"—it means avoid high intensity
- False lows: single bad night, alcohol, late dinner, stress
- Use to modulate intensity, not as absolute go/no-go
- Pattern of consistently low recovery = something systemic needs addressing

STRAIN/ACTIVITY:
- Balance strain with recovery—not every day should be max effort
- Progressive overload needs adequate recovery
- High strain + low recovery repeatedly = injury/burnout risk
- Rest days are when adaptation happens

IMPORTANT BOUNDARIES:
- NEVER diagnose conditions or diseases
- NEVER recommend medications or supplements as treatment
- NEVER dismiss symptoms that could be serious (chest pain, shortness of breath, etc.)
- ALWAYS suggest consulting a doctor for: persistent symptoms, concerning trends, anything medical
- Weight/body topics: focus on how they FEEL, not numbers; never shame
</health_knowledge>`;
}

export function buildCurrentMetricsSection(metrics?: HealthMetrics): string {
  if (!metrics) {
    return `<current_health_data>
No health metrics available for this session. Encourage connecting data sources for personalized insights.
</current_health_data>`;
  }

  const sections: string[] = [];

  if (metrics.hrv) {
    const { current, baseline, trend } = metrics.hrv;
    const percentDiff = Math.round(((current - baseline) / baseline) * 100);
    const trendEmoji = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
    sections.push(`HRV: ${current}ms (baseline: ${baseline}ms, ${percentDiff > 0 ? '+' : ''}${percentDiff}% ${trendEmoji})`);
  }

  if (metrics.sleep) {
    const { lastNightHours, quality, avgWeekHours } = metrics.sleep;
    sections.push(`Sleep: ${lastNightHours}hrs last night (${quality} quality, avg ${avgWeekHours}hrs/week)`);
  }

  if (metrics.rhr) {
    const { current, baseline, trend } = metrics.rhr;
    const trendEmoji = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
    sections.push(`RHR: ${current} bpm (baseline: ${baseline}, trend ${trendEmoji})`);
  }

  if (metrics.recovery) {
    const { score, status } = metrics.recovery;
    sections.push(`Recovery: ${score}% (${status})`);
  }

  if (metrics.strain) {
    const { yesterday, weeklyAvg } = metrics.strain;
    sections.push(`Strain: ${yesterday} yesterday (weekly avg: ${weeklyAvg})`);
  }

  if (metrics.steps) {
    const { today, avgDaily } = metrics.steps;
    const percentOfAvg = Math.round((today / avgDaily) * 100);
    sections.push(`Steps: ${today.toLocaleString()} today (${percentOfAvg}% of your ${avgDaily.toLocaleString()} avg)`);
  }

  return `<current_health_data>
${sections.join('\n')}
</current_health_data>`;
}
