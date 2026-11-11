import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import {
  BillingService,
  buildSignedInvoiceRecord,
  getNepalFiscalYearBs,
} from '@/lib/billing/invoiceEngine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing/invoices
 *
 * Returns all cryptographically signed invoices & receipts for the authenticated user.
 * Admins / Payment Staff can pass `?all=true` or `?userId=<uuid>` to inspect customer invoices.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Billing ledger not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const fetchAll = searchParams.get('all') === 'true';

    let targetUserId: string | undefined = user.id;

    if (fetchAll || (requestedUserId && requestedUserId !== user.id)) {
      const guard = await verifyServerPermission(req, 'orders:view');
      if (!guard.authorized) {
        return guard.response;
      }
      targetUserId = fetchAll ? undefined : requestedUserId || undefined;
    }

    const invoices = await BillingService.getUnifiedInvoices(admin, {
      userId: targetUserId,
      limit: 100,
    });

    const sampleInvoice = buildSignedInvoiceRecord({
      userId: user.id,
      sourceType: 'course_order',
      sourceId: 'sample-official-receipt-2083',
      purchaseOrderId: 'SAM-ORD-2083-994821',
      customerName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Aarav Sharma',
      customerEmail: user.email || 'student@samyak.edu.np',
      customerPhone: '+977-9841234567',
      planOrSku: 'cee-mbbs-mastery-2026',
      durationDays: 365,
      grossAmountPaisa: 600000,
      discountAmountPaisa: 150000,
      taxAmountPaisa: 0,
      netAmountPaisa: 450000,
      currency: 'NPR',
      gateway: 'fonepay',
      gatewayRef: 'FP-QR-883920144',
      status: 'paid',
      notes: 'Scholarship Code Applied: SAMYAK25',
      issuedAt: '2026-10-28T04:00:00.000Z',
      paidAt: '2026-10-28T04:01:12.000Z',
    });

    const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
    const pendingInvoices = invoices.filter((inv) => inv.status === 'pending');
    const refundedInvoices = invoices.filter((inv) => inv.status === 'refunded');

    const totalPaidNpr = paidInvoices.reduce((sum, inv) => sum + inv.netAmountNpr, 0);
    const totalDiscountNpr = paidInvoices.reduce((sum, inv) => sum + inv.discountAmountNpr, 0);
    const totalRefundedNpr = refundedInvoices.reduce((sum, inv) => sum + inv.netAmountNpr, 0);

    return NextResponse.json({
      success: true,
      fiscalYearBs: getNepalFiscalYearBs(),
      summary: {
        totalInvoices: invoices.length,
        paidCount: paidInvoices.length,
        pendingCount: pendingInvoices.length,
        refundedCount: refundedInvoices.length,
        totalPaidNpr,
        totalDiscountNpr,
        totalRefundedNpr,
      },
      invoices,
      sampleInvoice,
    });
  } catch (err: any) {
    console.error('[api/billing/invoices] Error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve billing invoices', details: err?.message },
      { status: 500 }
    );
  }
}
