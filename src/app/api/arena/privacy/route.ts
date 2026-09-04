import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: settings } = await supabaseAdmin
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return NextResponse.json({
      settings: settings || {
        friend_requests_from: 'everyone',
        battle_invites_from: 'everyone',
        online_status_visibility: 'everyone',
        profile_visibility: 'public',
        match_history_visibility: 'public',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch privacy settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, settings } = body;

    if (!userId || !settings) {
      return NextResponse.json({ error: 'User ID and settings required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('user_privacy_settings')
      .upsert({
        user_id: userId,
        friend_requests_from: settings.friend_requests_from || 'everyone',
        battle_invites_from: settings.battle_invites_from || 'everyone',
        online_status_visibility: settings.online_status_visibility || 'everyone',
        profile_visibility: settings.profile_visibility || 'public',
        match_history_visibility: settings.match_history_visibility || 'public',
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Privacy settings updated' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update privacy settings' }, { status: 500 });
  }
}
