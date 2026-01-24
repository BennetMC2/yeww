-- Detected patterns table
-- Stores correlations and patterns found in user health data

CREATE TABLE IF NOT EXISTS public.detected_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  pattern_type TEXT CHECK (pattern_type IN ('correlation', 'trend', 'anomaly')) NOT NULL,
  metric_a TEXT NOT NULL,                                -- First metric (e.g., 'sleep_hours')
  metric_b TEXT,                                         -- Second metric for correlations (e.g., 'recovery')
  description TEXT NOT NULL,                             -- Human-readable description
  correlation_strength NUMERIC(4,3),                     -- -1.0 to 1.0 for correlations
  confidence NUMERIC(4,3) NOT NULL,                      -- Confidence score 0-1
  time_lag_days INTEGER DEFAULT 0,                       -- Lag between metrics (e.g., sleep affects next-day recovery)
  direction TEXT CHECK (direction IN ('positive', 'negative')),
  is_active BOOLEAN DEFAULT true,
  first_observed DATE,
  last_observed DATE,
  sample_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pattern_type, metric_a, metric_b, time_lag_days)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_detected_patterns_user_id ON public.detected_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_detected_patterns_active ON public.detected_patterns(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_detected_patterns_type ON public.detected_patterns(pattern_type);

-- Disable RLS for development
ALTER TABLE public.detected_patterns DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.detected_patterns TO anon, authenticated;
