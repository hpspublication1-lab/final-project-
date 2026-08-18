import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/profile/complete  { fullName, phone, college, ceeYear }
 *
 * Saves the signed-in user's onboarding details. Writes with the service-role
 * client so it bypasses RLS (a recursive admin policy on user_profiles makes
 * direct client-side updates 500 until FIX-AUTH-RLS.sql is applied).
 *
 * Security: we ONLY ever update the caller's OWN row (id = session user) and
 * ONLY a fixed whitelist of profile fields — never is_admin, subscription_plan,
 * points, etc. — so the service role can't be used to escalate anything.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to continue' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const college = typeof body.college === 'string' ? body.college.trim() : '';
    const ceeYear = parseInt(String(body.ceeYear), 10);

    if (fullName.length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }
    if (!/^\+977[9][6-9]\d{8}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid Nepal mobile number.' }, { status: 400 });
    }
    if (!college) {
      return NextResponse.json({ error: 'Please enter your school or college.' }, { status: 400 });
    }
    if (![2026, 2027, 2028].includes(ceeYear)) {
      return NextResponse.json({ error: 'Please select a valid CEE target year.' }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    const { error } = await admin
      .from('user_profiles')
      .update({
        full_name: fullName,
        phone,
        college,
        cee_year: ceeYear,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id); // only ever the caller's own row

    if (error) {
      console.error('profile/complete update failed:', error.message);
      return NextResponse.json({ error: 'Could not save your details. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('profile/complete error:', err);
    return NextResponse.json({ error: 'Could not save your details. Please try again.' }, { status: 500 });
  }
}
