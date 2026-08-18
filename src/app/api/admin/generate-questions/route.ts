import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/config/superAdmin';
import { generateQuestions } from '@/lib/ai/generateQuestions';

/**
 * POST /api/admin/generate-questions  { subject, count, publish? }
 *
 * Super-admin only. Generates real CEE MCQs for a subject via OpenAI and inserts
 * them into the question bank, de-duped against existing questions and mapped to
 * a random chapter of that subject. Returns how many were added.
 */
export const maxDuration = 300; // generation can take a while for large counts

const VALID_SUBJECTS = ['physics', 'chemistry', 'biology', 'mental_agility'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    if (!isSuperAdmin(user.email)) return NextResponse.json({ error: 'Super admins only' }, { status: 403 });

    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 503 });

    const body = await request.json().catch(() => ({}));
    const subject = String(body.subject ?? '').toLowerCase();
    const count = Math.max(1, Math.min(50, parseInt(String(body.count), 10) || 10)); // cap per request
    const publish = body.publish !== false;

    if (!VALID_SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: `subject must be one of: ${VALID_SUBJECTS.join(', ')}` }, { status: 400 });
    }

    const { data: subjectRow } = await admin.from('subjects').select('id').eq('name', subject).maybeSingle();
    if (!subjectRow) return NextResponse.json({ error: `Subject "${subject}" not found` }, { status: 404 });

    const [{ data: chapters }, { data: existing }] = await Promise.all([
      admin.from('chapters').select('id').eq('subject_id', subjectRow.id),
      admin.from('questions').select('question_text').eq('subject_id', subjectRow.id).limit(500),
    ]);
    const chapterIds = (chapters ?? []).map((c: any) => c.id);
    const existingTexts = (existing ?? []).map((q: any) => q.question_text);

    const generated = await generateQuestions(subject, count, existingTexts);
    if (generated.length === 0) {
      return NextResponse.json({ error: 'The AI did not return usable questions. Please try again.' }, { status: 502 });
    }

    const rows = generated.map((q) => ({
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      subject_id: subjectRow.id,
      chapter_id: chapterIds.length ? chapterIds[Math.floor(Math.random() * chapterIds.length)] : null,
      is_published: publish,
    }));

    const { error } = await admin.from('questions').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, added: rows.length, subject });
  } catch (err) {
    console.error('admin/generate-questions error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Generation failed' }, { status: 500 });
  }
}
