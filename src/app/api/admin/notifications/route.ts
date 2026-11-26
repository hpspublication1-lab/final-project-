import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export interface DispatchNotificationPayload {
  title: string;
  body: string;
  targetType?: 'all' | 'see' | 'cee';
  linkUrl?: string;
}

/**
 * GET /api/admin/notifications
 * Retrieves real past notification dispatches from audit logs and announcements.
 */
export async function GET(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'admin:access');
  if (!guard.authorized) return guard.response;

  try {
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 500 }
      );
    }

    // 1. Fetch dispatch history from admin_audit_logs
    const { data: auditLogs, error: auditError } = await admin
      .from('admin_audit_logs')
      .select('id, action, details, created_at')
      .eq('action', 'dispatch_notification')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!auditError && auditLogs && auditLogs.length > 0) {
      const dispatches = auditLogs.map((log: any) => {
        const details = log.details || {};
        const recipientLabel =
          details.recipient_label ||
          (details.target === 'cee'
            ? 'CEE Candidates'
            : details.target === 'see'
            ? 'SEE Candidates'
            : 'All Registered Students');

        return {
          id: log.id,
          title: details.title || 'In-App Notification',
          body: details.body || '',
          recipient: recipientLabel,
          link_url: details.link_url || undefined,
          count: details.dispatched_count || 0,
          created_at: log.created_at,
        };
      });

      return NextResponse.json({
        success: true,
        dispatches,
      });
    }

    // 2. Fallback: Check announcements table if no audit entries exist
    const { data: announcements, error: annError } = await admin
      .from('announcements')
      .select('id, title, body, target_audience, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!annError && announcements && announcements.length > 0) {
      const dispatches = announcements.map((ann: any) => ({
        id: ann.id,
        title: ann.title,
        body: ann.body,
        recipient:
          ann.target_audience === 'cee'
            ? 'CEE Candidates'
            : ann.target_audience === 'see'
            ? 'SEE Candidates'
            : 'All Registered Students',
        link_url: undefined,
        count: 0,
        created_at: ann.created_at,
      }));

      return NextResponse.json({
        success: true,
        dispatches,
      });
    }

    return NextResponse.json({
      success: true,
      dispatches: [],
    });
  } catch (err: any) {
    console.error('[admin/notifications GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/notifications
 * Dispatches an in-app notification to all matching student accounts,
 * records the broadcast in announcements, and logs the action in admin_audit_logs.
 */
export async function POST(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'admin:access');
  if (!guard.authorized) return guard.response;

  try {
    let payload: DispatchNotificationPayload;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const title = (payload.title || '').trim();
    const body = (payload.body || '').trim();
    const targetType = payload.targetType || 'all';
    let linkUrl = (payload.linkUrl || '').trim();

    // 1. Validation
    if (!title || title.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Notification title must be at least 3 characters.' },
        { status: 400 }
      );
    }
    if (title.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Notification title must not exceed 200 characters.' },
        { status: 400 }
      );
    }

    if (!body || body.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Notification message body must be at least 5 characters.' },
        { status: 400 }
      );
    }
    if (body.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Notification message body must not exceed 2000 characters.' },
        { status: 400 }
      );
    }

    if (!['all', 'see', 'cee'].includes(targetType)) {
      return NextResponse.json(
        { success: false, error: "targetType must be one of 'all', 'see', or 'cee'." },
        { status: 400 }
      );
    }

    if (linkUrl) {
      // Validate deep link format: relative path or valid absolute URL
      if (!linkUrl.startsWith('/') && !linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
        linkUrl = `/${linkUrl}`;
      }
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 500 }
      );
    }

    // 2. Query target student accounts
    let studentsQuery = admin
      .from('user_profiles')
      .select('id, full_name, cee_year, is_admin');

    if (targetType === 'cee') {
      studentsQuery = studentsQuery.not('cee_year', 'is', null);
    } else if (targetType === 'see') {
      studentsQuery = studentsQuery.is('cee_year', null);
    }

    const { data: students, error: studentsError } = await studentsQuery;

    if (studentsError) {
      console.error('[admin/notifications POST] Student query failed:', studentsError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve target students: ' + studentsError.message },
        { status: 500 }
      );
    }

    // If filtered query yields 0 students (e.g. fresh environment), fetch all registered students
    let targetUsers = students || [];
    if (targetUsers.length === 0 && targetType !== 'all') {
      const { data: allStudents } = await admin
        .from('user_profiles')
        .select('id, full_name, cee_year, is_admin');
      targetUsers = allStudents || [];
    }

    // 3. Batch insert notifications into candidate trays (chunk size: 100)
    let totalDispatched = 0;
    const CHUNK_SIZE = 100;

    if (targetUsers.length > 0) {
      for (let i = 0; i < targetUsers.length; i += CHUNK_SIZE) {
        const chunk = targetUsers.slice(i, i + CHUNK_SIZE).map((student: any) => ({
          user_id: student.id,
          title,
          message: body,
          type: 'broadcast',
          action_url: linkUrl || null,
          is_read: false,
        }));

        const { error: insertError } = await admin.from('notifications').insert(chunk);
        if (insertError) {
          console.error('[admin/notifications POST] Notification chunk insert error:', insertError);
        } else {
          totalDispatched += chunk.length;
        }
      }
    }

    // 4. Save broadcast record into announcements
    try {
      await admin.from('announcements').insert({
        title,
        body,
        type: 'info',
        target_audience: 'students',
        is_active: true,
        created_by: guard.user.id,
      });
    } catch (annErr) {
      console.warn('[admin/notifications POST] Announcement record error (non-fatal):', annErr);
    }

    const recipientLabel =
      targetType === 'all'
        ? 'All Registered Students'
        : targetType === 'cee'
        ? 'CEE Candidates'
        : 'SEE Candidates';

    // 5. Audit Log the dispatch
    let auditLogId: string | null = null;
    try {
      const { data: auditData } = await admin
        .from('admin_audit_logs')
        .insert({
          admin_id: guard.user.id,
          action: 'dispatch_notification',
          target_type: 'notifications',
          target_id: null,
          details: {
            title,
            body,
            target: targetType,
            recipient_label: recipientLabel,
            dispatched_count: totalDispatched,
            link_url: linkUrl || null,
          },
          ip_address: guard.ipAddress,
        })
        .select('id')
        .single();

      if (auditData) {
        auditLogId = auditData.id;
      }
    } catch (auditErr) {
      console.warn('[admin/notifications POST] Audit log error (non-fatal):', auditErr);
    }

    const newDispatchRecord = {
      id: auditLogId || `dispatch_${Date.now()}`,
      title,
      body,
      recipient: recipientLabel,
      link_url: linkUrl || undefined,
      count: totalDispatched,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      count: totalDispatched,
      dispatch: newDispatchRecord,
      message: `Successfully dispatched in-app notification to ${totalDispatched} candidate notification trays!`,
    });
  } catch (err: any) {
    console.error('[admin/notifications POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
