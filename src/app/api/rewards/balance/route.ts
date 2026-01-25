import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUserRewards } from '@/lib/rewardsEngine';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const rewards = await getOrCreateUserRewards(userId);

    if (!rewards) {
      return NextResponse.json(
        { error: 'Failed to get rewards' },
        { status: 500 }
      );
    }

    return NextResponse.json(rewards);
  } catch (error) {
    console.error('Rewards balance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
