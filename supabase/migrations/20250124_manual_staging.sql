-- Manual data staging table
-- Temporarily stores extracted data from screenshots for user confirmation

CREATE TABLE IF NOT EXISTS public.manual_data_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  image_data TEXT,                    -- base64, temporary storage
  extracted_metrics JSONB,            -- {"weight_kg": 78.5, "body_fat_percent": 15.2, "source_app": "Withings"}
  status TEXT CHECK (status IN ('pending', 'confirmed', 'rejected')) DEFAULT 'pending',
  target_date DATE NOT NULL,
  confidence NUMERIC(4,3),            -- Overall extraction confidence 0-1
  source_app TEXT,                    -- Detected app name
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manual_staging_user_id ON public.manual_data_staging(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_staging_status ON public.manual_data_staging(status);
CREATE INDEX IF NOT EXISTS idx_manual_staging_created_at ON public.manual_data_staging(created_at DESC);

-- Disable RLS for development
ALTER TABLE public.manual_data_staging DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.manual_data_staging TO anon, authenticated;
