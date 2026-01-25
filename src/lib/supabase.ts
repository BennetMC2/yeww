import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (matching our schema)
export interface DbUser {
  id: string;
  created_at: string;
  updated_at: string;
  email: string | null;
  name: string | null;
  coaching_style: 'direct' | 'supportive' | 'balanced' | null;
  priorities: string[];
  past_attempt: string | null;
  barriers: string[];
  data_sources: string[];
  connected_apps: string[];
  health_areas: Record<string, unknown>[];
  health_score: number;
  reputation_level: string;
  reputation_points: number;
  points: number;
  check_in_streak: number;
  last_check_in: string | null;
  sharing_research: boolean;
  sharing_brands: boolean;
  sharing_insurance: boolean;
  ai_data_access: boolean;
  terra_user_id: string | null;
  onboarding_completed: boolean;
}

export interface DbHealthDaily {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
  sleep_duration_minutes: number | null;
  sleep_quality_score: number | null;
  sleep_deep_minutes: number | null;
  sleep_rem_minutes: number | null;
  sleep_light_minutes: number | null;
  sleep_awake_minutes: number | null;
  sleep_start_time: string | null;
  sleep_end_time: string | null;
  resting_heart_rate: number | null;
  hrv_average: number | null;
  hrv_max: number | null;
  steps: number | null;
  active_calories: number | null;
  total_calories: number | null;
  active_minutes: number | null;
  floors_climbed: number | null;
  distance_meters: number | null;
  weight_kg: number | null;
  body_fat_percent: number | null;
  recovery_score: number | null;
  readiness_score: number | null;
  strain_score: number | null;
  stress_score: number | null;
  spo2_average: number | null;
  respiratory_rate: number | null;
  data_sources: string[];
}

export interface DbConversation {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  created_at: string;
  role: 'user' | 'assistant';
  content: string;
  quick_actions: { label: string; value: string }[] | null;
  health_context: Record<string, unknown>;
}

export interface DbProgressEntry {
  id: string;
  user_id: string;
  created_at: string;
  date: string;
  entry_type: 'photo' | 'milestone' | 'note';
  category: 'body' | 'skin' | 'general';
  content: string;
  note: string | null;
}

export interface DbPointsHistory {
  id: string;
  user_id: string;
  created_at: string;
  type: string;
  amount: number;
  description: string | null;
}

export interface DbInsight {
  id: string;
  user_id: string;
  created_at: string;
  category: string;
  title: string;
  description: string;
  confidence: number;
  occurrences: number;
  is_active: boolean;
  dismissed_at: string | null;
  related_metrics: string[];
  metadata: Record<string, unknown>;
}

export interface DbWorkout {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  workout_type: string | null;
  duration_minutes: number | null;
  calories: number | null;
  distance_meters: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  avg_pace: number | null;
  elevation_gain: number | null;
  source: string | null;
  external_id: string | null;
}

// Rewards system types
export interface DbUserRewards {
  user_id: string;
  hp_balance: number;
  lifetime_earned: number;
  reputation_score: number;
  reputation_tier: string;
  created_at: string;
  updated_at: string;
}

export interface DbHPTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  reference_id: string | null;
  created_at: string;
}

export interface DbProofOpportunity {
  id: string;
  title: string;
  description: string;
  partner_name: string;
  partner_logo: string | null;
  hp_reward: number;
  requirement_type: string;
  requirement_threshold: number;
  requirement_days: number;
  expires_at: string | null;
  is_active: boolean;
  max_claims: number | null;
  current_claims: number;
  created_at: string;
}

export interface DbUserProof {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: string;
  proof_hash: string | null;
  verified_at: string | null;
  hp_awarded: number | null;
  created_at: string;
}

export interface DbDailyRewardClaim {
  id: string;
  user_id: string;
  claim_date: string;
  reward_type: string;
  hp_awarded: number;
  created_at: string;
}
