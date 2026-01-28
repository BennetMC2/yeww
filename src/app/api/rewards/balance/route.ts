import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUserRewards } from '@/lib/rewardsEngine';

// UUID v4 pattern for validation
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validate userId format (UUID or demo-user for testing)
function isValidUserId(userId: string): boolean {
  return UUID_PATTERN.test(userId) || userId === 'demo-user';
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

    if (!isValidUserId(userId)) {
      return NextResponse.json(
        { error: 'Invalid userId format' },
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
