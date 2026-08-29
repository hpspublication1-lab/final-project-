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
    const college = typeof body.college === 'string' ? body.college.trim() : (typeof body.school === 'string' ? body.school.trim() : '');
    const program = typeof body.program === 'string' ? body.program.trim() : (typeof body.targetProgram === 'string' ? body.targetProgram.trim() : 'cee_medical');
    
    let ceeYear: number | null = null;
    if (body.ceeYear && !isNaN(parseInt(String(body.ceeYear), 10))) {
      ceeYear = parseInt(String(body.ceeYear), 10);
    } else if (program.includes('cee')) {
      ceeYear = new Date().getFullYear();
    }

    if (fullName.length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }
    if (phone && !/^\+977[9][6-9]\d{8}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid Nepal mobile number.' }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    const updatePayload: Record<string, any> = {
      full_name: fullName,
      updated_at: new Date().toISOString(),
    };

    if (phone) updatePayload.phone = phone;
    if (college) updatePayload.college = college;
    if (ceeYear !== null) updatePayload.cee_year = ceeYear;

    const { error } = await admin
      .from('user_profiles')
      .update(updatePayload)
      .eq('id', user.id); // only ever the caller's own row

    if (error) {
      console.error('profile/complete update failed:', error.message);
      return NextResponse.json({ error: 'Could not save your details. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, program });
  } catch (err) {
    console.error('profile/complete error:', err);
    return NextResponse.json({ error: 'Could not save your details. Please try again.' }, { status: 500 });
  }
}
