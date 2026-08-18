import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/practice/quota
 *
 * Free accounts may attempt 200 practice MCQs per calendar month; paid plans
 * (and prebookers, granted Pro) are unlimited. Counts practice_attempts for the
 * current month with the service-role client (bypasses the user_profiles RLS
 * recursion and reads the caller's own attempts).
 */
const FREE_MONTHLY_LIMIT = 200;
const PAID_PLANS = ['student', 'pro', 'institution'];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ unlimited: true, used: 0, limit: FREE_MONTHLY_LIMIT, remaining: FREE_MONTHLY_LIMIT, limited: false });
    }

    const { data: prof } = await admin
      .from('user_profiles')
      .select('subscription_plan, subscription_expires_at, is_admin')
      .eq('id', user.id)
      .single();

    const exp = prof?.subscription_expires_at;
    const planActive = !exp || new Date(exp) > new Date();
    const paid = PAID_PLANS.includes(prof?.subscription_plan);
    const unlimited = !!prof?.is_admin || (paid && planActive);

    let used = 0;
    if (!unlimited) {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { count } = await admin
        .from('practice_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .gte('created_at', start.toISOString());
      used = count ?? 0;
    }

    return NextResponse.json({
      unlimited,
      used,
      limit: FREE_MONTHLY_LIMIT,
      remaining: unlimited ? null : Math.max(0, FREE_MONTHLY_LIMIT - used),
      limited: !unlimited && used >= FREE_MONTHLY_LIMIT,
    });
  } catch (err) {
    console.error('practice/quota error:', err);
    // Fail open so a transient error never blocks practice.
    return NextResponse.json({ unlimited: true, used: 0, limit: FREE_MONTHLY_LIMIT, remaining: FREE_MONTHLY_LIMIT, limited: false });
  }
}
