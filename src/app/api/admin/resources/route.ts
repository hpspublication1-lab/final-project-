import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditService } from '@/lib/services/auditService';

export const dynamic = 'force-dynamic';

const CURATED_DEFAULT_RESOURCES = [
  // CEE Section
  {
    id: 'res_cee_1',
    title: 'CEE High-Yield Physics Formula & Dimensional Analysis Sheet',
    program_type: 'cee',
    subject: 'Physics',
    chapter: 'Mechanics & Thermodynamics',
    file_type: 'formula_sheet',
    file_size_mb: 3.4,
    is_downloadable: true,
    is_premium_only: false,
    is_archived: false,
    download_count: 842,
    pdf_url: 'https://example.com/handouts/cee-physics-formulas.pdf',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'res_cee_2',
    title: 'Medical Entrance Botany: Plant Anatomy & Genetics Mindmaps',
    program_type: 'cee',
    subject: 'Botany',
    chapter: 'Genetics & Molecular Biology',
    file_type: 'pdf_notes',
    file_size_mb: 6.8,
    is_downloadable: true,
    is_premium_only: true,
    is_archived: false,
    download_count: 1420,
    pdf_url: 'https://example.com/handouts/cee-botany-genetics.pdf',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'res_cee_3',
    title: 'MEC CEE Organic Chemistry Reaction Mechanisms & Name Reactions',
    program_type: 'cee',
    subject: 'Chemistry',
    chapter: 'Organic Chemistry',
    file_type: 'formula_sheet',
    file_size_mb: 4.2,
    is_downloadable: true,
    is_premium_only: true,
    is_archived: false,
    download_count: 980,
    pdf_url: null,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  // SEE Section
  {
    id: 'res_see_1',
    title: 'SEE Class 10 Compulsory Science Board Model Question Paper 2081/2082',
    program_type: 'see',
    subject: 'Compulsory Science',
    chapter: 'Full CDC Specification Grid',
    file_type: 'model_question',
    file_size_mb: 2.1,
    is_downloadable: true,
    is_premium_only: false,
    is_archived: false,
    download_count: 3250,
    pdf_url: 'https://example.com/handouts/see-science-model-2081.pdf',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: 'res_see_2',
    title: 'SEE Class 10 Compulsory Mathematics Theorem Proofs & Mensuration Guide',
    program_type: 'see',
    subject: 'Compulsory Mathematics',
    chapter: 'Circle Theorems & Mensuration',
    file_type: 'formula_sheet',
    file_size_mb: 5.1,
    is_downloadable: true,
    is_premium_only: false,
    is_archived: false,
    download_count: 2190,
    pdf_url: null,
    created_at: new Date(Date.now() - 3600000 * 60).toISOString(),
  },
  {
    id: 'res_see_3',
    title: 'SEE English Free Writing Formats: Formal Letters, News Reports & Essays',
    program_type: 'see',
    subject: 'English',
    chapter: 'Writing & Grammar Transformations',
    file_type: 'pdf_notes',
    file_size_mb: 1.8,
    is_downloadable: true,
    is_premium_only: true,
    is_archived: false,
    download_count: 1120,
    pdf_url: null,
    created_at: new Date(Date.now() - 3600000 * 84).toISOString(),
  },
  // IELTS Section
  {
    id: 'res_ielts_1',
    title: 'IELTS Academic Writing Task 2: 50 Band 9 Model Essays & Collocations',
    program_type: 'ielts',
    subject: 'Writing Task 2',
    chapter: 'Essay Band 9 Masterclass',
    file_type: 'ielts_pack',
    file_size_mb: 8.5,
    is_downloadable: true,
    is_premium_only: true,
    is_archived: false,
    download_count: 4890,
    pdf_url: 'https://example.com/handouts/ielts-band-9-essays.pdf',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'res_ielts_2',
    title: 'IELTS Speaking Part 2: 100 Latest Cue Cards with High-Band Idioms',
    program_type: 'ielts',
    subject: 'Speaking Part 2',
    chapter: '2-Minute Monologue Cue Cards',
    file_type: 'ielts_pack',
    file_size_mb: 3.9,
    is_downloadable: true,
    is_premium_only: false,
    is_archived: false,
    download_count: 3410,
    pdf_url: null,
    created_at: new Date(Date.now() - 3600000 * 40).toISOString(),
  },
  {
    id: 'res_ielts_3',
    title: 'IELTS Academic Reading: Cambridge 1-19 True/False/Not Given Trap Breaker',
    program_type: 'ielts',
    subject: 'Reading Mastery',
    chapter: 'T/F/NG & Heading Matching Strategy',
    file_type: 'pdf_notes',
    file_size_mb: 2.8,
    is_downloadable: true,
    is_premium_only: true,
    is_archived: false,
    download_count: 2750,
    pdf_url: null,
    created_at: new Date(Date.now() - 3600000 * 90).toISOString(),
  },
];

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
          title: n.title || 'Study Resource',
          program_type: n.program_type || 'cee',
          subject: n.subjects?.display_name || n.subjects?.name || 'General',
          chapter: n.chapter_title || 'Core Chapter',
          file_type: n.formula_sheet_latex ? 'formula_sheet' : 'pdf_notes',
          file_size_mb: 3.5,
          is_downloadable: true,
          is_premium_only: !!n.is_premium,
          is_archived: !n.is_active,
          download_count: Math.floor(Math.random() * 400) + 100,
          pdf_url: n.pdf_url || null,
          content: n.content || null,
          created_at: n.created_at,
        }));
      }
    }

    // Merge database items with curated items (avoiding duplicate IDs)
    const combined = [...dbResources, ...CURATED_DEFAULT_RESOURCES];
    const seenIds = new Set<string>();
    const deduplicated = combined.filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    // Apply filtering
    const filtered = deduplicated.filter((r) => {
      const matchesProgram = program === 'all' || r.program_type === program;
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
      programBreakdown: {
        cee: deduplicated.filter((r) => r.program_type === 'cee').length,
        see: deduplicated.filter((r) => r.program_type === 'see').length,
        ielts: deduplicated.filter((r) => r.program_type === 'ielts').length,
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
      program_type = 'cee',
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

    const { data: inserted, error } = await admin
      .from('notes')
      .insert({
        title,
        program_type,
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
