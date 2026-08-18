import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/prebook/mine
 *
 * Returns the signed-in user's confirmed crash-course prebooking (matched by the
 * email on the booking, which the login-gated prebook flow fills from the auth
 * account). Used to show the "you're prebooked — pay the balance within 15 days"
 * banner on the dashboard subscription page.
 */
const REMAINING_WINDOW_DAYS = 15;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ prebooked: false }, { status: 401 });

    const admin = createAdminClient();
    if (!admin || !user.email) return NextResponse.json({ prebooked: false });

    const { data } = await admin
      .from('prebookings')
      .select('reference, status, amount_paisa, updated_at, created_at')
      .eq('email', user.email)
      .eq('status', 'confirmed')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return NextResponse.json({ prebooked: false });

    const confirmedAt = data.updated_at ?? data.created_at;
    const deadline = new Date(new Date(confirmedAt).getTime() + REMAINING_WINDOW_DAYS * 86400000);
    const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000));

    return NextResponse.json({
      prebooked: true,
      reference: data.reference,
      confirmedAt,
      deadline: deadline.toISOString(),
      daysLeft,
      windowDays: REMAINING_WINDOW_DAYS,
      depositPaidNpr: (data.amount_paisa ?? 30000) / 100,
    });
  } catch (err) {
    console.error('prebook/mine error:', err);
    return NextResponse.json({ prebooked: false });
  }
}
