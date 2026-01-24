import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractMetricsFromImage, validateMetrics } from '@/lib/screenshotExtractor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, imageData, targetDate } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!imageData) {
      return NextResponse.json(
        { error: 'imageData is required' },
        { status: 400 }
      );
    }

    // Extract metrics using Claude Vision
    console.log(`Extracting metrics from screenshot for user ${userId}`);
    const extracted = await extractMetricsFromImage(imageData);

    // Validate the extracted metrics
    const validation = validateMetrics(extracted);

    // Use extracted date or provided date or today
    const date = extracted.extractedDate || targetDate || new Date().toISOString().split('T')[0];

    // Store in staging table
    const stagingRecord = {
      user_id: userId,
      image_data: imageData, // Store temporarily for reference
      extracted_metrics: {
        weight_kg: extracted.weightKg,
        body_fat_percent: extracted.bodyFatPercent,
        steps: extracted.steps,
        sleep_hours: extracted.sleepHours,
        heart_rate: extracted.heartRate,
        blood_pressure_systolic: extracted.bloodPressureSystolic,
        blood_pressure_diastolic: extracted.bloodPressureDiastolic,
        raw_text: extracted.rawText,
      },
      status: 'pending',
      target_date: date,
      confidence: extracted.confidence,
      source_app: extracted.sourceApp,
    };

    const { data: stagingData, error: stagingError } = await supabase
      .from('manual_data_staging')
      .insert(stagingRecord)
      .select()
      .single();

    if (stagingError) {
      console.error('Error storing staging data:', stagingError);
      // Continue anyway - extraction succeeded
    }

    return NextResponse.json({
      success: true,
      stagingId: stagingData?.id,
      extracted: {
        weightKg: extracted.weightKg,
        bodyFatPercent: extracted.bodyFatPercent,
        steps: extracted.steps,
        sleepHours: extracted.sleepHours,
        heartRate: extracted.heartRate,
        bloodPressure: extracted.bloodPressureSystolic && extracted.bloodPressureDiastolic
          ? `${extracted.bloodPressureSystolic}/${extracted.bloodPressureDiastolic}`
          : null,
        sourceApp: extracted.sourceApp,
        confidence: extracted.confidence,
        extractedDate: date,
      },
      validation: {
        valid: validation.valid,
        issues: validation.issues,
      },
    });
  } catch (error) {
    console.error('Extract screenshot error:', error);
    return NextResponse.json(
      { error: 'Failed to extract data from screenshot' },
      { status: 500 }
    );
  }
}
