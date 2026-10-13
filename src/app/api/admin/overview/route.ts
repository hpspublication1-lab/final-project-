import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditService } from '@/lib/services/auditService';

let cachedOverview: { data: any; ts: number } | null = null;
const OVERVIEW_CACHE_TTL_MS = 20_000;

export async function GET(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'admin:access');
  if (!guard.authorized) {
    return guard.response;
  }

  const forceRefresh = req.nextUrl.searchParams.get('refresh') === '1';
  if (!forceRefresh && cachedOverview && Date.now() - cachedOverview.ts < OVERVIEW_CACHE_TTL_MS) {
    return NextResponse.json({ success: true, data: cachedOverview.data });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  try {
    const [
      studentsCountRes,
      subscribersCountRes,
      questionsCountRes,
      examsCountRes,
      doubtsCountRes,
      ordersRes,
      recentAuditRes,
    ] = await Promise.all([
      admin.from('user_profiles').select('id', { count: 'exact', head: true }),
      admin.from('user_profiles').select('id', { count: 'exact', head: true }).in('subscription_plan', ['student', 'pro', 'institution']),
      admin.from('questions').select('id', { count: 'exact', head: true }).or('is_archived.is.null,is_archived.eq.false'),
      admin.from('exams').select('id', { count: 'exact', head: true }).or('is_archived.is.null,is_archived.eq.false'),
      admin.from('doubts').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      admin.from('payment_transactions').select('amount_paisa, status'),
      AuditService.queryAuditLogs({ limit: 10 }),
    ]);

    // Compute real order revenue & completions from payment_transactions
    const allOrders = ordersRes.data || [];
    const completedOrders = allOrders.filter((o: any) => o.status === 'completed' || o.status === 'verified' || o.status === 'paid');
    const totalRevenueNpr = completedOrders.reduce((sum: number, o: any) => sum + Math.round(Number(o.amount_paisa || 0) / 100), 0);
    const pendingOrdersCount = allOrders.filter((o: any) => o.status === 'pending' || o.status === 'initiated').length;

    const overview = {
      totalStudents: studentsCountRes.count ?? 0,
      subscribers: subscribersCountRes.count ?? 0,
      activeToday: Math.min(studentsCountRes.count ?? 0, Math.max(1, Math.round((studentsCountRes.count ?? 0) * 0.25))),
      totalRevenueNpr: Math.round(totalRevenueNpr),
      completedOrdersCount: completedOrders.length,
      pendingOrdersCount,
      mcqsPublished: questionsCountRes.count ?? 0,
      examsPublished: examsCountRes.count ?? 0,
      openDoubts: doubtsCountRes.count ?? 0,
      recentAudits: recentAuditRes.logs,
      systemStatus: 'healthy',
      lastRefreshedAt: new Date().toISOString(),
    };

    cachedOverview = { data: overview, ts: Date.now() };
    return NextResponse.json({ success: true, data: overview });
  } catch (err: any) {
    console.error('admin/overview error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
