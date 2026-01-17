-- ============================================
-- MIGRATION: Add new columns for Supabase storage
-- Run this in Supabase SQL Editor
-- ============================================

-- Add missing columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS data_sources text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS connected_apps text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS health_areas jsonb DEFAULT '[]';

-- Add quick_actions to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS quick_actions jsonb DEFAULT null;

-- Create progress_entries table
CREATE TABLE IF NOT EXISTS public.progress_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  date timestamp with time zone NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('photo', 'milestone', 'note')),
  category text NOT NULL CHECK (category IN ('body', 'skin', 'general')),
  content text NOT NULL,
  note text
);

-- Create index for progress_entries
CREATE INDEX IF NOT EXISTS progress_entries_user_date ON public.progress_entries(user_id, date DESC);

-- Verify the changes
SELECT 'Migration complete!' as status;
