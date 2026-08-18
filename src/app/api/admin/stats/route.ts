import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/config/superAdmin';

/**
 * GET /api/admin/stats — real dashboard KPIs for the super admin.
 * Every count is best-effort (a missing table just yields 0), so the panel
 * always renders. Revenue = completed payment_transactions + confirmed
 * prebooking deposits (Rs 300 each).
 */
const PAID_PLANS = ['student', 'pro', 'institution'];

async function count(admin: any, table: string, apply?: (q: any) => any): Promise<number> {
  try {
    let q = admin.from(table).select('*', { count: 'exact', head: true });
    if (apply) q = apply(q);
    const { count } = await q;
    return count ?? 0;
  } catch { return 0; }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    if (!isSuperAdmin(user.email)) return NextResponse.json({ error: 'Super admins only' }, { status: 403 });

    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 503 });

    const nowIso = new Date().toISOString();
    const dayAgo = new Date(Date.now() - 86400000).toISOString();

    // Subscribers: active paid plans.
    let subscribers = 0;
    let revenueNpr = 0;
    try {
      const { data: profs } = await admin.from('user_profiles').select('subscription_plan, subscription_expires_at');
      subscribers = (profs ?? []).filter((p: any) =>
        PAID_PLANS.includes(p.subscription_plan) && (!p.subscription_expires_at || new Date(p.subscription_expires_at) > new Date())
      ).length;
    } catch { /* 0 */ }

    // Revenue from completed gateway payments + confirmed prebook deposits.
    try {
      const { data: tx } = await admin.from('payment_transactions').select('amount_paisa, status').eq('status', 'completed');
      revenueNpr += (tx ?? []).reduce((s: number, t: any) => s + (t.amount_paisa ?? 0) / 100, 0);
    } catch { /* ignore */ }
    try {
      const { data: pb } = await admin.from('prebookings').select('amount_paisa, status').eq('status', 'confirmed');
      revenueNpr += (pb ?? []).reduce((s: number, p: any) => s + (p.amount_paisa ?? 30000) / 100, 0);
    } catch { /* ignore */ }

    // Active today via auth sign-ins.
    let activeToday = 0;
    try {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      activeToday = (list?.users ?? []).filter((u) => u.last_sign_in_at && u.last_sign_in_at > dayAgo).length;
    } catch { /* 0 */ }

    const [totalStudents, mcqPublished, upcomingClasses, prebookings, liveNow] = await Promise.all([
      count(admin, 'user_profiles'),
      count(admin, 'questions', (q) => q.eq('is_published', true)),
      count(admin, 'live_classes', (q) => q.eq('status', 'scheduled').gte('scheduled_at', nowIso)),
      count(admin, 'prebookings'),
      count(admin, 'live_classes', (q) => q.eq('status', 'live')),
    ]);

    return NextResponse.json({
      totalStudents,
      subscribers,
      revenueNpr,
      activeToday,
      mcqPublished,
      upcomingClasses,
      prebookings,
      liveNow,
    });
  } catch (err) {
    console.error('admin/stats error:', err);
    return NextResponse.json({ error: 'Could not load stats' }, { status: 500 });
  }
}
