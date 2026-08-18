import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/config/superAdmin';

/**
 * GET /api/admin/users — super-admin-only directory of every student.
 *
 * Joins auth.users (email, last sign-in), user_profiles (plan, points, etc.),
 * and prebookings (who reserved the crash course). Computes each user's tier
 * (subscriber vs free) and active/inactive status. Service-role so it bypasses
 * the user_profiles RLS recursion.
 */
const PAID_PLANS = ['student', 'pro', 'institution'];
const ACTIVE_WINDOW_DAYS = 30;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    if (!isSuperAdmin(user.email)) return NextResponse.json({ error: 'Super admins only' }, { status: 403 });

    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 503 });

    const [{ data: authList }, { data: profiles }, { data: prebookings }] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from('user_profiles').select('id, full_name, phone, college, cee_year, subscription_plan, subscription_expires_at, is_admin, battle_rating, total_points, created_at'),
      admin.from('prebookings').select('email, status'),
    ]);

    const authMap = new Map((authList?.users ?? []).map((u) => [u.id, u]));
    const prebookByEmail = new Map<string, string>();
    (prebookings ?? []).forEach((p: any) => {
      if (p.email) prebookByEmail.set(p.email.toLowerCase(), p.status);
    });

    const now = Date.now();
    const users = (profiles ?? []).map((p: any) => {
      const au = authMap.get(p.id);
      const email = au?.email ?? '';
      const lastSignIn = au?.last_sign_in_at ?? null;
      const exp = p.subscription_expires_at;
      const planActive = !exp || new Date(exp) > new Date();
      const isSubscriber = PAID_PLANS.includes(p.subscription_plan) && planActive;
      const prebookStatus = email ? prebookByEmail.get(email.toLowerCase()) ?? null : null;
      const active = !!lastSignIn && (now - new Date(lastSignIn).getTime()) < ACTIVE_WINDOW_DAYS * 86400000;

      return {
        id: p.id,
        email,
        full_name: p.full_name || '',
        phone: p.phone || '',
        college: p.college || '',
        cee_year: p.cee_year ?? null,
        plan: p.subscription_plan ?? 'free',
        plan_expires_at: exp ?? null,
        is_subscriber: isSubscriber,
        is_admin: !!p.is_admin,
        prebook_status: prebookStatus,          // 'confirmed' | 'reserved' | ... | null
        is_prebooker: prebookStatus === 'confirmed',
        battle_rating: p.battle_rating ?? 1000,
        total_points: p.total_points ?? 0,
        last_sign_in_at: lastSignIn,
        active,
        created_at: p.created_at ?? au?.created_at ?? null,
      };
    });

    const summary = {
      total: users.length,
      subscribers: users.filter((u) => u.is_subscriber).length,
      prebookers: users.filter((u) => u.is_prebooker).length,
      free: users.filter((u) => !u.is_subscriber).length,
      active: users.filter((u) => u.active).length,
      inactive: users.filter((u) => !u.active).length,
    };

    return NextResponse.json({ users, summary });
  } catch (err) {
    console.error('admin/users error:', err);
    return NextResponse.json({ error: 'Could not load users' }, { status: 500 });
  }
}
