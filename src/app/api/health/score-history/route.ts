import { NextRequest, NextResponse } from 'next/server';
import { getHealthScoreTrend, getMetricTrends, HealthScoreTrend, MetricTrends } from '@/lib/healthHistory';

/**
 * GET /api/health/score-history
 * Returns health score trend and metric trends for the user
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch health score trend and metric trends in parallel
    const [scoreTrend, metricTrends] = await Promise.all([
      getHealthScoreTrend(userId),
      getMetricTrends(userId),
    ]);

    return NextResponse.json({
      scoreTrend,
      metricTrends,
      hasHistory: scoreTrend !== null,
    });
  } catch (error) {
    console.error('Error fetching health score history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health score history' },
      { status: 500 }
    );
  }
}
