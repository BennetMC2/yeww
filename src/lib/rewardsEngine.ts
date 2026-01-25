/**
 * Rewards Engine
 * Core HP awarding and balance management logic
 */

import { supabase } from './supabase';
import { UserRewards, HPTransaction, HPTransactionType, ReputationTier } from '@/types';

/**
 * Get reputation tier from score
 */
export function getReputationTier(score: number): ReputationTier {
  if (score >= 300) return 'elite';
  if (score >= 150) return 'trusted';
  if (score >= 50) return 'verified';
  return 'starter';
}

/**
 * Calculate HP bonus multiplier based on reputation tier
 */
export function getTierBonusMultiplier(tier: ReputationTier): number {
  switch (tier) {
    case 'elite': return 1.25;
    case 'trusted': return 1.15;
    case 'verified': return 1.1;
    default: return 1.0;
  }
}

/**
 * Get or create user rewards record
 */
export async function getOrCreateUserRewards(userId: string): Promise<UserRewards | null> {
  try {
    // Try to get existing record
    const { data: existing, error: fetchError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing && !fetchError) {
      return {
        userId: existing.user_id,
        hpBalance: existing.hp_balance,
        lifetimeEarned: existing.lifetime_earned,
        reputationScore: existing.reputation_score,
        reputationTier: existing.reputation_tier as ReputationTier,
      };
    }

    // Create new record if doesn't exist
    const { data: created, error: createError } = await supabase
      .from('user_rewards')
      .insert({
        user_id: userId,
        hp_balance: 0,
        lifetime_earned: 0,
        reputation_score: 0,
        reputation_tier: 'starter',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user rewards:', createError);
      return null;
    }

    return {
      userId: created.user_id,
      hpBalance: created.hp_balance,
      lifetimeEarned: created.lifetime_earned,
      reputationScore: created.reputation_score,
      reputationTier: created.reputation_tier as ReputationTier,
    };
  } catch (error) {
    console.error('Error in getOrCreateUserRewards:', error);
    return null;
  }
}

/**
 * Award HP to a user
 */
export async function awardHP(
  userId: string,
  amount: number,
  type: HPTransactionType,
  description: string,
  referenceId?: string
): Promise<{ success: boolean; newBalance?: number; transaction?: HPTransaction }> {
  try {
    // Get current rewards
    const rewards = await getOrCreateUserRewards(userId);
    if (!rewards) {
      return { success: false };
    }

    // Apply tier bonus for earning (not redeeming)
    let finalAmount = amount;
    if (type !== 'redeem') {
      const multiplier = getTierBonusMultiplier(rewards.reputationTier);
      finalAmount = Math.round(amount * multiplier);
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('hp_transactions')
      .insert({
        user_id: userId,
        amount: finalAmount,
        type,
        description,
        reference_id: referenceId,
      })
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction:', txError);
      return { success: false };
    }

    // Update balance
    const newBalance = rewards.hpBalance + finalAmount;
    const newLifetimeEarned = type !== 'redeem'
      ? rewards.lifetimeEarned + finalAmount
      : rewards.lifetimeEarned;

    const { error: updateError } = await supabase
      .from('user_rewards')
      .update({
        hp_balance: newBalance,
        lifetime_earned: newLifetimeEarned,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating balance:', updateError);
      return { success: false };
    }

    return {
      success: true,
      newBalance,
      transaction: {
        id: transaction.id,
        userId: transaction.user_id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        referenceId: transaction.reference_id,
        createdAt: transaction.created_at,
      },
    };
  } catch (error) {
    console.error('Error in awardHP:', error);
    return { success: false };
  }
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 20
): Promise<HPTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('hp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data.map(tx => ({
      id: tx.id,
      userId: tx.user_id,
      amount: tx.amount,
      type: tx.type as HPTransactionType,
      description: tx.description,
      referenceId: tx.reference_id,
      createdAt: tx.created_at,
    }));
  } catch (error) {
    console.error('Error in getTransactionHistory:', error);
    return [];
  }
}

/**
 * Update reputation score and tier
 */
export async function updateReputationScore(
  userId: string,
  scoreChange: number
): Promise<{ success: boolean; newScore?: number; newTier?: ReputationTier }> {
  try {
    const rewards = await getOrCreateUserRewards(userId);
    if (!rewards) {
      return { success: false };
    }

    const newScore = Math.max(0, rewards.reputationScore + scoreChange);
    const newTier = getReputationTier(newScore);

    const { error } = await supabase
      .from('user_rewards')
      .update({
        reputation_score: newScore,
        reputation_tier: newTier,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating reputation:', error);
      return { success: false };
    }

    return { success: true, newScore, newTier };
  } catch (error) {
    console.error('Error in updateReputationScore:', error);
    return { success: false };
  }
}

/**
 * Check if a daily reward has already been claimed
 */
export async function hasDailyRewardBeenClaimed(
  userId: string,
  rewardType: 'steps' | 'sleep' | 'recovery',
  date: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('daily_reward_claims')
      .select('id')
      .eq('user_id', userId)
      .eq('claim_date', date)
      .eq('reward_type', rewardType)
      .limit(1);

    if (error) {
      console.error('Error checking daily claim:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error in hasDailyRewardBeenClaimed:', error);
    return false;
  }
}

/**
 * Record a daily reward claim
 */
export async function recordDailyRewardClaim(
  userId: string,
  rewardType: 'steps' | 'sleep' | 'recovery',
  date: string,
  hpAwarded: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('daily_reward_claims')
      .insert({
        user_id: userId,
        claim_date: date,
        reward_type: rewardType,
        hp_awarded: hpAwarded,
      });

    if (error) {
      // Unique constraint violation means already claimed
      if (error.code === '23505') {
        return false;
      }
      console.error('Error recording daily claim:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordDailyRewardClaim:', error);
    return false;
  }
}
