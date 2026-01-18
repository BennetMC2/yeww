-- Disable RLS on all tables for development
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- This allows the app to work without authentication
-- When you're ready to add auth, re-enable RLS with proper policies

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_daily DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_raw DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
