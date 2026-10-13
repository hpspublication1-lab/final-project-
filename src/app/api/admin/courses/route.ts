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
    const { data: courses, error } = await admin
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, courses: courses || [] });
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
    const { id, title, price } = body;

    if (!id) return NextResponse.json({ error: 'Course ID required' }, { status: 400 });

    const updates: Record<string, any> = {};
    if (title) updates.title = title;
    if (typeof price === 'number') updates.price = price;

    const { error } = await admin
      .from('courses')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Course updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
