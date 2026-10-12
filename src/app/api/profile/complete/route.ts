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
    const prepStage = typeof body.prepStage === 'string' ? body.prepStage.trim() : 'class_12_fresh';
    const dailyStudyHours = Number(body.dailyStudyHours) > 0 ? Math.min(16, Number(body.dailyStudyHours)) : 3;
    const languagePreference = typeof body.languagePreference === 'string' ? body.languagePreference.trim() : 'english';
    const consentAccepted = body.consentAccepted !== false;

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
      return NextResponse.json({ error: 'Enter a valid Nepal mobile number (e.g. 9812345678).' }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      full_name: fullName,
      updated_at: nowIso,
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

    // Persist onboarding preferences in auth user_metadata so returning sessions never loop
    try {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          full_name: fullName,
          ...(phone ? { phone } : {}),
          ...(college ? { college } : {}),
          ...(ceeYear !== null ? { cee_year: ceeYear } : {}),
          target_exam: program,
          prep_stage: prepStage,
          daily_study_hours: dailyStudyHours,
          language_preference: languagePreference,
          onboarding_completed: true,
          onboarding_completed_at: nowIso,
          ...(consentAccepted ? { consent_accepted_at: user.user_metadata?.consent_accepted_at || nowIso } : {}),
        },
      });
    } catch (metaErr) {
      console.warn('profile/complete metadata update warning:', metaErr);
    }

    // Best-effort sync of daily study hours into study_plans
    try {
      const planTitle =
        program === 'see_class_10'
          ? 'SEE Class 10 GPA 4.0 Daily Blueprint'
          : 'CEE Medical Entrance High-Yield Blueprint';
      const { data: existingPlan } = await admin
        .from('study_plans')
        .select('id')
        .eq('student_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingPlan?.id) {
        await admin
          .from('study_plans')
          .update({ title: planTitle, daily_hours: dailyStudyHours })
          .eq('id', existingPlan.id);
      }
    } catch {
      // Non-blocking if study_plans schema differs
    }

    return NextResponse.json({
      ok: true,
      program,
      prepStage,
      dailyStudyHours,
      languagePreference,
      onboarding_completed: true,
    });
  } catch (err) {
    console.error('profile/complete error:', err);
    return NextResponse.json({ error: 'Could not save your details. Please try again.' }, { status: 500 });
  }
}
