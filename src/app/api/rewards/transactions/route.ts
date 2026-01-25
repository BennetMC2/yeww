import { NextRequest, NextResponse } from 'next/server';
import { getTransactionHistory } from '@/lib/rewardsEngine';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const transactions = await getTransactionHistory(userId, limit);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
