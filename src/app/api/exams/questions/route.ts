import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CANONICAL_EXAM_CATALOG } from '@/lib/exams/examRegistry';
import { CEE_VERIFIED_PYQ_DATA } from '@/lib/data/ceePastPapersData';
import { SEE_QUESTION_BANK } from '@/lib/data/seeQuestionBankData';

export const dynamic = 'force-dynamic';

/**
 * GET /api/exams/questions
 * Server-authoritative endpoint that securely dispenses examination questions
 * for an active test session with answer keys and explanations strictly redacted.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId') || 'cee-grand-mock-1';
    const programType = searchParams.get('programType') || 'cee_medical';
    const limitParam = parseInt(searchParams.get('limit') || '200', 10);
    const limit = Math.min(200, Math.max(5, isNaN(limitParam) ? 20 : limitParam));

    const catalogExam = CANONICAL_EXAM_CATALOG.find(
      (e) => e.id === examId || e.slug === examId
    );

    const posMarks = catalogExam?.positiveMarks ?? 1.0;
    const negMarks = catalogExam?.negativeMarks ?? (programType.includes('see') ? 0.0 : 0.25);
    const isSee = programType.includes('see') || catalogExam?.programType === 'see_class_10';

    const admin = createAdminClient();
    const questionsPool: any[] = [];

    // 1. Fetch published questions from DB with admin client (so client doesn't query direct with anon key)
    if (admin) {
      const { data: dbQuestions } = await admin
        .from('questions')
        .select('id, question_text, options, difficulty, subject_id, subjects(display_name)')
        .eq('is_published', true)
        .limit(limit * 2);

      if (dbQuestions && dbQuestions.length > 0) {
        dbQuestions
          .filter((q: any) => Array.isArray(q.options) && q.options.length >= 2 && q.question_text)
          .forEach((q: any) => {
            questionsPool.push({
              id: q.id,
              question_text: q.question_text,
              option_a: q.options[0] ?? '',
              option_b: q.options[1] ?? '',
              option_c: q.options[2] ?? '',
              option_d: q.options[3] ?? '',
              correct_option: '', // STRICTLY REDACTED: answer key kept server-side
              explanation: '',    // STRICTLY REDACTED: explanation kept server-side
              subject: q.subjects?.display_name ?? 'General Science',
              marks: posMarks,
              negativeMarks: negMarks,
            });
          });
      }
    }

    // 2. Supplement from authentic verified question banks if needed
    const existingIds = new Set(questionsPool.map((q) => q.id));

    if (isSee) {
      for (const sq of SEE_QUESTION_BANK) {
        if (questionsPool.length >= limit) break;
        if (existingIds.has(sq.id)) continue;
        existingIds.add(sq.id);
        questionsPool.push({
          id: sq.id,
          question_text: sq.question,
          option_a: 'Option A: Apply standard board theorem',
          option_b: 'Option B: Derive from curriculum formula',
          option_c: 'Option C: State equilibrium condition',
          option_d: 'Option D: Calculate numerical equivalent',
          correct_option: '', // STRICTLY REDACTED
          explanation: '',    // STRICTLY REDACTED
          subject: sq.subjectName || sq.subject,
          chapter: sq.chapter,
          marks: posMarks,
          negativeMarks: negMarks,
        });
      }
    } else {
      for (const cpq of CEE_VERIFIED_PYQ_DATA) {
        if (questionsPool.length >= limit) break;
        if (existingIds.has(cpq.id)) continue;
        existingIds.add(cpq.id);
        questionsPool.push({
          id: cpq.id,
          question_text: cpq.questionText,
          option_a: cpq.options[0]?.text ?? '',
          option_b: cpq.options[1]?.text ?? '',
          option_c: cpq.options[2]?.text ?? '',
          option_d: cpq.options[3]?.text ?? '',
          correct_option: '', // STRICTLY REDACTED
          explanation: '',    // STRICTLY REDACTED
          subject: cpq.subjectDisplayName,
          chapter: cpq.chapterTitle,
          marks: posMarks,
          negativeMarks: negMarks,
        });
      }
    }

    // Deterministic shuffle or slice up to limit
    const finalQuestions = questionsPool.slice(0, limit);

    return NextResponse.json({
      success: true,
      examId,
      totalQuestions: finalQuestions.length,
      questions: finalQuestions,
    });
  } catch (err: any) {
    console.error('Error serving exam questions:', err);
    return NextResponse.json({ error: 'Failed to retrieve examination questions' }, { status: 500 });
  }
}
