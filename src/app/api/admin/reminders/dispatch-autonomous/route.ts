import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import {
  executeAutonomousReminders,
  getExamCountdowns,
  ReminderTriggerType,
} from '@/lib/notifications/autonomousReminderEngine';
import { AuditService } from '@/lib/services/auditService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/reminders/dispatch-autonomous
 * Executes automated student reminders across Study Streaks, Exam Countdowns,
 * Live Classes, and Subscription Expiry alerts with in-app & WhatsApp channels.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      triggerType = 'all',
      programType = 'all',
      dryRun = false,
    } = body;

    const result = await executeAutonomousReminders({
      triggerType: triggerType as ReminderTriggerType,
      programType,
      dryRun: Boolean(dryRun),
    });

    // Record audit event
    await AuditService.recordAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: 'DISPATCH_AUTONOMOUS_REMINDERS',
      resourceType: 'notifications',
      resourceId: result.batchId,
      changesDiff: {
        triggerType,
        programType,
        dryRun: result.dryRun,
        totalUsersScanned: result.totalUsersScanned,
        totalDispatched: result.totalDispatched,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      triggerType: result.triggerType,
      totalUsersScanned: result.totalUsersScanned,
      totalDispatched: result.totalDispatched,
      dryRun: result.dryRun,
      sampleDispatches: result.sampleDispatches,
      whatsAppLinksCount: result.whatsAppLinksCount,
      executedAt: result.executedAt,
      message: `Successfully executed autonomous reminders for ${result.totalDispatched} student notifications.`,
    });
  } catch (err: any) {
    console.error('[AutonomousReminders] Dispatch error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while executing reminders.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/reminders/dispatch-autonomous
 * Retrieves live countdown clocks for CEE, SEE, and IELTS.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const countdowns = getExamCountdowns();
    return NextResponse.json({
      success: true,
      countdowns,
      systemStatus: 'ONLINE_ACTIVE',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
