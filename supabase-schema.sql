-- ============================================
-- YEWW DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS TABLE
-- Core user profile and settings
-- ============================================
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Profile
  email text unique,
  name text,

  -- Onboarding data
  coaching_style text check (coaching_style in ('direct', 'supportive', 'balanced')),
  priorities text[] default '{}',
  past_attempt text,
  barriers text[] default '{}',
  data_sources text[] default '{}',
  connected_apps text[] default '{}',
  health_areas jsonb default '[]',

  -- Scores
  health_score integer default 0,
  reputation_level text default 'starter',
  reputation_points integer default 0,
  points integer default 0,

  -- Streaks
  check_in_streak integer default 0,
  last_check_in timestamp with time zone,

  -- Settings
  sharing_research boolean default false,
  sharing_brands boolean default false,
  sharing_insurance boolean default false,
  ai_data_access boolean default true,

  -- Terra connection
  terra_user_id text unique,

  -- Status
  onboarding_completed boolean default false
);

-- ============================================
-- HEALTH DATA - DAILY SUMMARIES
-- One row per user per day (kept forever)
-- ============================================
create table public.health_daily (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  date date not null,
  created_at timestamp with time zone default now(),

  -- Sleep
  sleep_duration_minutes integer,
  sleep_quality_score integer, -- 0-100
  sleep_deep_minutes integer,
  sleep_rem_minutes integer,
  sleep_light_minutes integer,
  sleep_awake_minutes integer,
  sleep_start_time time,
  sleep_end_time time,

  -- Heart
  resting_heart_rate integer,
  hrv_average integer, -- ms
  hrv_max integer,

  -- Activity
  steps integer,
  active_calories integer,
  total_calories integer,
  active_minutes integer,
  floors_climbed integer,
  distance_meters integer,

  -- Body (when available)
  weight_kg numeric(5,2),
  body_fat_percent numeric(4,1),

  -- Recovery/Readiness
  recovery_score integer, -- 0-100
  readiness_score integer, -- 0-100
  strain_score numeric(3,1),
  stress_score integer,

  -- Other
  spo2_average integer,
  respiratory_rate numeric(3,1),

  -- Source tracking
  data_sources text[] default '{}', -- which devices contributed

  unique(user_id, date)
);

-- ============================================
-- HEALTH DATA - RAW
-- Granular data points (kept 90 days)
-- ============================================
create table public.health_raw (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  recorded_at timestamp with time zone not null,
  created_at timestamp with time zone default now(),

  -- Flexible storage for any metric
  metric_type text not null, -- 'heart_rate', 'hrv', 'steps', 'sleep_stage', etc.
  value numeric,
  unit text,

  -- Additional context as JSON
  metadata jsonb default '{}',

  -- Source
  source text -- 'garmin', 'oura', 'apple_health', etc.
);

-- Index for efficient querying
create index health_raw_user_time on public.health_raw(user_id, recorded_at desc);
create index health_raw_metric on public.health_raw(user_id, metric_type, recorded_at desc);

-- ============================================
-- WORKOUTS
-- Individual workout sessions
-- ============================================
create table public.workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone,
  created_at timestamp with time zone default now(),

  -- Workout details
  workout_type text, -- 'running', 'cycling', 'strength', etc.
  duration_minutes integer,
  calories integer,
  distance_meters integer,

  -- Heart rate during workout
  avg_heart_rate integer,
  max_heart_rate integer,

  -- Intensity
  avg_pace numeric, -- min/km for running
  elevation_gain integer,

  -- Source
  source text,
  external_id text -- ID from source system
);

-- ============================================
-- INSIGHTS
-- AI-detected patterns (kept forever)
-- ============================================
create table public.insights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamp with time zone default now(),

  -- Insight content
  category text, -- 'sleep', 'recovery', 'activity', 'correlation'
  title text not null,
  description text not null,

  -- Strength of pattern
  confidence numeric(3,2), -- 0.00 to 1.00
  occurrences integer, -- how many times observed

  -- Status
  is_active boolean default true,
  dismissed_at timestamp with time zone,

  -- Related data
  related_metrics text[] default '{}',
  metadata jsonb default '{}'
);

-- ============================================
-- CONVERSATIONS
-- Chat history with AI
-- ============================================
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamp with time zone default now(),

  -- Conversation grouping (one per day or session)
  date date not null,

  unique(user_id, date)
);

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  created_at timestamp with time zone default now(),

  role text not null check (role in ('user', 'assistant')),
  content text not null,

  -- Quick action buttons for AI responses
  quick_actions jsonb default null,

  -- Health context at time of message
  health_context jsonb default '{}'
);

-- ============================================
-- POINTS HISTORY
-- Track points earned
-- ============================================
create table public.points_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamp with time zone default now(),

  type text not null, -- 'check_in', 'streak_bonus', 'connect_source', etc.
  amount integer not null,
  description text
);

-- ============================================
-- PROGRESS ENTRIES
-- Milestones, notes, photos (kept forever)
-- ============================================
create table public.progress_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamp with time zone default now(),

  date timestamp with time zone not null,
  entry_type text not null check (entry_type in ('photo', 'milestone', 'note')),
  category text not null check (category in ('body', 'skin', 'general')),
  content text not null,
  note text
);

create index progress_entries_user_date on public.progress_entries(user_id, date desc);

-- ============================================
-- ROW LEVEL SECURITY
-- Disabled for development - enable with auth later
-- ============================================
-- NOTE: RLS is disabled for development. When adding Supabase Auth,
-- uncomment the policies below and enable RLS on each table.

-- alter table public.users enable row level security;
-- alter table public.health_daily enable row level security;
-- alter table public.health_raw enable row level security;
-- alter table public.workouts enable row level security;
-- alter table public.insights enable row level security;
-- alter table public.conversations enable row level security;
-- alter table public.messages enable row level security;
-- alter table public.points_history enable row level security;
-- alter table public.progress_entries enable row level security;

-- Policies (uncomment when enabling RLS with auth)
-- create policy "Users can view own profile" on public.users
--   for select using (auth.uid() = id);
-- create policy "Users can update own profile" on public.users
--   for update using (auth.uid() = id);
-- create policy "Users can insert own profile" on public.users
--   for insert with check (auth.uid() = id);
-- create policy "Users can manage own health_daily" on public.health_daily
--   for all using (auth.uid() = user_id);
-- create policy "Users can manage own health_raw" on public.health_raw
--   for all using (auth.uid() = user_id);
-- create policy "Users can manage own workouts" on public.workouts
--   for all using (auth.uid() = user_id);
-- create policy "Users can manage own insights" on public.insights
--   for all using (auth.uid() = user_id);
-- create policy "Users can manage own conversations" on public.conversations
--   for all using (auth.uid() = user_id);
-- create policy "Users can manage own messages" on public.messages
--   for all using (
--     conversation_id in (
--       select id from public.conversations where user_id = auth.uid()
--     )
--   );
-- create policy "Users can manage own points_history" on public.points_history
--   for all using (auth.uid() = user_id);
-- create policy "Users can manage own progress_entries" on public.progress_entries
--   for all using (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
create index users_terra_id on public.users(terra_user_id);
create index health_daily_user_date on public.health_daily(user_id, date desc);
create index workouts_user_date on public.workouts(user_id, started_at desc);
create index insights_user_active on public.insights(user_id, is_active);
create index messages_conversation on public.messages(conversation_id, created_at);
