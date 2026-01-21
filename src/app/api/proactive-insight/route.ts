import { NextRequest, NextResponse } from 'next/server';
import { processNewHealthData } from '@/lib/proactiveInsight';

/**
 * POST /api/proactive-insight
 * Trigger proactive insight generation for new health data
 * Called internally by the Terra webhook after storing new data
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, dataType, data } = await request.json();

    if (!userId || !dataType || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, dataType, data' },
        { status: 400 }
      );
    }

    // Process the data and potentially generate an insight
    const insight = await processNewHealthData(userId, dataType, data);

    if (insight) {
      return NextResponse.json({
        generated: true,
        insight,
      });
    }

    return NextResponse.json({
      generated: false,
      reason: 'No notable changes detected or rate limit reached',
    });
  } catch (error) {
    console.error('Proactive insight generation error:', error);
    return NextResponse.json(
      { error: 'Failed to process health data' },
      { status: 500 }
    );
  }
}
