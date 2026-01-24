/**
 * Screenshot Extractor
 * Uses Claude Vision to extract health metrics from app screenshots and scale photos
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export interface ExtractedMetrics {
  weightKg: number | null;
  bodyFatPercent: number | null;
  steps: number | null;
  sleepHours: number | null;
  heartRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  sourceApp: string | null;
  confidence: number;
  extractedDate: string | null;
  rawText: string;
}

const EXTRACTION_PROMPT = `You are an expert at extracting health data from app screenshots and photos of scales/medical devices.

Analyze this image and extract any health metrics you can find. Look for:
- Weight (in kg or lbs - convert lbs to kg by multiplying by 0.453592)
- Body fat percentage
- Steps count
- Sleep duration (in hours)
- Heart rate / pulse
- Blood pressure (systolic/diastolic)
- The date/time if shown
- The app or device name if identifiable

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "weight_kg": number or null,
  "body_fat_percent": number or null,
  "steps": number or null,
  "sleep_hours": number or null,
  "heart_rate": number or null,
  "blood_pressure_systolic": number or null,
  "blood_pressure_diastolic": number or null,
  "source_app": "app name" or null,
  "extracted_date": "YYYY-MM-DD" or null,
  "confidence": number between 0 and 1,
  "raw_text": "any relevant text you can see"
}

Confidence guidelines:
- 0.9-1.0: Clear numbers, high quality image, recognized app
- 0.7-0.9: Numbers readable but some uncertainty (e.g., unit unclear)
- 0.5-0.7: Some numbers visible but blurry or partially obscured
- Below 0.5: Mostly guessing, recommend user verification

If you cannot extract any metrics, return confidence of 0 with null values.
If the image is not a health-related screenshot, return all nulls with confidence 0.`;

/**
 * Convert base64 data URL to raw base64 and media type
 */
function parseDataUrl(dataUrl: string): { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' } {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    // Assume it's raw base64 jpeg if no prefix
    return { base64: dataUrl, mediaType: 'image/jpeg' };
  }

  const mimeType = matches[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  return {
    base64: matches[2],
    mediaType: mimeType,
  };
}

/**
 * Extract health metrics from an image using Claude Vision
 */
export async function extractMetricsFromImage(imageData: string): Promise<ExtractedMetrics> {
  const { base64, mediaType } = parseDataUrl(imageData);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract JSON from response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse JSON response
    let parsed;
    try {
      // Clean any markdown code blocks if present
      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse extraction response:', textContent.text);
      return {
        weightKg: null,
        bodyFatPercent: null,
        steps: null,
        sleepHours: null,
        heartRate: null,
        bloodPressureSystolic: null,
        bloodPressureDiastolic: null,
        sourceApp: null,
        confidence: 0,
        extractedDate: null,
        rawText: textContent.text,
      };
    }

    return {
      weightKg: parsed.weight_kg ?? null,
      bodyFatPercent: parsed.body_fat_percent ?? null,
      steps: parsed.steps ?? null,
      sleepHours: parsed.sleep_hours ?? null,
      heartRate: parsed.heart_rate ?? null,
      bloodPressureSystolic: parsed.blood_pressure_systolic ?? null,
      bloodPressureDiastolic: parsed.blood_pressure_diastolic ?? null,
      sourceApp: parsed.source_app ?? null,
      confidence: parsed.confidence ?? 0,
      extractedDate: parsed.extracted_date ?? null,
      rawText: parsed.raw_text ?? '',
    };
  } catch (error) {
    console.error('Error extracting metrics from image:', error);
    return {
      weightKg: null,
      bodyFatPercent: null,
      steps: null,
      sleepHours: null,
      heartRate: null,
      bloodPressureSystolic: null,
      bloodPressureDiastolic: null,
      sourceApp: null,
      confidence: 0,
      extractedDate: null,
      rawText: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate extracted metrics
 */
export function validateMetrics(metrics: ExtractedMetrics): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check weight is reasonable (20-300 kg)
  if (metrics.weightKg !== null && (metrics.weightKg < 20 || metrics.weightKg > 300)) {
    issues.push('Weight value seems unrealistic');
  }

  // Check body fat is reasonable (3-60%)
  if (metrics.bodyFatPercent !== null && (metrics.bodyFatPercent < 3 || metrics.bodyFatPercent > 60)) {
    issues.push('Body fat percentage seems unrealistic');
  }

  // Check steps is reasonable (0-100,000)
  if (metrics.steps !== null && (metrics.steps < 0 || metrics.steps > 100000)) {
    issues.push('Steps count seems unrealistic');
  }

  // Check sleep is reasonable (0-24 hours)
  if (metrics.sleepHours !== null && (metrics.sleepHours < 0 || metrics.sleepHours > 24)) {
    issues.push('Sleep duration seems unrealistic');
  }

  // Check heart rate is reasonable (30-220 bpm)
  if (metrics.heartRate !== null && (metrics.heartRate < 30 || metrics.heartRate > 220)) {
    issues.push('Heart rate seems unrealistic');
  }

  // Low confidence warning
  if (metrics.confidence < 0.5) {
    issues.push('Low extraction confidence - please verify values');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
