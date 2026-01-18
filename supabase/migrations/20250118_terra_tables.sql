-- Terra integration tables
-- Run this in Supabase SQL Editor

-- Table to store Terra user connections (wearables)
CREATE TABLE IF NOT EXISTS public.terra_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,           -- Terra's user_id
  reference_id TEXT NOT NULL,      -- Our app's user_id
  provider TEXT NOT NULL,          -- e.g., 'OURA', 'GARMIN', 'FITBIT'
  scopes TEXT,                     -- OAuth scopes granted
  last_webhook_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Index for fast lookups by our user ID
CREATE INDEX IF NOT EXISTS idx_terra_users_reference_id ON public.terra_users(reference_id);

-- Table to store raw Terra data payloads
CREATE TABLE IF NOT EXISTS public.terra_data_payloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,           -- Terra's user_id
  reference_id TEXT NOT NULL,      -- Our app's user_id
  type TEXT NOT NULL,              -- e.g., 'sleep', 'daily', 'activity', 'body'
  data JSONB NOT NULL,             -- The actual payload data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_terra_payloads_reference_id ON public.terra_data_payloads(reference_id);
CREATE INDEX IF NOT EXISTS idx_terra_payloads_type ON public.terra_data_payloads(type);
CREATE INDEX IF NOT EXISTS idx_terra_payloads_created_at ON public.terra_data_payloads(created_at DESC);

-- Composite index for the common query pattern
CREATE INDEX IF NOT EXISTS idx_terra_payloads_ref_type_created
  ON public.terra_data_payloads(reference_id, type, created_at DESC);

-- Disable RLS for development (enable with proper policies for production)
ALTER TABLE public.terra_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.terra_data_payloads DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.terra_users TO anon, authenticated;
GRANT ALL ON public.terra_data_payloads TO anon, authenticated;
