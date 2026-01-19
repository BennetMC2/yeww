# UX Audit: Core App Screens

> Generated: 2026-01-19
> Status: Ready for implementation
> Next: Start with Home screen improvements

---

## Screen-by-Screen Analysis

---

### 1. HOME (`/home`) — Priority: HIGH

**Current State:**
- Health Score gauge (tappable)
- Quick stats row (Points, Streak, Reputation)
- Health Metrics Dashboard (Terra data)
- Daily check-in card with 3 quick responses
- Smart nudges

**Gaps:**
| Issue | Severity | Notes |
|-------|----------|-------|
| "Loading..." text (no skeleton) | Medium | Inconsistent with polished onboarding |
| No animation on first load | Medium | Static compared to onboarding feel |
| Check-in feedback is basic | Medium | Points notification is plain text |
| No personalization in greeting beyond name | Low | Could reference priorities, streak |
| Quick stats feel disconnected | Low | Just numbers, no context |
| No celebration for streak milestones | Medium | Missing dopamine hits |
| Health Metrics Dashboard might be empty | High | What shows if no Terra data? |

**Recommendations:**
1. Add skeleton loading state
2. Animate health score on load (count up)
3. Celebrate streak milestones (3, 7, 14, 30 days)
4. Better check-in feedback (confetti on streak milestone?)
5. Personalized greeting that references priorities
6. Empty state for Health Metrics if no data connected

---

### 2. CHAT (`/chat`) — Priority: MEDIUM

**Current State:**
- Clean conversation UI
- Image upload support
- Typing indicator (3 dots)
- Quick prompts when empty

**Gaps:**
| Issue | Severity | Notes |
|-------|----------|-------|
| "Loading..." text | Medium | No skeleton |
| Empty state is good but basic | Low | Could be warmer |
| No avatar for AI messages | Low | Less personality |
| No timestamp on messages | Low | Can't see when things were said |
| Typing indicator is basic | Low | Could be more branded |

**Recommendations:**
1. Add skeleton loading
2. Consider subtle yeww avatar/icon on AI messages
3. Optional timestamps (e.g., "2h ago")
4. Warmer empty state copy

---

### 3. PROFILE (`/profile`) — Priority: MEDIUM

**Current State:**
- User info with editable name
- Stats (streak, points)
- Reputation with progress bar
- Settings (coaching style, connected apps, health areas)
- Connected Devices (Terra)
- Data Sharing toggles
- Points History modal
- Reset data option

**Gaps:**
| Issue | Severity | Notes |
|-------|----------|-------|
| "Loading..." text | Medium | No skeleton |
| Profile photo is placeholder icon | Low | Could allow custom photo |
| No visual hierarchy | Medium | Everything looks same importance |
| Data sharing section doesn't connect to zK story | Medium | We told them about privacy in onboarding |
| Points history modal is basic | Low | Could show graph/trend |

**Recommendations:**
1. Add skeleton loading
2. Visual hierarchy: make reputation/progress more prominent
3. Connect data sharing to the zK privacy story from onboarding
4. Consider profile photo upload (future)

---

### 4. HEALTH (`/health`) — Priority: LOW

**Current State:**
- List of active health areas
- List of available areas to add
- Inline confirmation for add/remove

**Gaps:**
| Issue | Severity | Notes |
|-------|----------|-------|
| "Loading..." text | Medium | No skeleton |
| No explanation of what tracking does | Medium | User might wonder "so what?" |
| Empty state is weak | Low | "Add one to get started" is generic |
| No progress/insights per area | Medium | Just shows "tracking since X" |

**Recommendations:**
1. Add skeleton loading
2. Explain what tracking each area unlocks
3. Better empty state with benefit-focused copy
4. Consider showing mini-insights per area (future)

---

### 5. PROGRESS (`/progress`) — Priority: LOW

**Current State:**
- Timeline of entries (photos, notes, milestones)
- Add button with modal
- Category selection for photos
- Good empty state

**Gaps:**
| Issue | Severity | Notes |
|-------|----------|-------|
| "Loading..." text | Medium | No skeleton |
| No before/after comparison feature | Low | Key use case for progress photos |
| Timeline lacks visual polish | Low | Cards are basic |
| No celebration when adding first entry | Low | Missing delight moment |

**Recommendations:**
1. Add skeleton loading
2. Celebration animation on first entry
3. Consider before/after photo comparison (future)

---

## Global Issues

| Issue | Severity | Screens Affected |
|-------|----------|------------------|
| "Loading..." text everywhere | Medium | All |
| No entrance animations | Medium | All (except onboarding) |
| Button styles inconsistent with enhanced onboarding buttons | Low | Some |
| No reduced-motion support | Low | All |

---

## Priority Order for Implementation

1. **Home** — Users see this daily, highest impact
2. **Chat** — Core interaction, second most used
3. **Profile** — Important but less frequent
4. **Health** — Lower priority
5. **Progress** — Lower priority

---

## What We Completed (Onboarding)

✅ Skeleton loading state
✅ Confetti celebration on completion
✅ Enhanced progress bar with milestones
✅ Button micro-interactions (scale, glow, shadow)
✅ Brand colors for data sources
✅ Terra widget integration
✅ New Privacy & Security screen (Step 6)
✅ Personalization throughout (name, priorities, coaching style previews)
✅ Timeline condensed to 6 months
✅ 100pt welcome bonus with tallying animation
✅ Reputation score progression path visual
✅ Conditional Health Score UI
✅ Single "Let's go" CTA on final step

---

## Notes

- Health Score calculation may need revisiting (noted as "feels imperfect")
- Same screen-by-screen review process as onboarding recommended
- Start with Home screen next session
