-- Add weight_source column to health_daily
-- Tracks the source of weight data: 'manual', 'wearable', 'screenshot'

ALTER TABLE public.health_daily
ADD COLUMN IF NOT EXISTS weight_source TEXT CHECK (weight_source IN ('manual', 'wearable', 'screenshot'));

-- Index for filtering by weight source
CREATE INDEX IF NOT EXISTS idx_health_daily_weight_source ON public.health_daily(weight_source) WHERE weight_source IS NOT NULL;
