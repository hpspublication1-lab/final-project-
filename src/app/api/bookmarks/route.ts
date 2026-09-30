import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookmarks
 * Securely fetch bookmarked questions for the authenticated student.
 * Uses service role on the server to retrieve questions and explanations
 * exclusively for questions the student has actively bookmarked.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const admin = createAdminClient() || supabase;

    // 1. Fetch student's bookmarks
    const { data: bmData, error: bmError } = await admin
      .from('bookmarks')
      .select('id, resource_id, created_at')
      .eq('user_id', user.id)
      .eq('resource_type', 'question')
      .order('created_at', { ascending: false });

    if (bmError) {
      return NextResponse.json({ error: bmError.message }, { status: 500 });
    }

    if (!bmData || bmData.length === 0) {
      return NextResponse.json({ bookmarks: [] });
    }

    const qIds = bmData.map((b: any) => b.resource_id).filter(Boolean);

    // 2. Fetch authoritative questions securely via admin client
    const { data: qData, error: qError } = await admin
      .from('questions')
      .select(`
        id,
        question_text,
        options,
        correct_answer,
        explanation,
        difficulty,
        subject_id,
        chapter_id,
        subjects ( display_name ),
        chapters ( title )
      `)
      .in('id', qIds);

    if (qError) {
      return NextResponse.json({ error: qError.message }, { status: 500 });
    }

    const qMap = new Map<string, any>();
    (qData || []).forEach((q: any) => qMap.set(q.id, q));

    const results = [];
    for (const bm of bmData) {
      const q = qMap.get(bm.resource_id);
      if (!q) continue;

      let formattedOpts: { key: string; text: string }[] = [];
      if (Array.isArray(q.options)) {
        const keys = ['a', 'b', 'c', 'd'];
        formattedOpts = q.options.map((opt: any, idx: number) => ({
          key: keys[idx] || String(idx),
          text: typeof opt === 'object' && opt !== null ? (opt.text || opt.title || String(opt)) : String(opt),
        }));
      }

      results.push({
        id: bm.id,
        resource_id: bm.resource_id,
        created_at: bm.created_at,
        question: {
          id: q.id,
          question_text: q.question_text,
          options: formattedOpts,
          correct_answer: q.correct_answer,
          explanation: q.explanation || 'Refer to syllabus textbook for comprehensive notes.',
          difficulty: q.difficulty || 'medium',
          subject_name: q.subjects?.display_name || 'General',
          chapter_title: q.chapters?.title || 'General',
        },
      });
    }

    return NextResponse.json({ bookmarks: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load bookmarks' }, { status: 500 });
  }
}
