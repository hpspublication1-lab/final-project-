import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyServerPermission } from '@/lib/auth/serverGuard';

/**
 * GET /api/admin/prebookings
 *
 * Authorized list of prebooking (presale) leads (admin, super_admin, payment_staff).
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await verifyServerPermission(req, 'orders:view');
    if (!guard.authorized) return guard.response;

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    const { data: rows, error } = await admin
      .from('prebookings')
      .select('id, reference, full_name, phone, email, college, cee_year, amount_paisa, status, payment_method, payment_ref, utm_source, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = rows ?? [];
    const summary = {
      total: list.length,
      confirmed: list.filter((r) => r.status === 'confirmed').length,
      pending: list.filter((r) => r.status !== 'confirmed' && r.status !== 'cancelled').length,
      revenueNpr: list.filter((r) => r.status === 'confirmed').reduce((s, r) => s + (r.amount_paisa ?? 0) / 100, 0),
    };

    return NextResponse.json({ prebookings: list, summary });
  } catch (err) {
    console.error('admin/prebookings error:', err);
    return NextResponse.json({ error: 'Could not load prebookings' }, { status: 500 });
  }
}
