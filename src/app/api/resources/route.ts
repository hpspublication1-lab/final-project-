import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseCourseId, resolveRowCourse } from '@/lib/courses/courseIds';
import type { CanonicalCourseId } from '@/contexts/ProgramContext';

export const dynamic = 'force-dynamic';

/**
 * Free study notes, from the `notes` table only.
 *
 * Before: 12 hardcoded notes were mixed in (now kept, unused, in
 * src/lib/data/unverified/hardcodedStudyResources.ts); each database note's course
 * was guessed from its title ("see" anywhere = SEE, "band" = IELTS, else CEE);
 * every note got a random download count and two stock bullet points.
 */

type PageProgram = 'cee' | 'see' | 'ielts' | 'neb';
const PAGE_PROGRAM: Partial<Record<CanonicalCourseId, PageProgram>> = {
  cee_medical: 'cee',
  see_class_10: 'see',
  ielts: 'ielts',
  neb_class_11: 'neb',
  neb_class_12: 'neb',
};

interface AcademicResource {
  id: string;
  title: string;
  program: PageProgram;
  course: CanonicalCourseId;
  subject: string;
  chapter: string;
  type: 'notes' | 'formula_sheet' | 'model_question' | 'ielts_pack';
  is_premium: boolean;
  reading_time_mins: number;
  /** Not tracked yet; null rather than an invented number. */
  download_count: number | null;
  pdf_url?: string | null;
  content: string;
  summary_key_points: string[];
  formula_sheet_latex?: string;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const programParam = searchParams.get('program') || 'all';
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search')?.toLowerCase().trim() || '';

    // 'neb' is the page's name for both NEB years.
    const wanted: CanonicalCourseId[] | 'all' =
      programParam === 'all'
        ? 'all'
        : programParam === 'neb'
          ? ['neb_class_11', 'neb_class_12']
          : [parseCourseId(programParam)].filter((c): c is CanonicalCourseId => Boolean(c));

    const supabase = await createClient();
    const { data: dbNotes, error } = await supabase
      .from('notes')
      .select(
        'id, title, content, content_markdown, summary_key_points, formula_sheet_latex, pdf_url, is_premium, is_active, created_at, program_type, subjects(display_name)'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const resources: AcademicResource[] = [];
    for (const n of (dbNotes || []) as any[]) {
      const course = resolveRowCourse(n);
      const program = course ? PAGE_PROGRAM[course] : undefined;
      // A note that can't be placed in a course this page lists is not shown under a guess.
      if (!course || !program) continue;
      const rawContent = n.content || n.content_markdown || '';
      const titleLower = String(n.title || '').toLowerCase();
      resources.push({
        id: n.id,
        title: n.title,
        program,
        course,
        subject: n.subjects?.display_name || 'General',
        chapter: n.title,
        type: titleLower.includes('formula') ? 'formula_sheet' : titleLower.includes('model') ? 'model_question' : 'notes',
        is_premium: n.is_premium ?? false,
        reading_time_mins: Math.max(1, Math.ceil(rawContent.length / 1000)),
        download_count: null,
        pdf_url: n.pdf_url,
        content: rawContent,
        summary_key_points: Array.isArray(n.summary_key_points) ? n.summary_key_points : [],
        formula_sheet_latex: n.formula_sheet_latex || undefined,
        created_at: n.created_at,
      });
    }

    const filtered = resources.filter((r) => {
      const matchesProgram = wanted === 'all' || wanted.includes(r.course);
      const matchesType = type === 'all' || r.type === type;
      const matchesSearch =
        !search ||
        r.title.toLowerCase().includes(search) ||
        r.subject.toLowerCase().includes(search) ||
        r.chapter.toLowerCase().includes(search);
      return matchesProgram && matchesType && matchesSearch;
    });

    return NextResponse.json({ success: true, total: filtered.length, resources: filtered });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch resources', resources: [] },
      { status: 500 }
    );
  }
}
