# yeww Documentation

Welcome to the yeww technical documentation. Start here to understand how the system works.

---

## Quick Links

| Document | Description |
|----------|-------------|
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | System architecture, components, and data flow diagrams |
| [**DATA_MODEL.md**](./DATA_MODEL.md) | Database schema, tables, and data types |
| [**AI_SYSTEM.md**](./AI_SYSTEM.md) | How the AI assistant works, prompts, and personality |
| [**SCORING.md**](./SCORING.md) | Health Score, Reputation, and Points systems |
| [**ROADMAP.md**](./ROADMAP.md) | Development phases and what's next |

For the product vision and "what is yeww", see [**PRODUCT_SPEC.md**](../PRODUCT_SPEC.md) in the root directory.

---

## What is yeww?

**yeww** is your single source of truth for all health data—wearables, fitness apps, nutrition, blood tests, weight, mood—with an AI assistant that actually knows your full picture.

Think of it as a health-obsessed friend who's read every data point you've ever tracked.

### Core Value Props

1. **Single data repo** - All your health data in one place
2. **AI assistant** - Ask anything, get answers based on YOUR data
3. **Anticipatory intelligence** - Surfaces patterns and predictions before you ask

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| AI | Claude API (Anthropic) |
| Wearables | Terra API (planned) |
| Hosting | Vercel |

---

## Getting Started (for developers)

### Prerequisites
- Node.js 18+
- npm or bun
- Supabase account
- Anthropic API key

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd longevity-guide

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - ANTHROPIC_API_KEY

# Run the Supabase schema
# (Go to Supabase dashboard → SQL Editor → paste supabase-schema.sql)

# Start dev server
npm run dev
```

### Key Directories

```
src/
├── app/              # Next.js pages and API routes
├── components/       # React components
├── contexts/         # React Context (AppContext)
├── lib/              # Utilities (storage, scores, supabase)
└── types/            # TypeScript types

docs/                 # You are here
supabase-schema.sql   # Database schema
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     User's Devices                       │
│  Garmin │ Oura │ Whoop │ Apple Watch │ Manual Entry     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      Terra API                           │
│              (Unified wearable data)                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                        yeww                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Supabase   │  │   Claude    │  │   Next.js   │     │
│  │  (Data)     │◄─┤   (AI)      │◄─┤   (App)     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                        User                              │
│        Chat │ Dashboard │ Notifications                  │
└─────────────────────────────────────────────────────────┘
```

---

## Contributing

1. Read the relevant docs (especially ARCHITECTURE.md and DATA_MODEL.md)
2. Check ROADMAP.md for current priorities
3. Create a feature branch
4. Make your changes
5. Test locally
6. Submit PR

---

## Questions?

- Check the docs first
- Look at existing code patterns
- Ask in the repo issues

---

*Last updated: January 2026*
