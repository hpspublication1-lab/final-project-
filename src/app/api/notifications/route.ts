import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    let query = admin
      .from('notifications')
      .select('id, title, message, type, is_read, action_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const [notifsRes, unreadCountRes] = await Promise.all([
      query,
      admin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false),
    ]);

    if (notifsRes.error) {
      return NextResponse.json({ success: false, error: notifsRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notifications: notifsRes.data || [],
      unreadCount: unreadCountRes.count ?? 0,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { ids, all } = body;

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    if (all) {
      const { error } = await admin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
    }

    if (Array.isArray(ids) && ids.length > 0) {
      if (ids.length > 100) {
        return NextResponse.json({ success: false, error: 'Maximum 100 notification IDs allowed per request.' }, { status: 400 });
      }

      const { error } = await admin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('id', ids);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: `${ids.length} notifications marked as read.` });
    }

    return NextResponse.json({ success: false, error: 'No notification IDs specified.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
