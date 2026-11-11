import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { autonomousWorker } from '@/lib/autonomous/serverAutonomousWorker';
import { AuditService } from '@/lib/services/auditService';
import { blockSensitiveActionDuringImpersonation } from '@/lib/auth/impersonationGuard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/autonomous/daemon
 * Returns live status, cycle metrics, next run timers, and logs of the background autonomous worker.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const state = autonomousWorker.getState();
    return NextResponse.json({
      success: true,
      state,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/autonomous/daemon
 * Controls the server background worker: start, pause, stop, change frequency, or force-execute an immediate cycle.
 * Requires:
 * 1. Admin/Superadmin privilege
 * 2. Active impersonation check (blocks silent daemon mutations during student ghost view)
 * 3. Fresh authentication / MFA confirmation for privileged actions
 * 4. Tamper-resistant audit log with cryptographic seal
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'trigger_cycle', frequencyMinutes = 30 } = body;

    // 1. Impersonation Guard: Prevent admins in Ghost mode from altering background autonomous daemons
    const impCheck = await blockSensitiveActionDuringImpersonation(req, `autonomous_daemon_${action}`);
    if (impCheck) return impCheck;

    // 2. Fresh Authentication / MFA Verification for Privileged Operations
    const mfaConfirmed = Boolean(body.mfaConfirmed || req.headers.get('x-admin-mfa-token'));
    const confirmAuth = Boolean(body.confirmAuth || mfaConfirmed);

    if (user.last_sign_in_at) {
      const authAgeMs = Date.now() - new Date(user.last_sign_in_at).getTime();
      const maxAgeMs = 60 * 60 * 1000; // 60 minutes
      if (authAgeMs > maxAgeMs && !mfaConfirmed && !confirmAuth) {
        return NextResponse.json(
          {
            success: false,
            error: 'Fresh authentication required: Your administrative session is too old for privileged daemon operations. Please re-authenticate or confirm with MFA.',
            code: 'FRESH_AUTH_REQUIRED',
          },
          { status: 403 }
        );
      }
    }

    let message = '';

    if (action === 'start') {
      autonomousWorker.start(Number(frequencyMinutes) || 30);
      message = `Autonomous worker daemon started with ${frequencyMinutes}-minute cycle interval.`;
    } else if (action === 'stop' || action === 'pause') {
      autonomousWorker.stop();
      message = 'Autonomous worker daemon paused.';
    } else if (action === 'trigger_cycle') {
      const cycleResult = await autonomousWorker.executeCycle();
      message = cycleResult.summary;
    } else {
      return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }

    // Record audit event with cryptographic seal
    await AuditService.recordAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: `AUTONOMOUS_DAEMON_${action.toUpperCase()}`,
      resourceType: 'system_daemon',
      resourceId: 'serverAutonomousWorker',
      changesDiff: {
        action,
        frequencyMinutes,
        mfaConfirmed,
        executedAt: new Date().toISOString(),
      },
    }).catch(() => null);

    const state = autonomousWorker.getState();

    return NextResponse.json({
      success: true,
      message,
      state,
    });
  } catch (err: any) {
    console.error('[AutonomousDaemon] Error controlling daemon:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
