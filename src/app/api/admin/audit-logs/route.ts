import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { AuditService } from '@/lib/services/auditService';

export async function GET(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'audit:view');
  if (!guard.authorized) {
    return guard.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
    const actorId = searchParams.get('actorId') || undefined;
    const action = searchParams.get('action') || undefined;
    const resourceType = searchParams.get('resourceType') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const result = await AuditService.queryAuditLogs({
      page,
      limit,
      actorId,
      action,
      resourceType,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err: any) {
    console.error('admin/audit-logs GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
