import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCodeChecksum } from '@/lib/billing/bulkActivationCodesEngine';
import { AuditService } from '@/lib/services/auditService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/student/redeem-code
 * Allows students to redeem physical book vouchers or institutional activation codes.
 * Features client & server-side checksum verification, single-use enforcement,
 * and instant user profile plan upgrading.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Please log in to redeem your activation voucher.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawCode = String(body.code || '').trim().toUpperCase();

    if (!rawCode) {
      return NextResponse.json({ success: false, error: 'Activation code is required.' }, { status: 400 });
    }

    // 1. First-line cryptographic checksum validation
    const hasValidChecksum = verifyCodeChecksum(rawCode);
    if (!hasValidChecksum) {
      return NextResponse.json({
        success: false,
        error: 'Invalid activation code format or checksum. Please verify the code printed in your book.',
      }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Database service temporarily unavailable.' }, { status: 500 });
    }

    // 2. Query code record
    const { data: codeRecord, error: fetchError } = await admin
      .from('activation_codes')
      .select('id, code, plan, duration_days, is_active, used_by, used_at, expires_at')
      .eq('code', rawCode)
      .maybeSingle();

    if (fetchError || !codeRecord) {
      return NextResponse.json({
        success: false,
        error: 'This activation code was not found in the verified ledger.',
      }, { status: 404 });
    }

    // 3. Validation checks
    if (!codeRecord.is_active || codeRecord.used_by) {
      return NextResponse.json({
        success: false,
        error: `This activation code was already redeemed on ${new Date(codeRecord.used_at || Date.now()).toLocaleDateString()}.`,
      }, { status: 409 });
    }

    if (codeRecord.expires_at && new Date(codeRecord.expires_at).getTime() < Date.now()) {
      return NextResponse.json({
        success: false,
        error: 'This activation voucher has expired.',
      }, { status: 410 });
    }

    const durationDays = codeRecord.duration_days || 30;
    const newExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    // 4. Mark code as redeemed (Single-use lock)
    const { error: updateCodeError } = await admin
      .from('activation_codes')
      .update({
        used_by: user.id,
        used_at: nowIso,
        is_active: false,
      })
      .eq('id', codeRecord.id);

    if (updateCodeError) {
      return NextResponse.json({ success: false, error: 'Failed to process redemption lock.' }, { status: 500 });
    }

    // 5. Upgrade student profile subscription plan
    const { error: updateUserError } = await admin
      .from('user_profiles')
      .update({
        subscription_plan: codeRecord.plan,
        subscription_expires_at: newExpiresAt,
        updated_at: nowIso,
      })
      .eq('id', user.id);

    if (updateUserError) {
      console.warn('[RedeemCode] Profile upgrade warning:', updateUserError.message);
    }

    // 6. Record audit log
    await AuditService.recordAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: 'VOUCHER_CODE_REDEEM',
      resourceType: 'activation_code',
      resourceId: codeRecord.id,
      changesDiff: {
        code: rawCode,
        plan: codeRecord.plan,
        durationDays,
        expiresAt: newExpiresAt,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      plan: codeRecord.plan,
      durationDays,
      expiresAt: newExpiresAt,
      message: `Congratulations! Your ${codeRecord.plan.toUpperCase()} plan has been activated for ${durationDays} days.`,
    });
  } catch (err: any) {
    console.error('[RedeemCode] Error redeeming code:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while redeeming code.' },
      { status: 500 }
    );
  }
}
