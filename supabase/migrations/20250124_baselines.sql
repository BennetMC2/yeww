-- Metric baselines table for historical averages
-- Caches rolling averages to avoid repeated computation

CREATE TABLE IF NOT EXISTS public.metric_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  avg_7day NUMERIC,
  avg_14day NUMERIC,
  avg_30day NUMERIC,
  stddev_7day NUMERIC,
  stddev_14day NUMERIC,
  stddev_30day NUMERIC,
  min_7day NUMERIC,
  max_7day NUMERIC,
  sample_count_7day INTEGER DEFAULT 0,
  sample_count_30day INTEGER DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, metric_type)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_metric_baselines_user_id ON public.metric_baselines(user_id);
CREATE INDEX IF NOT EXISTS idx_metric_baselines_computed_at ON public.metric_baselines(computed_at);

-- Disable RLS for development
ALTER TABLE public.metric_baselines DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.metric_baselines TO anon, authenticated;
