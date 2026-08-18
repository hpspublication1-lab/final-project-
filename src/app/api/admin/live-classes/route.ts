import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/config/superAdmin';

/**
 * Super-admin live-class management (Bunny Stream / HLS).
 *   GET   — list all classes
 *   POST  — create a class { title, description?, subjectId?, scheduledAt, durationMin?, streamUrl, isPremium? }
 *   PATCH — update a class  { id, ...fields } (e.g. status: 'live' | 'ended')
 *
 * The Bunny HLS playback URL (.m3u8) is stored in `meeting_url`; the students'
 * live-classes page derives the in-app HLS player from it. Service-role writes.
 */
async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) };
  if (!isSuperAdmin(user.email)) return { error: NextResponse.json({ error: 'Super admins only' }, { status: 403 }) };
  const admin = createAdminClient();
  if (!admin) return { error: NextResponse.json({ error: 'Server not configured' }, { status: 503 }) };
  return { admin };
}

export async function GET() {
  const gate = await requireSuperAdmin();
  if (gate.error) return gate.error;
  const { data, error } = await gate.admin
    .from('live_classes')
    .select('id, title, description, scheduled_at, duration_min, meeting_url, recording_url, status, subject_id, is_premium, created_at')
    .order('scheduled_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ classes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const gate = await requireSuperAdmin();
  if (gate.error) return gate.error;
  try {
    const b = await request.json();
    const title = String(b.title ?? '').trim();
    const streamUrl = String(b.streamUrl ?? '').trim();
    if (title.length < 2) return NextResponse.json({ error: 'Please enter a class title.' }, { status: 400 });
    if (!b.scheduledAt) return NextResponse.json({ error: 'Please choose a schedule time.' }, { status: 400 });

    const { data, error } = await gate.admin
      .from('live_classes')
      .insert({
        title,
        description: b.description ? String(b.description).trim() : null,
        subject_id: b.subjectId || null,
        scheduled_at: new Date(b.scheduledAt).toISOString(),
        duration_min: Number(b.durationMin) || 60,
        meeting_url: streamUrl || null,
        is_premium: b.isPremium !== false, // premium by default
        status: 'scheduled',
      })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error('live-classes POST error:', err);
    return NextResponse.json({ error: 'Could not create the class.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await requireSuperAdmin();
  if (gate.error) return gate.error;
  try {
    const b = await request.json();
    if (!b.id) return NextResponse.json({ error: 'Missing class id.' }, { status: 400 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (b.status && ['scheduled', 'live', 'ended', 'completed', 'cancelled'].includes(b.status)) patch.status = b.status;
    if (typeof b.title === 'string') patch.title = b.title.trim();
    if (typeof b.description === 'string') patch.description = b.description.trim();
    if (typeof b.streamUrl === 'string') patch.meeting_url = b.streamUrl.trim() || null;
    if (typeof b.recordingUrl === 'string') patch.recording_url = b.recordingUrl.trim() || null;
    if (typeof b.isPremium === 'boolean') patch.is_premium = b.isPremium;
    if (b.scheduledAt) patch.scheduled_at = new Date(b.scheduledAt).toISOString();

    const { error } = await gate.admin.from('live_classes').update(patch).eq('id', b.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('live-classes PATCH error:', err);
    return NextResponse.json({ error: 'Could not update the class.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const gate = await requireSuperAdmin();
  if (gate.error) return gate.error;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing class id.' }, { status: 400 });
  const { error } = await gate.admin.from('live_classes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
