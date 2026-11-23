import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit } from '@/lib/security/rateLimiter';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimit = await enforceRateLimit(req, 'submission', 'doubt-reply');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many submissions. Please wait ${rateLimit.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: doubtId } = await params;
    if (!doubtId) {
      return NextResponse.json({ success: false, error: 'Doubt ID required' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { reply_text } = body;

    if (!reply_text || typeof reply_text !== 'string' || reply_text.trim().length < 1) {
      return NextResponse.json({ success: false, error: 'Reply text cannot be empty.' }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    // Check user role to see if this is a staff reply
    const { data: profile } = await admin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // app_metadata only — user_metadata is editable by the user themselves.
    const userMetaRole = String((user as any).app_metadata?.role || '').toLowerCase();
    const isStaff = profile?.is_admin || ['teacher', 'admin', 'super_admin'].includes(profile?.role || userMetaRole);

    const { data: reply, error: replyError } = await admin
      .from('doubt_replies')
      .insert({
        doubt_id: doubtId,
        user_id: user.id,
        reply_text: reply_text.trim(),
        is_staff_reply: !!isStaff,
      })
      .select('*')
      .single();

    if (replyError) {
      return NextResponse.json({ success: false, error: replyError.message }, { status: 500 });
    }

    // If staff replied, mark doubt as answered
    if (isStaff) {
      await admin
        .from('doubts')
        .update({ status: 'answered' })
        .eq('id', doubtId);
    }

    return NextResponse.json({ success: true, reply }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
