import { NextRequest, NextResponse } from 'next/server';
import { getActiveImpersonationSession, IMPERSONATION_COOKIE_NAME } from '@/lib/auth/impersonationGuard';
import { AuditService, AUDIT_ACTIONS } from '@/lib/services/auditService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const current = getActiveImpersonationSession(req);

  // If a session was active, record exit event in audit trail
  if (current.session) {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - current.session.startedAt) / 1000));
    await AuditService.recordAuditEvent({
      actorId: current.session.adminId,
      actorEmail: current.session.adminEmail,
      action: AUDIT_ACTIONS.IMPERSONATION_EXIT,
      resourceType: 'user_profiles',
      resourceId: current.session.studentId,
      changesDiff: {
        impersonationId: current.session.impersonationId,
        studentEmail: current.session.studentEmail,
        elapsedSeconds,
        reason: current.session.reason,
        exitedAt: new Date().toISOString(),
      },
    }).catch(() => null);
  }

  const res = NextResponse.json({
    success: true,
    redirectUrl: '/admin/users',
    message: 'Exited Ghost Diagnostic View mode',
  });

  res.cookies.set(IMPERSONATION_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
  });

  return res;
}
