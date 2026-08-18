import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/config/superAdmin';

/**
 * GET /api/admin/prebookings
 *
 * Admin-only list of prebooking (presale) leads. Verifies the caller is an
 * admin and reads the table with the service-role client — both checks bypass
 * the recursive user_profiles RLS policy (FIX-AUTH-RLS.sql pending).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    if (!isSuperAdmin(user.email)) {
      return NextResponse.json({ error: 'Super admins only' }, { status: 403 });
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
