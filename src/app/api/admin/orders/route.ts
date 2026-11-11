import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission, checkDuplicateSubmission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditService, AUDIT_ACTIONS } from '@/lib/services/auditService';
import { EnrollmentService } from '@/lib/services/enrollmentService';
import { CanonicalCourseSlug } from '@/types/lms';
import { BillingService, buildSignedInvoiceRecord } from '@/lib/billing/invoiceEngine';

export async function GET(req: NextRequest) {
  // Accessible to payment_staff, admin, and super_admin
  const guard = await verifyServerPermission(req, 'orders:view');
  if (!guard.authorized) {
    return guard.response;
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));
    const offset = (page - 1) * limit;

    let query = admin
      .from('payment_transactions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      if (status === 'pending') {
        query = query.in('status', ['pending', 'initiated']);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data: txRows, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    // Fetch user details for these orders
    const userIds = Array.from(new Set((txRows || []).map((o: any) => o.user_id).filter(Boolean)));
    const { data: profiles } = userIds.length > 0
      ? await admin.from('user_profiles').select('id, full_name, email, phone').in('id', userIds)
      : { data: [] };
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const enrichedOrders = (txRows || []).map((o: any) => {
      const p = profileMap.get(o.user_id);
      const amountNpr = Math.round(Number(o.amount_paisa || 0) / 100) || Number(o.net_amount_npr || 0);
      const discountNpr = Number(o.discount_amount_npr || 0);
      const grossNpr = amountNpr + discountNpr;
      const normalizedStatus =
        o.status === 'initiated' ? 'pending' : o.status === 'verified' ? 'completed' : o.status || 'pending';

      const invoice = buildSignedInvoiceRecord({
        userId: o.user_id,
        sourceType: 'payment_transaction',
        sourceId: String(o.id),
        purchaseOrderId: o.purchase_order_id || String(o.id),
        customerName: p?.full_name || 'Student',
        customerEmail: p?.email || '',
        customerPhone: p?.phone || '',
        planOrSku: o.plan || o.plan_sku || 'cee_premium',
        durationDays: Number(o.duration_days || 365),
        grossAmountPaisa: Math.round(grossNpr * 100),
        discountAmountPaisa: Math.round(discountNpr * 100),
        netAmountPaisa: Math.round(amountNpr * 100),
        currency: o.currency || 'NPR',
        gateway: o.gateway || 'fonepay',
        gatewayRef: o.gateway_ref || null,
        status: normalizedStatus,
        issuedAt: o.created_at,
        paidAt: normalizedStatus === 'completed' ? o.updated_at || o.created_at : null,
      });

      return {
        id: o.id,
        purchase_order_id: o.purchase_order_id || o.id,
        invoice_number: invoice.invoiceNumber,
        receipt_number: invoice.receiptNumber,
        verification_code: invoice.verificationCode,
        invoice,
        user_id: o.user_id,
        customer_name: p?.full_name || 'Student',
        customer_email: p?.email || '',
        customer_phone: p?.phone || '',
        plan_sku: o.plan || o.plan_sku || 'cee_premium',
        gateway: o.gateway || 'fonepay',
        gateway_ref: o.gateway_ref || null,
        slip_url: o.slip_url || o.proof_url || o.receipt_url || o.metadata?.slip_url || null,
        metadata: o.metadata || {},
        gross_amount_npr: grossNpr,
        discount_amount_npr: discountNpr,
        net_amount_npr: amountNpr,
        status: normalizedStatus,
        created_at: o.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      total: count || 0,
      page,
      limit,
    });
  } catch (err: any) {
    console.error('admin/orders GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, action, reason, notes } = body;

    if (!orderId || !action) {
      return NextResponse.json({ success: false, error: 'orderId and action are required.' }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // 1. Action: VERIFY PAYMENT
    if (action === 'verify') {
      const guard = await verifyServerPermission(req, 'orders:verify');
      if (!guard.authorized) return guard.response;

      const duplicateKey = `order_verify_${orderId}`;
      if (checkDuplicateSubmission(duplicateKey)) {
        return NextResponse.json({ success: true, message: 'Verification already in progress.' });
      }

      const { data: order, error: orderErr } = await admin
        .from('payment_transactions')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderErr || !order) {
        return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
      }

      if (order.status === 'completed' || order.status === 'verified') {
        return NextResponse.json({ success: false, error: 'Order is already marked as completed.' }, { status: 400 });
      }

      const nowIso = new Date().toISOString();
      const { error: updateErr } = await admin
        .from('payment_transactions')
        .update({
          status: 'completed',
          updated_at: nowIso,
        })
        .eq('id', orderId);

      if (updateErr) throw updateErr;

      const planSku = String(order.plan || order.plan_sku || '').toLowerCase();
      let courseSlug: CanonicalCourseSlug = 'cee_medical';
      if (planSku.includes('11')) courseSlug = 'neb_class_11';
      else if (planSku.includes('12')) courseSlug = 'neb_class_12';
      else if (planSku.includes('eng') || planSku.includes('ioe')) courseSlug = 'ioe_engineering';
      else if (planSku.includes('lok') || planSku.includes('sewa')) courseSlug = 'lok_sewa';
      else if (planSku.includes('see') || planSku.includes('10')) courseSlug = 'see_class_10';
      else if (planSku.includes('ielts')) courseSlug = 'ielts';
      else if (planSku.includes('market') || planSku.includes('digital')) courseSlug = 'digital_marketing';

      const grantResult = await EnrollmentService.grantEnrollment({
        userId: order.user_id,
        courseSlug,
        batchId: order.batch_id,
        orderId: order.id,
        adminUserId: guard.user.id,
        grantType: 'purchase',
        notes: notes || 'Payment verified by staff',
      });

      const netPaisa = Number(order.amount_paisa || 0) || Math.round(Number(order.net_amount_npr || 0) * 100);
      const invoice = await BillingService.issueOrUpdateInvoice(admin, {
        userId: order.user_id,
        sourceType: 'payment_transaction',
        sourceId: String(order.id),
        purchaseOrderId: order.purchase_order_id || String(order.id),
        planOrSku: order.plan || order.plan_sku || courseSlug,
        durationDays: Number(order.duration_days || 365),
        grossAmountPaisa: netPaisa,
        netAmountPaisa: netPaisa,
        currency: order.currency || 'NPR',
        gateway: order.gateway || 'fonepay',
        gatewayRef: order.gateway_ref || null,
        status: 'paid',
        notes: notes || 'Verified by payment staff',
        issuedAt: order.created_at || nowIso,
        paidAt: nowIso,
      });

      const amountNpr = Math.round(netPaisa / 100);
      await AuditService.recordAuditEvent({
        actorId: guard.user.id,
        actorEmail: guard.email,
        action: AUDIT_ACTIONS.ORDER_VERIFY,
        resourceType: 'order',
        resourceId: orderId,
        changesDiff: {
          previousStatus: order.status,
          newStatus: 'completed',
          amountNpr,
          invoiceNumber: invoice.invoiceNumber,
          receiptNumber: invoice.receiptNumber,
          userId: order.user_id,
          enrollmentGranted: grantResult.success,
          notes,
        },
        ipAddress: guard.ipAddress,
        userAgent: guard.userAgent,
      });

      return NextResponse.json({
        success: true,
        message: `Order verified, enrollment activated, and receipt ${invoice.receiptNumber} issued.`,
        orderId,
        invoiceNumber: invoice.invoiceNumber,
        receiptNumber: invoice.receiptNumber,
        status: 'completed',
      });
    }

    // 2. Action: ISSUE REFUND
    if (action === 'refund') {
      const guard = await verifyServerPermission(req, 'orders:refund');
      if (!guard.authorized) return guard.response;

      const duplicateKey = `order_refund_${orderId}`;
      if (checkDuplicateSubmission(duplicateKey)) {
        return NextResponse.json({ success: true, message: 'Refund already in progress.' });
      }

      const { data: order, error: orderErr } = await admin
        .from('payment_transactions')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderErr || !order) {
        return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
      }

      if (order.status === 'refunded') {
        return NextResponse.json({ success: false, error: 'Order has already been refunded.' }, { status: 400 });
      }

      const nowIso = new Date().toISOString();
      const { error: updateErr } = await admin
        .from('payment_transactions')
        .update({
          status: 'refunded',
          updated_at: nowIso,
        })
        .eq('id', orderId);

      if (updateErr) throw updateErr;

      const netPaisa = Number(order.amount_paisa || 0) || Math.round(Number(order.net_amount_npr || 0) * 100);
      const invoice = await BillingService.issueOrUpdateInvoice(admin, {
        userId: order.user_id,
        sourceType: 'payment_transaction',
        sourceId: String(order.id),
        purchaseOrderId: order.purchase_order_id || String(order.id),
        planOrSku: order.plan || order.plan_sku || 'cee_premium',
        durationDays: Number(order.duration_days || 365),
        grossAmountPaisa: netPaisa,
        netAmountPaisa: netPaisa,
        currency: order.currency || 'NPR',
        gateway: order.gateway || 'fonepay',
        gatewayRef: order.gateway_ref || null,
        status: 'refunded',
        notes: reason || 'Refunded by payment staff',
        issuedAt: order.created_at || nowIso,
        refundedAt: nowIso,
      });

      const amountNpr = Math.round(netPaisa / 100);
      await AuditService.recordAuditEvent({
        actorId: guard.user.id,
        actorEmail: guard.email,
        action: AUDIT_ACTIONS.ORDER_REFUND,
        resourceType: 'order',
        resourceId: orderId,
        changesDiff: {
          previousStatus: order.status,
          newStatus: 'refunded',
          amountNpr,
          invoiceNumber: invoice.invoiceNumber,
          userId: order.user_id,
          reason: reason || 'Requested by customer',
        },
        ipAddress: guard.ipAddress,
        userAgent: guard.userAgent,
      });

      return NextResponse.json({
        success: true,
        message: 'Order successfully refunded and credit receipt updated.',
        orderId,
        invoiceNumber: invoice.invoiceNumber,
        status: 'refunded',
      });
    }

    return NextResponse.json({ success: false, error: `Invalid action '${action}'. Expected 'verify' or 'refund'.` }, { status: 400 });
  } catch (err: any) {
    console.error('admin/orders POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
