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
    const [{ data: videos, error }, { data: chapters }] = await Promise.all([
      admin
        .from('video_lectures')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300),
      admin.from('chapters').select('id, title'),
    ]);

    if (error) throw error;

    const chapterMap = new Map((chapters || []).map((c: any) => [c.id, c.title]));

    const lessons = (videos || []).map((v: any, idx: number) => ({
      id: v.id,
      title: v.title || 'Untitled Lecture',
      chapter_title: chapterMap.get(v.chapter_id) || 'General Module',
      lesson_order: idx + 1,
      duration_minutes: Math.round((v.duration_sec || 0) / 60) || 30,
      is_free_preview: !v.is_premium,
      is_published: !!v.is_active,
      is_archived: !v.is_active,
      video_url: v.video_url || '',
      created_at: v.created_at,
    }));

    return NextResponse.json({ success: true, lessons });
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
    const { id, is_free_preview, is_archived, is_published } = body;

    if (!id) return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 });

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof is_free_preview === 'boolean') {
      updates.is_premium = !is_free_preview;
    }
    if (typeof is_archived === 'boolean') {
      updates.is_active = !is_archived;
    }
    if (typeof is_published === 'boolean') {
      updates.is_active = is_published;
    }

    const { error } = await admin
      .from('video_lectures')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Lesson updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
