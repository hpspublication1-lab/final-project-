import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { BillingService } from '@/lib/billing/invoiceEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to view purchases' }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ purchases: [], invoices: [], activeEnrollments: [], transactions: [] });
    }

    // 1. Fetch active enrollments
    const { data: enrollments } = await admin
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id);

    // 2. Fetch unified cryptographically signed invoices across all billing tables
    const invoices = await BillingService.getUnifiedInvoices(admin, {
      userId: user.id,
      limit: 100,
    });

    // 3. Map purchases for backward compatibility while attaching full invoice objects
    const purchases = invoices.map((inv) => {
      const isEnrolled = (enrollments || []).some(
        (e) =>
          (e.program_id === inv.courseSlug || e.course_slug === inv.courseSlug) &&
          e.status === 'active'
      );
      return {
        id: inv.id,
        orderNumber: inv.purchaseOrderId,
        invoiceNumber: inv.invoiceNumber,
        receiptNumber: inv.receiptNumber,
        verificationCode: inv.verificationCode,
        signatureHash: inv.signatureHash,
        signatureValid: inv.signatureValid,
        courseId: inv.courseSlug || inv.itemSku,
        courseName: inv.itemTitle,
        amount: inv.netAmountNpr,
        grossAmount: inv.grossAmountNpr,
        discountAmount: inv.discountAmountNpr,
        amountInWords: inv.amountInWords,
        currency: inv.currency,
        gateway: inv.gateway,
        gatewayRef: inv.gatewayRef,
        status: inv.status,
        fiscalYearBs: inv.fiscalYearBs,
        createdAt: inv.issuedAt,
        paidAt: inv.paidAt,
        isEnrolled,
        invoice: inv,
      };
    });

    return NextResponse.json({
      purchases,
      invoices,
      activeEnrollments: enrollments || [],
    });
  } catch (err: any) {
    console.error('API /api/my-purchases error:', err);
    return NextResponse.json({ error: 'Failed to fetch purchase history' }, { status: 500 });
  }
}
