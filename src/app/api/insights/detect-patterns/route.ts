import { NextRequest, NextResponse } from 'next/server';
import { detectPatterns, savePatterns } from '@/lib/correlationEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Detect patterns
    console.log(`Detecting patterns for user ${userId}`);
    const patterns = await detectPatterns(userId);

    if (patterns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No significant patterns detected',
        patterns: [],
      });
    }

    // Save to database
    const saved = await savePatterns(patterns);

    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save patterns' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Detected ${patterns.length} patterns`,
      patterns: patterns.map(p => ({
        metricA: p.metricA,
        metricB: p.metricB,
        description: p.description,
        correlationStrength: p.correlationStrength,
        confidence: p.confidence,
        direction: p.direction,
        sampleSize: p.sampleSize,
      })),
    });
  } catch (error) {
    console.error('Detect patterns error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
