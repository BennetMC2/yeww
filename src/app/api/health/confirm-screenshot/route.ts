import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ConfirmedMetrics {
  weightKg?: number | null;
  bodyFatPercent?: number | null;
  steps?: number | null;
  sleepHours?: number | null;
  heartRate?: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, stagingId, confirmedMetrics, targetDate } = body as {
      userId: string;
      stagingId?: string;
      confirmedMetrics: ConfirmedMetrics;
      targetDate: string;
    };

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!targetDate) {
      return NextResponse.json(
        { error: 'targetDate is required' },
        { status: 400 }
      );
    }

    // Build the health_daily update
    const healthUpdate: Record<string, unknown> = {
      user_id: userId,
      date: targetDate,
    };

    // Add confirmed metrics
    if (confirmedMetrics.weightKg != null) {
      healthUpdate.weight_kg = confirmedMetrics.weightKg;
      healthUpdate.weight_source = 'screenshot';
    }

    if (confirmedMetrics.bodyFatPercent != null) {
      healthUpdate.body_fat_percent = confirmedMetrics.bodyFatPercent;
    }

    if (confirmedMetrics.steps != null) {
      healthUpdate.steps = confirmedMetrics.steps;
    }

    if (confirmedMetrics.sleepHours != null) {
      healthUpdate.sleep_duration_minutes = Math.round(confirmedMetrics.sleepHours * 60);
    }

    if (confirmedMetrics.heartRate != null) {
      healthUpdate.resting_heart_rate = confirmedMetrics.heartRate;
    }

    // Merge data_sources
    healthUpdate.data_sources = ['screenshot'];

    // Upsert to health_daily
    const { error: healthError } = await supabase
      .from('health_daily')
      .upsert(healthUpdate, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false,
      });

    if (healthError) {
      console.error('Error saving confirmed metrics:', healthError);
      return NextResponse.json(
        { error: 'Failed to save confirmed metrics' },
        { status: 500 }
      );
    }

    // Update staging record if provided
    if (stagingId) {
      await supabase
        .from('manual_data_staging')
        .update({
          status: 'confirmed',
          image_data: null, // Clear image data after confirmation
          updated_at: new Date().toISOString(),
        })
        .eq('id', stagingId);
    }

    return NextResponse.json({
      success: true,
      message: 'Metrics saved successfully',
      saved: {
        date: targetDate,
        ...confirmedMetrics,
      },
    });
  } catch (error) {
    console.error('Confirm screenshot error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
