import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, weightKg, date } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!weightKg || typeof weightKg !== 'number' || weightKg <= 0) {
      return NextResponse.json(
        { error: 'Valid weightKg is required' },
        { status: 400 }
      );
    }

    // Use provided date or today
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Upsert to health_daily with manual weight
    const { data, error } = await supabase
      .from('health_daily')
      .upsert(
        {
          user_id: userId,
          date: targetDate,
          weight_kg: weightKg,
          weight_source: 'manual',
          data_sources: ['manual'],
        },
        {
          onConflict: 'user_id,date',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving weight:', error);
      return NextResponse.json(
        { error: 'Failed to save weight' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        date: targetDate,
        weightKg,
        source: 'manual',
      },
    });
  } catch (error) {
    console.error('Weight API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
