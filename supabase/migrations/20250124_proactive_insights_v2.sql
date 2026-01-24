-- Proactive insights v2: Add columns for deduplication and structured comparison
-- This migration adds support for:
-- 1. Deduplication: One insight per user+metric+date
-- 2. Dual comparison: Today vs yesterday + 7-day baseline

-- Add new columns
ALTER TABLE public.proactive_insights
ADD COLUMN IF NOT EXISTS metric_type TEXT,          -- 'steps' | 'sleep_hours' | 'hrv' | 'rhr' | 'recovery'
ADD COLUMN IF NOT EXISTS metric_date DATE,          -- The actual date the metric is for
ADD COLUMN IF NOT EXISTS today_value NUMERIC,       -- Current day's value
ADD COLUMN IF NOT EXISTS yesterday_value NUMERIC,   -- Previous day's value
ADD COLUMN IF NOT EXISTS baseline_7day NUMERIC,     -- 7-day average (baseline context)
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Unique constraint for deduplication: one insight per user+metric+date
-- Only applies to rows that have metric_type and metric_date populated (new-style insights)
CREATE UNIQUE INDEX IF NOT EXISTS idx_proactive_insights_dedupe
ON public.proactive_insights(user_id, metric_type, metric_date)
WHERE metric_type IS NOT NULL AND metric_date IS NOT NULL;

-- Index for querying by metric_date
CREATE INDEX IF NOT EXISTS idx_proactive_insights_metric_date
ON public.proactive_insights(user_id, metric_date DESC)
WHERE metric_date IS NOT NULL;
