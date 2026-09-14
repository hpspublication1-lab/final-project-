import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  calculateSessionMetrics,
  isAnswerCorrect,
  normalizeOptionKey,
} from '@/lib/scoring';
import { SEE_QUESTION_BANK } from '@/lib/data/seeQuestionBankData';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      sessionId = 'session-' + Date.now(),
      courseSlug = 'cee_medical',
      subjectId,
      chapterId,
      totalSessionTimeSec = 0,
      answers = [],
    } = body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'No answers provided for evaluation' }, { status: 400 });
    }

    const admin = createAdminClient() || supabase;
    const questionIds = answers.map((a: any) => a.questionId).filter(Boolean);

    // 1. Fetch authoritative question keys from DB
    const { data: dbQuestions } = await admin
      .from('questions')
      .select('id, question_text, options, correct_answer, explanation, difficulty, subject_id, chapter_id')
      .in('id', questionIds);

    const questionMap = new Map<string, any>();
    (dbQuestions || []).forEach((q: any) => questionMap.set(q.id, q));

    // Fallback lookup in curated SEE question bank
    SEE_QUESTION_BANK.forEach((sq) => {
      if (!questionMap.has(sq.id)) {
        questionMap.set(sq.id, {
          id: sq.id,
          question_text: sq.question,
          options: [],
          correct_answer: sq.solution,
          explanation: sq.solution,
          difficulty: sq.difficulty.toLowerCase(),
          marks: sq.marks,
          markingScheme: sq.markingScheme,
        });
      }
    });

    const isSee = courseSlug.includes('see');
    const defaultPosMarks = 1.0;
    const defaultNegMarks = isSee ? 0.0 : 0.25;

    const attemptsInputs: any[] = [];
    const questionResults: any[] = [];
    const dbAttemptRows: any[] = [];

    // 2. Server-Side Verification of every answer
    for (const ans of answers) {
      const q = questionMap.get(ans.questionId);
      const selectedOption = ans.selectedOption ? String(ans.selectedOption).trim() : null;
      const rawCorrect = q?.correct_answer ?? 'A';
      const qMarks = q?.marks ?? defaultPosMarks;
      const qNeg = isSee ? 0 : defaultNegMarks;

      let isCorrect = false;
      let correctOptionNormalized = 'a';

      if (rawCorrect) {
        correctOptionNormalized = normalizeOptionKey(String(rawCorrect));
        isCorrect = isAnswerCorrect(selectedOption, correctOptionNormalized);
      }

      attemptsInputs.push({
        questionId: ans.questionId,
        selectedOption,
        correctOption: correctOptionNormalized,
        marks: qMarks,
        negativeMarks: qNeg,
        timeSpentSeconds: ans.timeSpentSeconds || 0,
      });

      const marksAwarded = !selectedOption ? 0 : isCorrect ? qMarks : -qNeg;

      questionResults.push({
        questionId: ans.questionId,
        selectedOption,
        correctOption: correctOptionNormalized,
        isCorrect,
        marksAwarded: Math.round(marksAwarded * 100) / 100,
        explanation: q?.explanation || 'Comprehensive concept explanation.',
        difficulty: q?.difficulty || 'medium',
        markingScheme: q?.markingScheme || null,
      });

      // Prepare database practice attempt row if authenticated
      if (user) {
        dbAttemptRows.push({
          student_id: user.id,
          question_id: ans.questionId,
          selected_option: selectedOption || 'unanswered',
          is_correct: isCorrect,
          subject_id: q?.subject_id || subjectId || null,
          difficulty: q?.difficulty || 'medium',
          session_id: sessionId,
          created_at: new Date().toISOString(),
        });
      }
    }

    // 3. Compute Certified Session Metrics
    const metrics = calculateSessionMetrics(
      attemptsInputs,
      {
        positiveMarks: defaultPosMarks,
        negativeMarks: defaultNegMarks,
        allowNegativeTotal: !isSee,
      },
      Number(totalSessionTimeSec) || 0
    );

    // 4. Record student attempt history & mistake notebook
    if (user && dbAttemptRows.length > 0) {
      try {
        await admin.from('practice_attempts').insert(dbAttemptRows);
      } catch (insertErr) {
        console.warn('Could not save practice attempts:', insertErr);
      }

      // Update topic mastery if chapterId is present
      if (chapterId) {
        try {
          const nowIso = new Date().toISOString();
          const { data: existingMastery } = await admin
            .from('topic_mastery')
            .select('id, mastery_score')
            .eq('student_id', user.id)
            .eq('chapter_id', chapterId)
            .maybeSingle();

          const newScore = Math.max(existingMastery?.mastery_score || 0, metrics.percentage);
          await admin
            .from('topic_mastery')
            .upsert({
              student_id: user.id,
              chapter_id: chapterId,
              subject_id: subjectId || null,
              mastery_score: newScore,
              accuracy: metrics.accuracy,
              mastery_level: metrics.percentage >= 80 ? 'strong' : 'developing',
              last_practiced_at: nowIso,
            });
        } catch {
          // Non-blocking
        }
      }
    }

    return NextResponse.json({
      success: true,
      sessionId,
      courseSlug,
      metrics,
      questionResults,
    });
  } catch (err: any) {
    console.error('practice/evaluate error:', err);
    return NextResponse.json({ error: err.message || 'Scoring evaluation failed' }, { status: 500 });
  }
}
