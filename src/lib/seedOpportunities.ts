/**
 * Seed Opportunities
 * Pre-populate proof_opportunities with demo data
 */

import { supabase } from './supabase';

interface SeedOpportunity {
  title: string;
  description: string;
  partner_name: string;
  partner_logo?: string;
  hp_reward: number;
  requirement_type: string;
  requirement_threshold: number;
  requirement_days: number;
  expires_at?: string;
  is_active: boolean;
  max_claims?: number;
}

const SEED_OPPORTUNITIES: SeedOpportunity[] = [
  {
    title: 'Step Champion',
    description: 'Verify you averaged 10,000+ steps over the past week',
    partner_name: 'Acme Insurance',
    hp_reward: 100,
    requirement_type: 'steps_avg',
    requirement_threshold: 10000,
    requirement_days: 7,
    is_active: true,
  },
  {
    title: 'Active Lifestyle',
    description: 'Verify you averaged 8,000+ steps over the past 7 days',
    partner_name: 'HealthFirst',
    hp_reward: 75,
    requirement_type: 'steps_avg',
    requirement_threshold: 8000,
    requirement_days: 7,
    is_active: true,
  },
  {
    title: 'Sleep Star',
    description: 'Verify you averaged 7+ hours of sleep over the past week',
    partner_name: 'WellnessFirst',
    hp_reward: 75,
    requirement_type: 'sleep_avg',
    requirement_threshold: 7,
    requirement_days: 7,
    is_active: true,
  },
  {
    title: 'Recovery Pro',
    description: 'Verify your average recovery score exceeds 70 over 14 days',
    partner_name: 'FitResearch',
    hp_reward: 150,
    requirement_type: 'recovery_avg',
    requirement_threshold: 70,
    requirement_days: 14,
    is_active: true,
  },
  {
    title: 'Heart Health Study',
    description: 'Share your HRV data to contribute to cardiovascular research',
    partner_name: 'CardioLab Research',
    hp_reward: 200,
    requirement_type: 'hrv_avg',
    requirement_threshold: 30,
    requirement_days: 30,
    is_active: true,
    max_claims: 500,
  },
  {
    title: 'Fitness Consistency',
    description: 'Verify you maintained 6,000+ daily step average for a month',
    partner_name: 'ActiveLife Gym',
    hp_reward: 250,
    requirement_type: 'steps_avg',
    requirement_threshold: 6000,
    requirement_days: 30,
    is_active: true,
  },
];

/**
 * Seed the opportunities table with demo data
 * Safe to call multiple times - uses upsert logic
 */
export async function seedOpportunities(): Promise<{ success: boolean; count: number }> {
  try {
    // Check if opportunities already exist
    const { data: existing } = await supabase
      .from('proof_opportunities')
      .select('id')
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('Opportunities already seeded');
      return { success: true, count: 0 };
    }

    // Insert seed opportunities
    const { data, error } = await supabase
      .from('proof_opportunities')
      .insert(SEED_OPPORTUNITIES)
      .select();

    if (error) {
      console.error('Error seeding opportunities:', error);
      return { success: false, count: 0 };
    }

    console.log(`Seeded ${data.length} opportunities`);
    return { success: true, count: data.length };
  } catch (error) {
    console.error('Error in seedOpportunities:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Get all active opportunities
 */
export async function getActiveOpportunities() {
  const { data, error } = await supabase
    .from('proof_opportunities')
    .select('*')
    .eq('is_active', true)
    .order('hp_reward', { ascending: false });

  if (error) {
    console.error('Error fetching opportunities:', error);
    return [];
  }

  return data;
}
