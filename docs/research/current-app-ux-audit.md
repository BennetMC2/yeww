# Yeww App UX Audit

Current state assessment of all screens and components.

---

## Pages & Screens

### 1. Root / Auth Flow (`/`)
- **Purpose**: Entry point with smart routing based on onboarding state
- **Components**: Loading spinner with branding
- **UX State**: Minimal but functional
- **Visual**: Centered layout with animated spinner

### 2. Onboarding Flow (`/onboarding`)
- **Purpose**: 16-step guided journey to collect preferences, data sources, goals, barriers, coaching style
- **Components**:
  - Animated message reveals
  - Data source cards with icons
  - Priority chips (multi-select, max 3)
  - Coaching style options
  - Timeline visualization
  - Score reveals (Health Score, Reputation, Points)
- **UX State**: **Polished** - Extensive animations, staggered reveals, smooth transitions
- **Visual**: Warm cream backgrounds (#FAF6F1), coral accents (#E07A5F), progress bar

### 3. Home / Dashboard (`/home`)
- **Purpose**: Main hub - daily check-in, health score, metrics, quick stats, smart nudges
- **Components**:
  - Header (logo + profile link)
  - HealthScoreGauge (circular animated gauge)
  - PointsDisplay, Streak counter, ReputationBadge
  - HealthMetricsDashboard
  - Daily check-in card (3 sentiment buttons)
  - Smart nudge section
  - BottomNav
- **UX State**: **Polished** - Clean layout, good hierarchy, soft shadows
- **Visual**: Card-based, 2px rounded corners, warm palette

### 4. Chat (`/chat`)
- **Purpose**: Conversational AI health coaching with image support
- **Components**:
  - Message thread (user right, AI left)
  - Auto-scrolling
  - Textarea with auto-resize
  - Image upload (camera + gallery)
  - Typing indicator
  - Starter prompts when empty
- **UX State**: **Polished** - Smooth interactions, clean formatting
- **Visual**: User bubbles coral (#FFE8DC), AI bubbles tan (#F5EDE4)

### 5. Profile Settings (`/profile`)
- **Purpose**: User preferences, connected apps, data sharing, reputation tracking
- **Components**:
  - Profile avatar + name edit
  - Streak + Points + Reputation stats
  - Settings sections (coaching style, apps, health areas, devices, sharing)
  - Modals (coaching style, apps, points history)
  - Reset data confirmation
- **UX State**: **Polished** - Well-organized sections, good modal interactions
- **Visual**: Card-based sections, toggle switches, color-coded badges

### 6. Health Areas (`/health`)
- **Purpose**: Manage tracked health areas
- **Components**:
  - Active areas section (with removal)
  - Available areas section (to add)
  - Confirmation modals
- **UX State**: **Polished** - Clear add/remove flows
- **Visual**: Icon + text layout, active indicator dot

### 7. Progress Tracking (`/progress`)
- **Purpose**: Timeline view of progress entries (photos, notes, milestones)
- **Components**:
  - Timeline/chronological feed
  - Add entry button
  - Entry type modals (photo, note, milestone)
  - Empty state
- **UX State**: **Polished** - Clean timeline, smooth modals
- **Visual**: Card-based entries, date grouping

---

## Design System

### Color Palette
```
Primary Background: #FAF6F1 (cream/warm beige)
Secondary Background: #F5EDE4 (light tan)
Card Background: #FFFFFF
Input Background: #F5EDE4

Text:
- Primary: #2D2A26 (soft black/brown)
- Secondary: #8A8580 (muted brown)
- Muted: #B5AFA8 (light gray-brown)

Accent:
- Primary: #E07A5F (coral/terracotta)
- Primary Hover: #D36B4F
- Primary Light: #FFE8DC
- Secondary: #81B29A (sage green)
- Tertiary: #F2CC8F (warm gold)

System:
- Success: #4ADE80 (green)
- Info: #60A5FA (blue)
- Warning: #F59E0B (amber)
```

### Typography
- **Font**: DM Sans (Google Fonts)
- **Weights**: 400, 500, 600, 700
- **Line height**: 1.6

### Spacing & Sizing
- **Border radius**: 2xl (16px) cards, xl (12px) buttons
- **Padding**: 16-24px containers
- **Gap**: 12px between elements

### Shadows
- Soft: `0 2px 16px rgba(45, 42, 38, 0.06)`
- Medium: `0 4px 24px rgba(45, 42, 38, 0.08)`

### Animations
- Standard: 300ms ease-out
- Fade-in: 400ms
- Stagger delays: 100ms increments
- Gauge: 1500ms ease-out

---

## Shared Components

### Layout
- **Header**: Logo + profile button, fixed top
- **BottomNav**: 4 items (Home, Chat, Health, Progress), active states

### Score/Metrics
- **HealthScoreGauge**: Circular SVG, animated, color-coded
- **ReputationBadge**: 5 levels with icons
- **PointsDisplay**: Counter with optional label
- **HealthMetricsDashboard**: Grid of metric cards

### Form
- **Button**: 3 variants (primary, secondary, ghost), 3 sizes
- **Input**: Rounded, tan background, focus states
- **ProgressBar**: Linear progress

---

## Strengths

1. Warm, accessible color palette
2. Smooth animations with purpose
3. Mobile-first design
4. Narrative-driven onboarding
5. Consistent component library
6. Clean data visualization
7. Clear information hierarchy
8. Good accessibility (large text, contrast)

---

## Areas for Improvement

1. **Modals** - Could use smoother animations, gestural dismiss
2. **Loading states** - Minimal; need more branded skeleton states
3. **Empty states** - Functional but could be more delightful/illustrated
4. **Micro-interactions** - Limited haptic/feedback hints
5. **Dark mode** - Not implemented
6. **Toast notifications** - No persistent toast system
7. **Gesture support** - Could support swipe gestures
8. **Progress section** - Could use more visual treatments (charts)
9. **Celebration animations** - Minimal for milestones
10. **Contextual tips** - No tooltip system
