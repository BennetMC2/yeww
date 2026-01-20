import { NextRequest, NextResponse } from 'next/server';
import { getLatestHealthMetrics } from '@/lib/healthData';
import { getMetricTrends } from '@/lib/healthHistory';
import { generateDailyInsight, DailyInsight } from '@/lib/insightGenerator';
import { getCachedMetrics, setCachedMetrics, hasCachedMetrics } from '@/lib/metricsCache';
import { supabase } from '@/lib/supabase';

interface CachedInsight {
  insight: DailyInsight;
  generatedAt: string;
}

// Cache duration in milliseconds (4 hours)
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000;

/**
 * GET /api/insights/daily
 * Returns today's AI-generated insight for the user
 * Cached for 4 hours to avoid regenerating too frequently
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
    // Check cache first
    const cacheKey = `insight_${userId}_${new Date().toISOString().split('T')[0]}`;
    const { data: cacheData } = await supabase
      .from('cache')
      .select('value, created_at')
      .eq('key', cacheKey)
      .single();

    if (cacheData) {
      const cached = cacheData.value as CachedInsight;
      const cachedAt = new Date(cacheData.created_at).getTime();
      const now = Date.now();

      // Return cached if still valid
      if (now - cachedAt < CACHE_DURATION_MS) {
        return NextResponse.json({
          insight: cached.insight,
          cached: true,
          generatedAt: cached.generatedAt,
        });
      }
    }

    // Run all queries in parallel for speed
    const [profileResult, metricsResult, trends] = await Promise.all([
      supabase
        .from('profiles')
        .select('check_in_streak, created_at')
        .eq('id', userId)
        .single(),
      hasCachedMetrics(userId)
        ? Promise.resolve(getCachedMetrics(userId) ?? null)
        : getLatestHealthMetrics(userId).then(m => { setCachedMetrics(userId, m); return m; }),
      getMetricTrends(userId),
    ]);
    const metrics = metricsResult ?? null;

    const profile = profileResult.data;
    const streak = profile?.check_in_streak ?? 0;
    const daysOnPlatform = profile?.created_at
      ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Generate insight
    const insight = generateDailyInsight(metrics, trends, streak, daysOnPlatform);
    const generatedAt = new Date().toISOString();

    // Cache the result (upsert) - ignore errors if cache table doesn't exist
    const cacheValue: CachedInsight = { insight, generatedAt };
    try {
      await supabase
        .from('cache')
        .upsert({
          key: cacheKey,
          value: cacheValue,
          created_at: new Date().toISOString(),
        }, { onConflict: 'key' });
    } catch {
      // Cache table might not exist, that's okay
    }

    return NextResponse.json({
      insight,
      cached: false,
      generatedAt,
    });
  } catch (error) {
    console.error('Error generating daily insight:', error);

    // Return fallback insight on error
    return NextResponse.json({
      insight: {
        id: 'error-fallback',
        text: 'Keep checking in to unlock personalized insights.',
        sentiment: 'neutral',
      },
      cached: false,
      error: true,
    });
  }
}
