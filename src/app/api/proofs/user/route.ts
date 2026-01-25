import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { UserProof, ProofStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get user's proofs with opportunity details
    const { data: proofs, error } = await supabase
      .from('user_proofs')
      .select(`
        id,
        user_id,
        opportunity_id,
        status,
        proof_hash,
        verified_at,
        hp_awarded,
        created_at,
        proof_opportunities (
          title,
          partner_name,
          requirement_type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user proofs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch proofs' },
        { status: 500 }
      );
    }

    const formattedProofs: (UserProof & { opportunityTitle?: string; partnerName?: string })[] = proofs.map(p => ({
      id: p.id,
      userId: p.user_id,
      opportunityId: p.opportunity_id,
      status: p.status as ProofStatus,
      proofHash: p.proof_hash,
      verifiedAt: p.verified_at,
      hpAwarded: p.hp_awarded,
      createdAt: p.created_at,
      opportunityTitle: (p.proof_opportunities as { title?: string } | null)?.title,
      partnerName: (p.proof_opportunities as { partner_name?: string } | null)?.partner_name,
    }));

    return NextResponse.json({ proofs: formattedProofs });
  } catch (error) {
    console.error('User proofs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
