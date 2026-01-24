import { NextRequest, NextResponse } from 'next/server';
import { computeBaselines, saveBaselines, getCachedBaselines } from '@/lib/baselineComputer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, force } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Compute baselines
    console.log(`Computing baselines for user ${userId} (force=${force})`);
    const baselines = await computeBaselines(userId);

    if (baselines.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No data available to compute baselines',
        baselines: [],
      });
    }

    // Save to database
    const saved = await saveBaselines(userId, baselines);

    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save baselines' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Baselines computed and saved',
      baselines: baselines.map(b => ({
        metricType: b.metricType,
        avg7day: b.avg7day,
        avg30day: b.avg30day,
        sampleCount: b.sampleCount7day,
      })),
    });
  } catch (error) {
    console.error('Compute baselines error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const baselines = await getCachedBaselines(userId);

    if (!baselines) {
      return NextResponse.json({
        success: true,
        baselines: null,
        message: 'No baselines found',
      });
    }

    return NextResponse.json({
      success: true,
      baselines,
    });
  } catch (error) {
    console.error('Get baselines error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
