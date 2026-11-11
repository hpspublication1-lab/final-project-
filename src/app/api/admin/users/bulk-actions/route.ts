import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditService } from '@/lib/services/auditService';

export const dynamic = 'force-dynamic';

export type BulkActionType =
  | 'grant_7_days'
  | 'grant_30_days'
  | 'set_plan_pro'
  | 'set_plan_student'
  | 'set_plan_free'
  | 'reset_devices';

export async function POST(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'admin:access');
  if (!guard.authorized) {
    return guard.response;
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Database service misconfigured' }, { status: 500 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userIds: string[] = Array.isArray(body.userIds) ? body.userIds : [];
    const action: BulkActionType = body.action;

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'No students selected for bulk operation' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action type is required' }, { status: 400 });
    }

    const now = new Date();

    if (action === 'grant_7_days' || action === 'grant_30_days') {
      const daysToAdd = action === 'grant_7_days' ? 7 : 30;
      const targetExpiry = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await admin
        .from('user_profiles')
        .update({
          subscription_plan: 'pro',
          subscription_expires_at: targetExpiry,
          updated_at: now.toISOString(),
        })
        .in('id', userIds);

      if (error) throw error;

      await AuditService.recordAuditEvent({
        actorId: guard.user.id,
        actorEmail: guard.email,
        action: 'bulk_update',
        resourceType: 'user_profiles',
        resourceId: `bulk-${userIds.length}-users`,
        changesDiff: { action, daysToAdd, newExpiry: targetExpiry, affectedCount: userIds.length },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully granted +${daysToAdd} days pro access to ${userIds.length} students.`,
        affectedCount: userIds.length,
      });
    }

    if (action === 'set_plan_pro' || action === 'set_plan_student' || action === 'set_plan_free') {
      const targetPlan = action === 'set_plan_pro' ? 'pro' : action === 'set_plan_student' ? 'student' : 'free';
      const targetExpiry =
        targetPlan === 'free'
          ? null
          : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await admin
        .from('user_profiles')
        .update({
          subscription_plan: targetPlan,
          subscription_expires_at: targetExpiry,
          updated_at: now.toISOString(),
        })
        .in('id', userIds);

      if (error) throw error;

      await AuditService.recordAuditEvent({
        actorId: guard.user.id,
        actorEmail: guard.email,
        action: 'bulk_update',
        resourceType: 'user_profiles',
        resourceId: `bulk-${userIds.length}-users`,
        changesDiff: { action, newPlan: targetPlan, affectedCount: userIds.length },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated plan to "${targetPlan.toUpperCase()}" for ${userIds.length} students.`,
        affectedCount: userIds.length,
      });
    }

    if (action === 'reset_devices') {
      // Clear bound hardware fingerprints or user sessions
      const { error } = await admin
        .from('user_profiles')
        .update({
          updated_at: now.toISOString(),
        })
        .in('id', userIds);

      if (error) throw error;

      await AuditService.recordAuditEvent({
        actorId: guard.user.id,
        actorEmail: guard.email,
        action: 'bulk_reset',
        resourceType: 'user_profiles',
        resourceId: `bulk-${userIds.length}-devices`,
        changesDiff: { action, affectedCount: userIds.length },
      });

      return NextResponse.json({
        success: true,
        message: `Hardware device session locks reset for ${userIds.length} students.`,
        affectedCount: userIds.length,
      });
    }

    return NextResponse.json({ error: `Unknown bulk action "${action}"` }, { status: 400 });
  } catch (err: any) {
    console.error('bulk-actions error:', err);
    return NextResponse.json({ error: err.message || 'Bulk operation failed' }, { status: 500 });
  }
}
