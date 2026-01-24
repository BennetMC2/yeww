import { NextRequest, NextResponse } from 'next/server';
import { getActivePatterns } from '@/lib/correlationEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const patterns = await getActivePatterns(userId);

    return NextResponse.json({
      success: true,
      patterns: patterns.map(p => ({
        id: p.id,
        description: p.description,
        metricA: p.metricA,
        metricB: p.metricB,
        correlationStrength: p.correlationStrength,
        confidence: p.confidence,
        direction: p.direction,
        timeLagDays: p.timeLagDays,
        lastObserved: p.lastObserved,
        sampleSize: p.sampleSize,
      })),
    });
  } catch (error) {
    console.error('Get patterns error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
