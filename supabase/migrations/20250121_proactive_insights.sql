-- Proactive insights table
-- Stores AI-generated insights triggered by new health data

CREATE TABLE IF NOT EXISTS public.proactive_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,              -- Our app's user_id (reference_id)
  message TEXT NOT NULL,              -- The AI-generated insight message
  type TEXT NOT NULL,                 -- 'notable_change' | 'pattern' | 'milestone' | 'concern'
  priority TEXT NOT NULL,             -- 'high' | 'medium' | 'low'
  data_context JSONB,                 -- Context data that triggered this insight
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_proactive_insights_user_id ON public.proactive_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_created_at ON public.proactive_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_unread ON public.proactive_insights(user_id, read) WHERE read = FALSE;

-- Disable RLS for development (enable with proper policies for production)
ALTER TABLE public.proactive_insights DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.proactive_insights TO anon, authenticated;
