import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditService } from '@/lib/services/auditService';
import { ALL_COURSE_IDS, parseCourseId, resolveRowCourse, storedProgramValue } from '@/lib/courses/courseIds';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'content:read');
  if (!guard.authorized) return guard.response;

  const admin = createAdminClient();
  const { searchParams } = new URL(req.url);
  const program = searchParams.get('program') || 'all';
  const type = searchParams.get('type') || 'all';
  const query = (searchParams.get('query') || '').toLowerCase();

  try {
    let dbResources: any[] = [];
    if (admin) {
      const { data: notes } = await admin
        .from('notes')
        .select('*, subjects(name, display_name)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (notes && notes.length > 0) {
        dbResources = notes.map((n: any) => ({
          id: n.id,
          title: n.title || '(untitled)',
          // What is stored, and the course the site actually shows it under —
          // null when it can't be placed, so the admin can see what needs fixing.
          program_type: n.program_type ?? null,
          course: resolveRowCourse(n),
          subject: n.subjects?.display_name || n.subjects?.name || null,
          chapter: n.chapter_title || null,
          file_type: n.formula_sheet_latex ? 'formula_sheet' : 'pdf_notes',
          file_size_mb: null,
          is_downloadable: true,
          is_premium_only: !!n.is_premium,
          is_archived: !n.is_active,
          download_count: null,
          pdf_url: n.pdf_url || null,
          content: n.content || null,
          created_at: n.created_at,
        }));
      }
    }

    // Real uploads only. A hardcoded list used to be mixed in here as if it had been
    // uploaded (kept, unused, in src/lib/data/unverified/hardcodedStudyResources.ts).
    const deduplicated = dbResources;
    const wantedCourse = program === 'all' ? null : parseCourseId(program);

    // Apply filtering
    const filtered = deduplicated.filter((r) => {
      const matchesProgram = program === 'all' || (program === 'unassigned' ? !r.course : r.course === wantedCourse);
      const matchesType = type === 'all' || r.file_type === type;
      const matchesSearch =
        !query ||
        r.title.toLowerCase().includes(query) ||
        (r.subject && r.subject.toLowerCase().includes(query)) ||
        (r.chapter && r.chapter.toLowerCase().includes(query));
      return matchesProgram && matchesType && matchesSearch;
    });

    return NextResponse.json({
      success: true,
      resources: filtered,
      totalCount: filtered.length,
      // Every course, plus what can't be placed — counted from real rows.
      programBreakdown: {
        ...Object.fromEntries(ALL_COURSE_IDS.map((c) => [c, deduplicated.filter((r) => r.course === c).length])),
        cee: deduplicated.filter((r) => r.course === 'cee_medical').length,
        see: deduplicated.filter((r) => r.course === 'see_class_10').length,
        ielts: deduplicated.filter((r) => r.course === 'ielts').length,
        unassigned: deduplicated.filter((r) => !r.course).length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'content:create');
  if (!guard.authorized) return guard.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  try {
    const body = await req.json();
    const {
      title,
      program_type,
      subject_id,
      chapter_id,
      file_type = 'pdf_notes',
      pdf_url = null,
      content = '',
      is_premium = false,
      is_active = true,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Resource title is required' }, { status: 400 });
    }
    // Every upload must name its course. A missing one used to become CEE.
    const course = parseCourseId(program_type);
    if (!course) {
      return NextResponse.json({ error: 'Choose the course this resource belongs to.' }, { status: 400 });
    }

    const { data: inserted, error } = await admin
      .from('notes')
      .insert({
        title,
        program_type: storedProgramValue(course),
        subject_id: subject_id || null,
        chapter_id: chapter_id || null,
        pdf_url,
        content,
        is_premium: !!is_premium,
        is_active: is_active !== false,
      })
      .select('*')
      .single();

    if (error) throw error;

    await AuditService.recordAuditEvent({
      actorId: guard.user.id,
      actorEmail: guard.email,
      action: 'resource_upload_create',
      resourceType: 'notes',
      resourceId: inserted?.id || 'manual',
      changesDiff: { title, program_type, file_type, is_premium },
      ipAddress: guard.ipAddress,
      userAgent: guard.userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Resource "${title}" created successfully!`,
      resource: inserted,
    });
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
    const { id, is_archived, is_premium_only, title, pdf_url } = body;

    if (!id) return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof is_archived === 'boolean') {
      updates.is_active = !is_archived;
    }
    if (typeof is_premium_only === 'boolean') {
      updates.is_premium = is_premium_only;
    }
    if (title) updates.title = title;
    if (pdf_url !== undefined) updates.pdf_url = pdf_url;

    const { error } = await admin.from('notes').update(updates).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Resource updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
