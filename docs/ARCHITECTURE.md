# yeww Architecture

This document describes the system architecture at three levels: high-level overview, technical architecture, and data flow.

---

## 1. High-Level Overview

How data flows from sources to insights:

```mermaid
flowchart LR
    subgraph Sources["Data Sources"]
        W[Wearables]
        F[Fitness Apps]
        M[Manual Entry]
        L[Labs/Blood Tests]
    end

    subgraph yeww["yeww Platform"]
        R[Data Repository]
        AI[AI Assistant]
        P[Pattern Detection]
    end

    subgraph User["User Experience"]
        C[Chat]
        N[Notifications]
        D[Dashboard]
    end

    W --> R
    F --> R
    M --> R
    L --> R

    R --> AI
    R --> P

    AI --> C
    P --> AI
    P --> N
    R --> D
```

**The core idea:** All health data flows into a single repository. The AI assistant has full access to this data, enabling personalized conversations and pattern detection that no single-source app can provide.

---

## 2. Technical Architecture

The system components and how they connect:

```mermaid
flowchart TB
    subgraph Client["Client (Browser)"]
        Next[Next.js App]
        React[React Components]
        Context[AppContext]
    end

    subgraph API["API Layer"]
        Routes[Next.js API Routes]
        Chat["/api/chat"]
    end

    subgraph External["External Services"]
        Claude[Claude API]
        Terra[Terra API]
    end

    subgraph Database["Database (Supabase)"]
        PG[(PostgreSQL)]
        Auth[Auth - Future]
    end

    React --> Context
    Context --> Routes
    Chat --> Claude
    Routes --> PG
    Terra --> PG

    Next --> React
```

### Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 16 (App Router) | Server-rendered React app |
| **State Management** | React Context (AppContext) | Client-side state + data fetching |
| **Database** | Supabase (PostgreSQL) | Persistent storage for all user data |
| **AI** | Claude API (claude-sonnet-4) | Conversational AI with full context |
| **Wearable Data** | Terra API (planned) | Unified API for Garmin, Oura, Whoop, etc. |
| **Hosting** | Vercel | Deployment and edge functions |

### Key Files

```
src/
├── app/
│   ├── api/chat/route.ts    # AI chat endpoint
│   ├── chat/page.tsx        # Chat UI
│   ├── home/page.tsx        # Dashboard
│   ├── onboarding/page.tsx  # 16-screen onboarding flow
│   └── ...
├── components/
│   ├── scores/              # Health score, reputation, points UI
│   └── ui/                  # Reusable UI components
├── contexts/
│   └── AppContext.tsx       # Global state + Supabase integration
├── lib/
│   ├── storage.ts           # Data access layer (Supabase queries)
│   ├── supabase.ts          # Supabase client
│   └── scores.ts            # Scoring calculations
└── types/
    └── index.ts             # TypeScript types
```

---

## 3. Data Flow

How a data point moves through the system:

### 3a. Wearable Data (via Terra - planned)

```mermaid
sequenceDiagram
    participant Device as Wearable Device
    participant Terra as Terra API
    participant Webhook as yeww Webhook
    participant DB as Supabase
    participant AI as AI Assistant

    Device->>Terra: Sync data
    Terra->>Webhook: POST /api/terra/webhook
    Webhook->>DB: Store in health_daily / health_raw
    Note over DB: Data available for queries

    AI->>DB: Fetch user context
    DB->>AI: Return 14 days of data
    AI->>AI: Include in conversation context
```

### 3b. Manual Entry (current)

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant Context as AppContext
    participant DB as Supabase

    User->>UI: Enter data (weight, mood, etc.)
    UI->>Context: Call update function
    Context->>DB: Upsert to appropriate table
    DB->>Context: Return updated data
    Context->>UI: Update local state
    UI->>User: Show confirmation
```

### 3c. Chat Conversation

```mermaid
sequenceDiagram
    participant User
    participant Chat as Chat UI
    participant API as /api/chat
    participant Claude as Claude API
    participant DB as Supabase

    User->>Chat: Send message
    Chat->>DB: Save user message
    Chat->>API: POST with message + profile context

    Note over API: Build system prompt with:<br/>- User profile<br/>- Health score<br/>- Priorities/barriers<br/>- Connected sources<br/>- Streak info

    API->>Claude: Send with full context
    Claude->>API: Return response
    API->>Chat: Return AI message
    Chat->>DB: Save assistant message
    Chat->>User: Display response
```

---

## 4. Future Architecture (with Terra)

When Terra is integrated:

```mermaid
flowchart TB
    subgraph Devices["User Devices"]
        Garmin[Garmin]
        Oura[Oura Ring]
        Whoop[Whoop]
        Apple[Apple Watch]
        Fitbit[Fitbit]
    end

    subgraph Terra["Terra API"]
        OAuth[OAuth Flow]
        Webhook[Webhooks]
        Pull[Data Pull API]
    end

    subgraph yeww["yeww Backend"]
        TerraHandler[Terra Webhook Handler]
        Processor[Data Processor]
        Daily[Daily Aggregator]
    end

    subgraph DB["Supabase"]
        Raw[(health_raw)]
        Summary[(health_daily)]
        Users[(users)]
    end

    Garmin & Oura & Whoop & Apple & Fitbit --> Terra
    OAuth --> TerraHandler
    Webhook --> TerraHandler
    TerraHandler --> Processor
    Processor --> Raw
    Raw --> Daily
    Daily --> Summary
    Users --> Summary
```

### Terra Integration Points

1. **OAuth Flow**: User connects device via Terra's widget
2. **Webhook**: Terra sends data when device syncs
3. **Data Processing**: Normalize different device formats
4. **Daily Aggregation**: Roll up raw data into daily summaries

---

## 5. Security Considerations

### Current State
- Supabase RLS disabled for development
- User ID stored in localStorage
- No authentication yet

### Planned (with Auth)
- Supabase Auth for user accounts
- Row Level Security (RLS) on all tables
- User can only access their own data
- Secure API routes with auth middleware

---

## 6. Scaling Considerations

### Current (MVP)
- Single Supabase project
- Serverless functions via Vercel
- Suitable for hundreds of users

### Future
- Consider read replicas for heavy analytics
- Background jobs for pattern detection
- Caching layer for frequently accessed data
- Rate limiting on AI calls

---

*See also: [DATA_MODEL.md](./DATA_MODEL.md) for database schema details*
