import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission, checkDuplicateSubmission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditService, AUDIT_ACTIONS } from '@/lib/services/auditService';
import { EnrollmentService } from '@/lib/services/enrollmentService';
import { CanonicalCourseSlug } from '@/types/lms';

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
      ? await admin.from('user_profiles').select('id, full_name, phone').in('id', userIds)
      : { data: [] };
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const enrichedOrders = (txRows || []).map((o: any) => {
      const p = profileMap.get(o.user_id);
      const amountNpr = Math.round(Number(o.amount_paisa || 0) / 100) || Number(o.net_amount_npr || 0);
      const normalizedStatus =
        o.status === 'initiated' ? 'pending' : o.status === 'verified' ? 'completed' : o.status || 'pending';
      return {
        id: o.id,
        purchase_order_id: o.purchase_order_id || o.id,
        user_id: o.user_id,
        customer_name: p?.full_name || 'Student',
        customer_phone: p?.phone || '',
        plan_sku: o.plan || o.plan_sku || 'cee_premium',
        gateway: o.gateway || 'fonepay',
        gross_amount_npr: amountNpr,
        discount_amount_npr: Number(o.discount_amount_npr || 0),
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

      const { error: updateErr } = await admin
        .from('payment_transactions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateErr) throw updateErr;

      const planSku = String(order.plan || order.plan_sku || '').toLowerCase();
      const grantResult = await EnrollmentService.grantEnrollment({
        userId: order.user_id,
        courseSlug: (planSku.includes('see') ? 'see_class_10' : 'cee_medical') as CanonicalCourseSlug,
        batchId: order.batch_id,
        orderId: order.id,
        adminUserId: guard.user.id,
        grantType: 'purchase',
        notes: notes || 'Payment verified by staff',
      });

      const amountNpr = Math.round(Number(order.amount_paisa || 0) / 100);
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
          userId: order.user_id,
          enrollmentGranted: grantResult.success,
          notes,
        },
        ipAddress: guard.ipAddress,
        userAgent: guard.userAgent,
      });

      return NextResponse.json({
        success: true,
        message: 'Order verified and enrollment activated.',
        orderId,
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

      const { error: updateErr } = await admin
        .from('payment_transactions')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateErr) throw updateErr;

      const amountNpr = Math.round(Number(order.amount_paisa || 0) / 100);
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
          userId: order.user_id,
          reason: reason || 'Requested by customer',
        },
        ipAddress: guard.ipAddress,
        userAgent: guard.userAgent,
      });

      return NextResponse.json({
        success: true,
        message: 'Order successfully refunded.',
        orderId,
        status: 'refunded',
      });
    }

    return NextResponse.json({ success: false, error: `Invalid action '${action}'. Expected 'verify' or 'refund'.` }, { status: 400 });
  } catch (err: any) {
    console.error('admin/orders POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
