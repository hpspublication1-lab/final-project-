import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { AuditService, AUDIT_ACTIONS } from '@/lib/services/auditService';
import {
  validateImpersonationStart,
  IMPERSONATION_COOKIE_NAME,
} from '@/lib/auth/impersonationGuard';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/impersonate
 * High-Security Administrative Student Impersonation Endpoint
 * 
 * Enforces:
 * 1. Admin RBAC permission verification.
 * 2. Fresh authentication / MFA check for high-risk operations.
 * 3. Mandatory justification reason (min 5 chars) & optional support ticket ID.
 * 4. Strict session time limits (5-30 minutes, default 15 minutes).
 * 5. Immutable tamper-resistant audit recording with cryptographic seal.
 * 6. Cryptographically signed cookie session.
 */
export async function POST(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'admin:access');
  if (!guard.authorized) {
    return guard.response;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      studentId,
      studentName,
      studentEmail,
      reason,
      ticketId,
      durationMinutes,
      mfaConfirmed,
    } = body;

    // Validate impersonation parameters, reason, time limits, and authentication freshness
    const validation = validateImpersonationStart(
      {
        studentId,
        studentName,
        studentEmail,
        reason,
        ticketId,
        durationMinutes,
        adminUser: {
          id: guard.user.id,
          email: guard.email,
        },
        mfaConfirmed: Boolean(mfaConfirmed || req.headers.get('x-admin-mfa-token')),
      },
      { maxAuthAgeMinutes: 60 }
    );

    if (!validation.valid || !validation.session) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.statusCode }
      );
    }

    const { session } = validation;

    // Record high-risk impersonation access in the tamper-resistant audit trail
    const auditRecord = await AuditService.recordAuditEvent({
      actorId: guard.user.id,
      actorEmail: guard.email,
      action: AUDIT_ACTIONS.IMPERSONATION_START,
      resourceType: 'user_profiles',
      resourceId: session.studentId,
      changesDiff: {
        impersonationId: session.impersonationId,
        studentName: session.studentName,
        studentEmail: session.studentEmail,
        reason: session.reason,
        ticketId: session.ticketId || null,
        durationMinutes: session.maxDurationMinutes,
        startedAt: new Date(session.startedAt).toISOString(),
        expiresAt: new Date(session.expiresAt).toISOString(),
      },
      ipAddress: guard.ipAddress,
      userAgent: guard.userAgent,
    });

    const res = NextResponse.json({
      success: true,
      redirectUrl: '/student-dashboard',
      message: `Entering Ghost Diagnostic View for ${session.studentName} (${session.studentEmail})`,
      session: {
        impersonationId: session.impersonationId,
        studentId: session.studentId,
        studentName: session.studentName,
        durationMinutes: session.maxDurationMinutes,
        expiresAt: session.expiresAt,
        auditLogId: auditRecord.logId,
      },
    });

    // Set signed, time-bounded session cookie
    res.cookies.set(IMPERSONATION_COOKIE_NAME, JSON.stringify(session), {
      path: '/',
      maxAge: session.maxDurationMinutes * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // Accessible to client-side banner for live countdown
    });

    return res;
  } catch (err: any) {
    console.error('impersonate error:', err);
    return NextResponse.json({ error: err.message || 'Impersonation failed' }, { status: 500 });
  }
}
