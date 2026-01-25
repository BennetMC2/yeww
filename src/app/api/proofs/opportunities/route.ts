import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkEligibility } from '@/lib/proofGenerator';
import { seedOpportunities } from '@/lib/seedOpportunities';
import { ProofOpportunity, RequirementType } from '@/types';

interface OpportunityWithEligibility extends ProofOpportunity {
  isEligible: boolean;
  actualValue?: number;
  alreadyClaimed: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Ensure opportunities are seeded
    await seedOpportunities();

    // Get active opportunities
    const { data: opportunities, error } = await supabase
      .from('proof_opportunities')
      .select('*')
      .eq('is_active', true)
      .order('hp_reward', { ascending: false });

    if (error) {
      console.error('Error fetching opportunities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch opportunities' },
        { status: 500 }
      );
    }

    // Get user's claimed proofs
    const { data: userProofs } = await supabase
      .from('user_proofs')
      .select('opportunity_id, status')
      .eq('user_id', userId);

    const claimedOpportunityIds = new Set(
      userProofs
        ?.filter(p => p.status === 'claimed' || p.status === 'verified')
        .map(p => p.opportunity_id) || []
    );

    // Check eligibility for each opportunity
    const opportunitiesWithEligibility: OpportunityWithEligibility[] = await Promise.all(
      opportunities.map(async (opp) => {
        const alreadyClaimed = claimedOpportunityIds.has(opp.id);

        // Skip eligibility check if already claimed
        if (alreadyClaimed) {
          return {
            id: opp.id,
            title: opp.title,
            description: opp.description,
            partnerName: opp.partner_name,
            partnerLogo: opp.partner_logo,
            hpReward: opp.hp_reward,
            requirementType: opp.requirement_type as RequirementType,
            requirementThreshold: opp.requirement_threshold,
            requirementDays: opp.requirement_days,
            expiresAt: opp.expires_at,
            isActive: opp.is_active,
            maxClaims: opp.max_claims,
            currentClaims: opp.current_claims,
            isEligible: false,
            alreadyClaimed: true,
          };
        }

        // Check if max claims reached
        if (opp.max_claims && opp.current_claims >= opp.max_claims) {
          return {
            id: opp.id,
            title: opp.title,
            description: opp.description,
            partnerName: opp.partner_name,
            partnerLogo: opp.partner_logo,
            hpReward: opp.hp_reward,
            requirementType: opp.requirement_type as RequirementType,
            requirementThreshold: opp.requirement_threshold,
            requirementDays: opp.requirement_days,
            expiresAt: opp.expires_at,
            isActive: opp.is_active,
            maxClaims: opp.max_claims,
            currentClaims: opp.current_claims,
            isEligible: false,
            alreadyClaimed: false,
          };
        }

        const { eligible, actualValue } = await checkEligibility(
          userId,
          opp.requirement_type as RequirementType,
          opp.requirement_threshold,
          opp.requirement_days
        );

        return {
          id: opp.id,
          title: opp.title,
          description: opp.description,
          partnerName: opp.partner_name,
          partnerLogo: opp.partner_logo,
          hpReward: opp.hp_reward,
          requirementType: opp.requirement_type as RequirementType,
          requirementThreshold: opp.requirement_threshold,
          requirementDays: opp.requirement_days,
          expiresAt: opp.expires_at,
          isActive: opp.is_active,
          maxClaims: opp.max_claims,
          currentClaims: opp.current_claims,
          isEligible: eligible,
          actualValue,
          alreadyClaimed: false,
        };
      })
    );

    return NextResponse.json({
      opportunities: opportunitiesWithEligibility,
    });
  } catch (error) {
    console.error('Opportunities API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
