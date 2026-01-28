# HRV & Recovery Research Document

> **Purpose**: Comprehensive knowledge base for yeww AI to understand, interpret, and advise on Heart Rate Variability and recovery.

---

## What It Is

**Heart Rate Variability (HRV)** measures the variation in time between consecutive heartbeats. Despite a seemingly steady pulse, there are millisecond-level variations between each beat. This variation reflects the activity of your autonomic nervous system (ANS).

### The Autonomic Nervous System Connection

HRV is created by the interplay between:
- **Sympathetic nervous system** ("fight or flight") - Increases heart rate, decreases variability
- **Parasympathetic nervous system** ("rest and digest") - Slows heart rate, increases variability

**Higher HRV** = Greater parasympathetic activity = Better recovery state, more adaptable
**Lower HRV** = Greater sympathetic dominance = Stress, fatigue, or insufficient recovery

### Why It Matters

- Non-invasive window into autonomic nervous system function
- Predictor of cardiovascular health and all-cause mortality
- Indicator of training readiness and recovery status
- Sensitive to sleep quality, stress, alcohol, illness
- Changes often appear before you "feel" run down

### Key HRV Metrics

| Metric | What It Measures | Notes |
|--------|-----------------|-------|
| **RMSSD** | Root mean square of successive differences | Most common, reflects parasympathetic activity |
| **SDNN** | Standard deviation of NN intervals | Overall HRV, both sympathetic and parasympathetic |
| **HF (High Frequency)** | Power in 0.15-0.4 Hz band | Parasympathetic activity |
| **LF (Low Frequency)** | Power in 0.04-0.15 Hz band | Mix of sympathetic and parasympathetic |

Most wearables report **RMSSD** in milliseconds (ms).

### Sources
- [WHOOP: What is HRV](https://www.whoop.com/us/en/thelocker/heart-rate-variability-hrv/)
- [PMC: HRV Over the Decades](https://pmc.ncbi.nlm.nih.gov/articles/PMC12047215/)
- [Frontiers: HRV and ANS Function](https://www.frontiersin.org/journals/cardiovascular-medicine/articles/10.3389/fcvm.2025.1630668/full)

---

## Key Metrics & Interpretation

### HRV Ranges by Age (RMSSD in ms)

| Age | Low | Average | High | Elite |
|-----|-----|---------|------|-------|
| 20-25 | <40 | 55-105 | >105 | >120 |
| 30-35 | <35 | 45-85 | >85 | >100 |
| 40-45 | <30 | 35-60 | >60 | >80 |
| 50-55 | <25 | 30-50 | >50 | >65 |
| 60-65 | <20 | 25-45 | >45 | >55 |

**Critical insight**: These are population averages. Individual baseline varies enormously due to genetics (~25% heritable), fitness level, and other factors.

### Why Individual Baseline Matters More Than Absolutes

- Someone with a baseline of 45ms seeing 35ms = significant dip worth noting
- Someone with a baseline of 80ms seeing 70ms = normal fluctuation
- **Compare to YOUR average, not population norms**
- 10-15% day-to-day variation is completely normal
- Look at 7-day rolling average for trends

### Age-Related Decline

- HRV peaks in early adulthood (20s)
- Declines with age, marked drop after 40
- Women tend to have slightly lower HRV than men
- Lifelong athletes maintain HRV 20-30% above sedentary peers

### Wearable Accuracy

| Device | Where Measured | Notes |
|--------|---------------|-------|
| **WHOOP** | Deep sleep + last sleep stage | Tends to read higher |
| **Oura** | Average across entire night | More conservative |
| **Garmin** | Morning measurement window | Varies by model |
| **Apple Watch** | Throughout night | Less consistent |

**Key**: Different devices = different numbers. Don't compare across devices. Track trends on one device.

### Recovery/Readiness Scores

**WHOOP Recovery (0-100%)**
- Uses HRV, RHR, respiratory rate, sleep performance
- <33%: Not ready for hard training
- 34-66%: Train but listen to your body
- >67%: Good to push

**Oura Readiness (0-100)**
- Uses HRV, sleep, body temp, activity balance
- <70: Take it easy
- 70-84: Moderate activity
- 85+: Optimal for training

**Important caveat**: These are proprietary black boxes. Algorithms change. Use as guides, not gospel. If score says push but you feel exhausted—listen to your body.

### Sources
- [Oura: Average HRV](https://ouraring.com/blog/average-hrv/)
- [WHOOP: Normal HRV Range](https://www.whoop.com/us/en/thelocker/normal-hrv-range-age-gender/)
- [Elite HRV: Normative Scores](https://elitehrv.com/normal-heart-rate-variability-age-gender)

---

## The Science (Simplified)

### What High HRV Means

High HRV indicates your body is in a parasympathetic-dominant state:
- Well-recovered from previous stress/training
- Ready to adapt to new challenges
- Cardiovascular system is responsive and flexible
- Generally associated with better health outcomes

### What Low HRV Means

Low HRV indicates sympathetic dominance or reduced adaptability:
- Body is under stress (physical, mental, or illness)
- Still recovering from training or life stress
- Potential early warning of illness (often drops before symptoms)
- Chronic low HRV associated with health risks

### HRV and Illness Prediction

One of HRV's most useful features: it often drops 1-3 days BEFORE you feel sick. If HRV crashes unexpectedly, watch for:
- Coming down with something
- Hidden stressor you haven't noticed
- Overtraining accumulation

### The Training Connection

**Acute response (24-48h after hard training)**:
- HRV typically drops after intense exercise
- This is normal and expected
- Shows body is adapting to training stress

**Chronic adaptation (weeks/months)**:
- With proper training and recovery, baseline HRV rises
- Improved parasympathetic tone = better fitness
- If baseline is trending down over weeks = possible overtraining

### Sources
- [Marco Altini: On HRV and Readiness](https://medium.com/@altini_marco/on-heart-rate-variability-hrv-and-readiness-394a499ed05b)
- [TrainingPeaks: How to Interpret HRV](https://www.trainingpeaks.com/blog/how-to-interpret-hrv-training/)

---

## What Affects HRV

### Negative Impacts

| Factor | Effect | Duration |
|--------|--------|----------|
| **Alcohol** | Suppresses parasympathetic, drops HRV significantly | 2-5 days after drinking |
| **Poor sleep** | Directly reduces HRV | Next day, accumulates |
| **Stress** | Chronic stress lowers baseline | Ongoing |
| **Intense exercise** | Acute drop (normal) | 24-48h recovery |
| **Illness** | Sharp drop, often before symptoms | Until recovered |
| **Dehydration** | Reduces HRV | Until rehydrated |
| **Overtraining** | Chronically suppressed HRV | Weeks to recover |
| **Late meals** | Digestion increases sympathetic activity | That night |

### The Alcohol Effect (Important)

Alcohol is the single biggest negative impact on next-day recovery:
- WHOOP data: 8% lower recovery on average after drinking
- Effects can last 4-5 days after a single night of heavy drinking
- Being physically fit does NOT protect against alcohol's effect on HRV
- Even moderate drinking (1-2 drinks) can show impact

### Positive Impacts

| Factor | Effect | Timeline |
|--------|--------|----------|
| **Quality sleep** | Strongest positive factor | 3-7 days to see improvement |
| **Consistent exercise** | Raises baseline HRV | 2-3 weeks initial, 8-12 weeks significant |
| **Reduced alcohol** | Allows recovery | 2-3 weeks for improvement |
| **Stress management** | Reduces sympathetic load | Variable |
| **HRV biofeedback** | Trains parasympathetic response | 1-2 weeks for baseline change |

### Sources
- [WHOOP: How Alcohol Affects the Body](https://www.whoop.com/us/en/thelocker/alcohol-affects-body-hrv-sleep/)
- [PMC: Alcohol and HRV](https://pmc.ncbi.nlm.nih.gov/articles/PMC5878366/)

---

## What Actually Works to Improve HRV

### Tier 1: High Evidence

**1. Optimize Sleep**
- Most powerful lever for HRV improvement
- Quality matters as much as quantity
- Consistent sleep schedule amplifies benefit
- Timeline: 3-7 days to see changes

**2. Reduce/Eliminate Alcohol**
- Even moderate drinking suppresses HRV
- 2-3 weeks abstinence shows clear improvement
- "Just weekends" still impacts weekly HRV trends

**3. Consistent Aerobic Exercise**
- Endurance training raises baseline HRV
- 2-3 weeks for initial adaptation
- 8-12 weeks for significant gains (15-30%)
- Balance with adequate recovery

### Tier 2: Moderate Evidence

**4. HRV Biofeedback / Resonance Breathing**
- Breathing at ~6 breaths/minute (resonance frequency)
- Trains parasympathetic response
- Apps: Elite HRV, Breathe, etc.
- 1-2 weeks for baseline improvements
- Medium effect size in meta-analyses

**5. Cold Exposure**
- Cold showers, cold plunges
- Activates parasympathetic system
- Research is promising but mixed
- Start gradually (cold showers before ice baths)

**6. Omega-3 Supplementation**
- 1-2g EPA/DHA daily
- Reduces inflammation, supports cardiovascular health
- Modest but consistent effect on HRV

### Tier 3: Supportive

**7. Stress Management**
- Meditation, mindfulness
- Reduces chronic sympathetic activation
- Variable individual response

**8. Hydration**
- Dehydration lowers HRV
- Often overlooked simple fix

**9. Avoid Late Heavy Meals**
- Digestion increases sympathetic activity
- Can impact overnight HRV measurement

### Expected Results

With consistent multi-intervention approach:
- 10-30% HRV improvement over 8-12 weeks is realistic
- Most gains come from sleep + exercise + reducing alcohol
- Individual response varies significantly

### Sources
- [PMC: Training Interventions and HRV](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2021.657274/full)
- [PMC: HRV Biofeedback Methods](https://pmc.ncbi.nlm.nih.gov/articles/PMC10412682/)

---

## Common Misconceptions

### "My HRV is lower than my friend's—I'm unhealthy"
**Reality**: Individual baseline varies enormously (25% genetic). Someone with baseline 40ms who's consistent and trending up is healthier than someone at 80ms who's chronically declining.

### "My HRV dropped—I shouldn't exercise today"
**Reality**: A single low reading could be noise, late meal, or dozens of factors. Look at trends. If you feel fine and it's one day, you're probably fine. If it's been low for several days AND you feel off, then rest.

### "Higher is always better"
**Reality**: Abnormally high HRV can sometimes indicate issues (certain arrhythmias, excessive vagal tone). Context matters. Consistent within YOUR range is what matters.

### "HRV tells me exactly how recovered I am"
**Reality**: HRV is one signal among many. It doesn't capture muscle soreness, glycogen depletion, or mental fatigue. Use it alongside how you feel, not instead of.

### "I can compare my WHOOP HRV to my friend's Oura HRV"
**Reality**: Different devices measure differently. WHOOP measures during deep sleep, Oura averages the whole night. Numbers aren't comparable across devices.

---

## Actionable Insights for yeww

### When to Surface HRV Knowledge

**Good triggers:**
- User shares HRV data or recovery score
- User mentions feeling "off" or run down
- User asks about training readiness
- User mentions drinking alcohol
- User has been training hard with no rest
- Pattern of declining HRV over days/weeks

**Bad triggers:**
- User had one slightly low reading (don't overreact)
- User is already anxious about metrics
- Already discussed HRV recently

### Example Conversations

**User shares low HRV:**
> "68ms is below your usual 85ms baseline. A few things to check: How'd you sleep? Any alcohol in the last couple days? Feeling any early cold symptoms? One day isn't a big deal, but if this continues, your body's telling you something."

**User asks about their recovery score:**
> "Recovery scores are useful guides but not gospel truth—they're proprietary algorithms that don't tell you everything. How do YOU feel? If the score says push but your body says rest, trust your body."

**User mentions drinking:**
> "Worth knowing: alcohol is the single biggest tank on next-day HRV. Even a couple drinks can suppress it for 2-3 days. You might feel fine, but your nervous system is still recovering."

**User's HRV trending down over weeks:**
> "Your 7-day average has dropped from 75 to 58 over the past two weeks. That's a meaningful trend. Usually points to: accumulated training stress without enough recovery, life stress piling up, or early signs of getting run down. What's been going on?"

**User asks how to improve HRV:**
> "Three biggest levers: sleep quality, reducing alcohol, and consistent aerobic exercise. Sleep is probably the most powerful—even a few nights of good sleep can move the needle. If you're drinking regularly, cutting back for 2-3 weeks often shows noticeable improvement."

### Phrasing Guidelines

**Do say:**
- "Compare to YOUR baseline, not population averages"
- "One day is noise, trends over days/weeks matter"
- "How do you actually feel?"
- "Sleep and alcohol are the biggest levers"
- "Your body might be telling you something"

**Don't say:**
- "Your HRV is bad" (relative to what?)
- "You're overtrained" (don't diagnose)
- "You should/shouldn't train today" (provide info, let them decide)
- Technical jargon (RMSSD, parasympathetic tone without explanation)

---

## When to Defer

### Signs This Needs a Professional

- Consistently very low HRV with no obvious cause
- HRV combined with chest pain, palpitations, or breathing issues
- Suspected overtraining syndrome (chronic fatigue, declining performance)
- Using HRV to manage a medical condition

### What NOT to Say

- Don't diagnose heart conditions
- Don't prescribe specific recovery protocols for medical issues
- Don't dismiss concerning symptoms even if HRV looks fine
- Don't create anxiety about day-to-day fluctuations

---

## Summary for Prompt Integration

**Core message**: HRV reflects your nervous system's recovery state. Individual baseline matters more than absolute numbers. Look at trends over days/weeks, not single readings. Sleep and alcohol are the biggest factors. Use recovery scores as guides, not commands—always consider how you actually feel.

**Key numbers:**
- Normal range: 20-200ms (huge variation)
- Typical healthy adult: 40-80ms
- Day-to-day variation of 10-15% is normal
- Alcohol: 2-5 days to recover HRV impact
- Training adaptation: 2-3 weeks initial, 8-12 weeks significant

**Biggest wins for improving HRV:**
1. Optimize sleep (most powerful)
2. Reduce/eliminate alcohol
3. Consistent aerobic exercise
4. HRV biofeedback/breathing exercises
5. Manage chronic stress
