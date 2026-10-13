import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'content:edit');
  if (!guard.authorized) return guard.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  try {
    const { data: notes, error } = await admin
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const resources = (notes || []).map((n: any) => ({
      id: n.id,
      title: n.title || 'Study Resource',
      file_type: n.formula_sheet_latex ? 'formula_sheet' : 'pdf_notes',
      file_size_mb: 3.5,
      is_downloadable: true,
      is_premium_only: !!n.is_premium,
      is_archived: !n.is_active,
      download_count: 120,
      pdf_url: n.pdf_url || null,
      created_at: n.created_at,
    }));

    return NextResponse.json({ success: true, resources });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'content:edit');
  if (!guard.authorized) return guard.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  try {
    const body = await req.json();
    const { id, is_archived, is_premium_only } = body;

    if (!id) return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof is_archived === 'boolean') {
      updates.is_active = !is_archived;
    }
    if (typeof is_premium_only === 'boolean') {
      updates.is_premium = is_premium_only;
    }

    const { error } = await admin
      .from('notes')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Resource updated' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
