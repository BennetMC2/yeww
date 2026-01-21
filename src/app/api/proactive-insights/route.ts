import { NextRequest, NextResponse } from 'next/server';
import { getUnreadInsights, markInsightAsRead, dismissAllInsights } from '@/lib/proactiveInsight';

/**
 * GET /api/proactive-insights?userId=xxx
 * Fetch unread proactive insights for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const insights = await getUnreadInsights(userId);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error fetching proactive insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/proactive-insights
 * Mark insight(s) as read
 * Body: { insightId: string } - mark single insight as read
 * Body: { userId: string, dismissAll: true } - dismiss all for user
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.dismissAll && body.userId) {
      const success = await dismissAllInsights(body.userId);
      return NextResponse.json({ success });
    }

    if (body.insightId) {
      const success = await markInsightAsRead(body.insightId);
      return NextResponse.json({ success });
    }

    return NextResponse.json(
      { error: 'Missing insightId or userId+dismissAll' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating insight:', error);
    return NextResponse.json(
      { error: 'Failed to update insight' },
      { status: 500 }
    );
  }
}
