import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateMockProof } from '@/lib/proofGenerator';
import { awardHP, updateReputationScore } from '@/lib/rewardsEngine';
import { RequirementType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, opportunityId } = body;

    if (!userId || !opportunityId) {
      return NextResponse.json(
        { error: 'userId and opportunityId are required' },
        { status: 400 }
      );
    }

    // Get the opportunity
    const { data: opportunity, error: oppError } = await supabase
      .from('proof_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Check if not active
    if (!opportunity.is_active) {
      return NextResponse.json(
        { success: false, reason: 'This opportunity is no longer active' },
        { status: 400 }
      );
    }

    // Check if max claims reached
    if (opportunity.max_claims && opportunity.current_claims >= opportunity.max_claims) {
      return NextResponse.json(
        { success: false, reason: 'This opportunity has reached its maximum claims' },
        { status: 400 }
      );
    }

    // Check if user already claimed this opportunity
    const { data: existingProof } = await supabase
      .from('user_proofs')
      .select('id, status')
      .eq('user_id', userId)
      .eq('opportunity_id', opportunityId)
      .in('status', ['verified', 'claimed'])
      .limit(1);

    if (existingProof && existingProof.length > 0) {
      return NextResponse.json(
        { success: false, reason: 'You have already claimed this opportunity' },
        { status: 400 }
      );
    }

    // Generate the proof
    const proofResult = await generateMockProof(
      userId,
      opportunity.requirement_type as RequirementType,
      opportunity.requirement_threshold,
      opportunity.requirement_days
    );

    if (!proofResult.eligible) {
      // Create failed proof record
      await supabase.from('user_proofs').insert({
        user_id: userId,
        opportunity_id: opportunityId,
        status: 'failed',
      });

      return NextResponse.json({
        success: false,
        reason: proofResult.message,
        actualValue: proofResult.actualValue,
      });
    }

    // Create proof record
    const { error: proofError } = await supabase.from('user_proofs').insert({
      user_id: userId,
      opportunity_id: opportunityId,
      status: 'claimed',
      proof_hash: proofResult.proofHash,
      verified_at: new Date().toISOString(),
      hp_awarded: opportunity.hp_reward,
    });

    if (proofError) {
      console.error('Error creating proof:', proofError);
      return NextResponse.json(
        { error: 'Failed to create proof record' },
        { status: 500 }
      );
    }

    // Award HP
    const hpResult = await awardHP(
      userId,
      opportunity.hp_reward,
      'earn_sharing',
      `Verified: ${opportunity.title}`,
      opportunityId
    );

    if (!hpResult.success) {
      console.error('Failed to award HP');
    }

    // Update reputation score (+10 for verified proof)
    await updateReputationScore(userId, 10);

    // Increment claim count
    await supabase
      .from('proof_opportunities')
      .update({ current_claims: opportunity.current_claims + 1 })
      .eq('id', opportunityId);

    return NextResponse.json({
      success: true,
      proofHash: proofResult.proofHash,
      hpAwarded: hpResult.success ? opportunity.hp_reward : 0,
      newBalance: hpResult.newBalance,
      message: `Successfully verified! Earned ${opportunity.hp_reward} HP.`,
    });
  } catch (error) {
    console.error('Proof generation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
