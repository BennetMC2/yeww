# yeww Product Specification

## Vision

yeww is your **single source of truth** for all health data—wearables, fitness apps, nutrition, blood tests, weight, mood, everything—with an AI assistant that actually knows your full picture.

Right now your health data is fragmented across 10 different apps that don't talk to each other. yeww brings it all together so you can ask questions, get personalized advice, and spot patterns across domains that no single app could ever see.

But it goes beyond just answering questions. Because yeww sees everything, it can get ahead of problems—flagging when you're trending toward burnout, predicting energy crashes, or catching correlations you'd never notice yourself. Less rearview mirror, more forward-looking advisor.

**Think of yeww as a health-obsessed friend who's read every data point you've ever tracked and can help you make sense of it all.**

**Core value props (in order):**
1. **Single data repo** - All your health data in one place, finally
2. **AI assistant** - Ask anything, get answers based on YOUR actual data
3. **Anticipatory intelligence** - Surfaces patterns and predictions before you ask

---

## Target User

Health-conscious individuals interested in longevity, typically:
- Already tracking with wearables (Garmin, Oura, Whoop, Apple Watch)
- Frustrated by dashboards full of numbers they don't action
- Want insights, not just data
- Willing to engage daily for meaningful outcomes

---

## Core Principles

1. **One place for everything** - Be the single repo users actually trust with all their data
2. **AI that knows you** - Every response informed by the full picture, not generic advice
3. **Friend, not doctor** - Warm, conversational, like talking to someone who genuinely cares
4. **Surface insights naturally** - Patterns and predictions emerge through chat and timely notifications
5. **Depth on demand** - Clean surface, detail available for those who want it

---

## The Data Ecosystem

yeww aggregates health data from everywhere:

### Wearables & Fitness
- Garmin, Oura, Whoop, Fitbit, Apple Watch, Google Fit
- Strava, Strong, Peloton, Apple Fitness+
- Sleep, HRV, RHR, steps, strain, recovery, workouts

### Nutrition & Body
- Food logging (in-app or import from MyFitnessPal, Cronometer)
- Weight & body composition
- Water intake

### Medical & Labs
- Blood test results (manual or screenshot import)
- Key biomarkers: lipids, metabolic, hormones, vitamins, inflammation

### Self-Reported
- Mood & energy levels
- Symptoms
- Substances (alcohol, caffeine, supplements)
- Cycle tracking

### Future
- CGM (continuous glucose)
- Medications
- Genetics (23andMe, Ancestry)

---

## Pattern Detection

Because yeww sees the full picture, it can find correlations no single-source app ever could:

- "Your HRV drops 15% after runs longer than 10km"
- "Sleep quality drops 25% when you eat after 9pm"
- "Coffee after 2pm costs you 45 mins of sleep"
- "You get sick within 5 days of: high strain + poor sleep + skipped rest day"
- "You lose more weight in weeks with 4+ strength sessions"

Patterns don't live in a separate dashboard—they emerge through:
1. **Conversation** - The AI mentions relevant patterns when chatting
2. **Proactive notifications** - Alerts when patterns trigger

---

## Voice & Tone

### The yeww Voice: Health-Obsessed Friend

Not clinical. Not preachy. Not a coach barking orders. A friend who's genuinely into this stuff, knows your history, and talks to you like a real person.

| Situation | ❌ Clinical | ❌ Generic App | ✓ yeww |
|-----------|------------|----------------|--------|
| Low HRV | "Parasympathetic withdrawal detected" | "Your recovery is low today" | "Rough night. Your HRV's down—I'd take it easy." |
| Pattern found | "Correlation: caffeine >14:00 → -18% sleep efficiency" | "Coffee affects sleep" | "So I've noticed something—when you have coffee after 2pm, your sleep takes a hit. Worth experimenting with cutting it earlier?" |
| Good day | "Metrics within optimal parameters" | "You're doing great!" | "You're looking solid today. Good sleep, HRV's up. Great day to push if you want." |

### Response Style

- Conversational, like texting a knowledgeable friend
- References your actual data and history naturally
- Offers suggestions, doesn't command
- Curious and collaborative ("I've noticed...", "Worth trying?")
- Celebrates wins, acknowledges struggles

---

## Open Questions

1. **Forecast language** - How to phrase predictions? Weather metaphors? Time-based?
2. **Biological age** - Include as a metric? How to calculate from wearables?
3. **Social/sharing** - Any community features? Compare with friends?
4. **Premium features** - What's free vs paid?

---

## Technical Documentation

For implementation details, see the `/docs` folder:

- [**Architecture**](./docs/ARCHITECTURE.md) - System design and data flow
- [**Data Model**](./docs/DATA_MODEL.md) - Database schema
- [**AI System**](./docs/AI_SYSTEM.md) - How the AI works
- [**Scoring**](./docs/SCORING.md) - Health Score, Reputation, Points
- [**Roadmap**](./docs/ROADMAP.md) - Development phases

---

*Last updated: January 2026*
