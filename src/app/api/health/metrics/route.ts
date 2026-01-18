import { NextRequest, NextResponse } from 'next/server';
import { getHealthSummary } from '@/lib/healthData';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const summary = await getHealthSummary(userId);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Health metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health metrics' },
      { status: 500 }
    );
  }
}
