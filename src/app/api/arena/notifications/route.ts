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

    const { data: notifications } = await supabaseAdmin
      .from('arena_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15);

    return NextResponse.json({
      notifications: notifications || [
        { id: 'notif-1', title: '⚔️ Challenge Received', body: 'Aarav Sharma challenged you to a Biology battle!', is_read: false, created_at: new Date().toISOString() },
        { id: 'notif-2', title: '🏆 Rank Update', body: 'You moved up 8 positions to #127 in Nepal!', is_read: true, created_at: new Date().toISOString() },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}
