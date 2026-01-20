import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  // Check if user exists in users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  // Check terra_users for this reference_id
  const { data: terraData, error: terraError } = await supabase
    .from('terra_users')
    .select('*')
    .eq('reference_id', userId);

  // Check terra_data_payloads for this reference_id
  const { data: payloads, error: payloadsError } = await supabase
    .from('terra_data_payloads')
    .select('id, type, created_at')
    .eq('reference_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    userId,
    user: {
      exists: !!userData,
      data: userData,
      error: userError?.message,
    },
    terra: {
      users: terraData,
      error: terraError?.message,
    },
    payloads: {
      count: payloads?.length || 0,
      data: payloads,
      error: payloadsError?.message,
    },
  });
}
