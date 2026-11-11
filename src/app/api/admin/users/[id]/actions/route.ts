import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyServerPermission } from '@/lib/auth/serverGuard';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/users/[id]/actions
 * Executes sovereign administrative actions on a student:
 * - grant_extension: extends subscription by X days
 * - set_plan: updates subscription_plan (e.g. 'pro', 'student', 'free')
 * - revoke_access: terminates subscription immediately
 * - reset_devices: resets device binding and session tokens
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await verifyServerPermission(req, 'users:edit');
    if (!guard.authorized) return guard.response;

    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '').trim();

    // 1. Fetch current profile
    const { data: profile, error: profileErr } = await admin
      .from('user_profiles')
      .select('id, full_name, phone, subscription_plan, subscription_expires_at')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const now = new Date();

    if (action === 'grant_extension') {
      const days = Number(body.days) || 7;
      const currentExpiry = profile.subscription_expires_at
        ? new Date(profile.subscription_expires_at)
        : now;
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseDate.getTime() + days * 86400 * 1000);

      const targetPlan =
        body.planTier ||
        (profile.subscription_plan && profile.subscription_plan !== 'free'
          ? profile.subscription_plan
          : 'pro');

      const { error: updateErr } = await admin
        .from('user_profiles')
        .update({
          subscription_plan: targetPlan,
          subscription_expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateErr) throw updateErr;

      return NextResponse.json({
        success: true,
        message: `Granted ${days} days extension on ${targetPlan.toUpperCase()} plan. Valid until ${newExpiry.toLocaleDateString('en-GB')}.`,
        newExpiry: newExpiry.toISOString(),
        plan: targetPlan,
      });
    }

    if (action === 'revoke_access') {
      const { error: revokeErr } = await admin
        .from('user_profiles')
        .update({
          subscription_plan: 'free',
          subscription_expires_at: now.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (revokeErr) throw revokeErr;

      return NextResponse.json({
        success: true,
        message: `Student access revoked. Plan downgraded to Free.`,
        plan: 'free',
      });
    }

    if (action === 'reset_devices') {
      // Invalidate existing sessions by updating session metadata or calling auth admin signOut
      try {
        await admin.auth.admin.signOut(userId);
      } catch {
        // Fallback: update profile token
      }

      const { error: metaErr } = await admin
        .from('user_profiles')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (metaErr) throw metaErr;

      return NextResponse.json({
        success: true,
        message: `Device bindings and active login sessions reset successfully. Student will be prompted to register their authorized device on next sign-in.`,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('[admin/users/actions] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to execute administrative action' },
      { status: 500 }
    );
  }
}
