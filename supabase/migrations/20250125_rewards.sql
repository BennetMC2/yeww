-- Rewards System Tables
-- User HP balances, transactions, proof opportunities, and user proofs

-- User HP balances
CREATE TABLE IF NOT EXISTS public.user_rewards (
  user_id TEXT PRIMARY KEY,
  hp_balance INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  reputation_tier TEXT DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HP transaction history
CREATE TABLE IF NOT EXISTS public.hp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'earn_behavior', 'earn_sharing', 'redeem', 'bonus'
  description TEXT NOT NULL,
  reference_id TEXT, -- links to opportunity_id or activity
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proof opportunities (what partners are asking for)
CREATE TABLE IF NOT EXISTS public.proof_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  partner_logo TEXT,
  hp_reward INTEGER NOT NULL,
  requirement_type TEXT NOT NULL, -- 'steps_avg', 'sleep_avg', 'recovery_avg', etc.
  requirement_threshold NUMERIC NOT NULL,
  requirement_days INTEGER DEFAULT 7,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  max_claims INTEGER,
  current_claims INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User proof submissions
CREATE TABLE IF NOT EXISTS public.user_proofs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  opportunity_id UUID REFERENCES proof_opportunities(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'claimed', 'failed'
  proof_hash TEXT, -- mock ZK proof hash
  verified_at TIMESTAMPTZ,
  hp_awarded INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily reward claims (prevent double claiming)
CREATE TABLE IF NOT EXISTS public.daily_reward_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  claim_date DATE NOT NULL,
  reward_type TEXT NOT NULL, -- 'steps', 'sleep', 'recovery'
  hp_awarded INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, claim_date, reward_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hp_transactions_user ON hp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_hp_transactions_created ON hp_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_proofs_user ON user_proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_proofs_opportunity ON user_proofs(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_proof_opportunities_active ON proof_opportunities(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_daily_reward_claims_user_date ON daily_reward_claims(user_id, claim_date);

-- Disable RLS for development
ALTER TABLE public.user_rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hp_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_proofs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reward_claims DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.user_rewards TO anon, authenticated;
GRANT ALL ON public.hp_transactions TO anon, authenticated;
GRANT ALL ON public.proof_opportunities TO anon, authenticated;
GRANT ALL ON public.user_proofs TO anon, authenticated;
GRANT ALL ON public.daily_reward_claims TO anon, authenticated;
