import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Debug endpoint to inspect raw Terra data payloads
 * Usage: GET /api/debug/terra-data?userId=xxx
 * Or:    GET /api/debug/terra-data?listUsers=true
 *
 * PROTECTED: Only available in development mode
 */
export async function GET(request: NextRequest) {
  // Block access in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 403 }
    );
  }

  const listUsers = request.nextUrl.searchParams.get('listUsers');
  const userId = request.nextUrl.searchParams.get('userId');

  // List all users with Terra connections
  if (listUsers === 'true') {
    const { data: terraUsers } = await supabase
      .from('terra_users')
      .select('reference_id, provider, last_webhook_update')
      .order('last_webhook_update', { ascending: false });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      terraUsers: terraUsers || [],
      recentProfiles: profiles || [],
    });
  }

  if (!userId) {
    return NextResponse.json({
      error: 'userId required. Use ?listUsers=true to find your userId first.'
    }, { status: 400 });
  }

  // Get connected Terra users
  const { data: terraUsers, error: usersError } = await supabase
    .from('terra_users')
    .select('*')
    .eq('reference_id', userId);

  if (usersError) {
    return NextResponse.json({ error: 'Failed to query terra_users', details: usersError }, { status: 500 });
  }

  // Get recent data payloads (last 20, all types)
  const { data: payloads, error: payloadsError } = await supabase
    .from('terra_data_payloads')
    .select('*')
    .eq('reference_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (payloadsError) {
    return NextResponse.json({ error: 'Failed to query terra_data_payloads', details: payloadsError }, { status: 500 });
  }

  // Group payloads by type for easier reading
  const payloadsByType: Record<string, unknown[]> = {};
  for (const payload of payloads || []) {
    if (!payloadsByType[payload.type]) {
      payloadsByType[payload.type] = [];
    }
    payloadsByType[payload.type].push({
      id: payload.id,
      created_at: payload.created_at,
      data: payload.data,
    });
  }

  return NextResponse.json({
    userId,
    terraUsers: terraUsers || [],
    payloadCount: payloads?.length || 0,
    payloadTypes: Object.keys(payloadsByType),
    payloadsByType,
  }, { status: 200 });
}
