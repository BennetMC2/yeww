import { NextRequest, NextResponse } from 'next/server';
import { getLatestHealthMetrics } from '@/lib/healthData';
import { getCachedMetrics, setCachedMetrics, hasCachedMetrics } from '@/lib/metricsCache';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check cache first
    if (hasCachedMetrics(userId)) {
      const cachedMetrics = getCachedMetrics(userId);
      return NextResponse.json({
        hasData: cachedMetrics !== null,
        lastSync: null, // Skip last sync query for cached response
        metrics: cachedMetrics,
        cached: true,
      });
    }

    // Fetch fresh metrics
    const metrics = await getLatestHealthMetrics(userId);

    // Cache the result
    setCachedMetrics(userId, metrics);

    if (!metrics) {
      return NextResponse.json({
        hasData: false,
        lastSync: null,
        metrics: null,
      });
    }

    // Get last sync time (lightweight query)
    const { data } = await supabase
      .from('terra_data_payloads')
      .select('created_at')
      .eq('reference_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json({
      hasData: true,
      lastSync: data?.[0]?.created_at || null,
      metrics,
    });
  } catch (error) {
    console.error('Health metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health metrics', hasData: false, metrics: null },
      { status: 500 }
    );
  }
}
