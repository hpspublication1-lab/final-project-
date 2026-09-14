import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  calculateRankAndPercentile,
  calculateBreakdowns,
  identifyWeakTopicsAndRecommendations,
  validateSubmissionSecurity,
  CANONICAL_EXAM_CATALOG
} from '@/lib/exams/examRegistry';
import { normalizeOptionKey, isAnswerCorrect } from '@/lib/scoring';
import { SEE_QUESTION_BANK } from '@/lib/data/seeQuestionBankData';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      examId,
      attemptId,
      timeTakenSeconds = 0,
      answers = {},
      questionIds = [],
    } = body;

    if (!examId) {
      return NextResponse.json({ error: 'Missing examId' }, { status: 400 });
    }

    const admin = createAdminClient() || supabase;

    // 0. Result Privacy & Duplicate Submission Guard
    if (attemptId) {
      const { data: existingAttempt } = await admin
        .from('exam_attempts')
        .select('id, student_id, completed_at, score, total_marks, percentage')
        .eq('id', attemptId)
        .maybeSingle();

      if (existingAttempt) {
        const securityCheck = validateSubmissionSecurity(existingAttempt, user?.id || null);
        if (!securityCheck.allowed) {
          if (securityCheck.isDuplicate) {
            return NextResponse.json({
              success: true,
              isDuplicate: true,
              attemptId: existingAttempt.id,
              examId,
              message: 'This examination attempt was already finalized and scored.',
              score: existingAttempt.score,
              totalMarks: existingAttempt.total_marks,
              percentage: existingAttempt.percentage,
              alreadyCompleted: true,
            });
          } else {
            return NextResponse.json(
              { error: securityCheck.error || 'Forbidden: Unauthorized attempt access' },
              { status: securityCheck.statusCode || 403 }
            );
          }
        }
      }
    }

    // 1. Resolve exam configuration (from DB or canonical spec)
    let examSpec = CANONICAL_EXAM_CATALOG.find((e) => e.id === examId || e.slug === examId);
    let dbExam: any = null;

    if (!examSpec) {
      const { data } = await admin
        .from('exams')
        .select('*')
        .eq('id', examId)
        .maybeSingle();
      if (data) {
        dbExam = data;
        const isSee = (data.title || '').toLowerCase().includes('see');
        examSpec = {
          id: data.id,
          slug: data.id,
          title: data.title,
          description: data.description || '',
          category: isSee ? 'see_model' : 'cee_full_200',
          programType: isSee ? 'see_class_10' : 'cee_medical',
          totalQuestions: data.total_marks || 100,
          totalMarks: data.total_marks || 100,
          durationMinutes: data.duration_minutes || 180,
          positiveMarks: 1.0,
          negativeMarks: isSee ? 0.0 : 0.25,
          allowNegativeTotal: !isSee,
          isPremium: false,
          isFreeDiagnostic: false,
          sections: [],
        };
      }
    }

    const isSee = examSpec?.programType === 'see_class_10';
    const posMarks = examSpec?.positiveMarks ?? 1.0;
    const negMarks = examSpec?.negativeMarks ?? (isSee ? 0.0 : 0.25);
    const allowNegative = examSpec?.allowNegativeTotal ?? !isSee;

    // 2. Fetch authoritative questions from DB & fallback to curated SEE bank
    const qIdsToFetch = Array.isArray(questionIds) && questionIds.length > 0
      ? questionIds
      : Object.keys(answers);

    const { data: dbQuestions } = await admin
      .from('questions')
      .select('id, question_text, options, correct_answer, explanation, difficulty, subject_id, chapter_id, subjects(display_name, name), chapters(title)')
      .in('id', qIdsToFetch);

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
          subject: sq.subjectName || sq.subject,
          chapter: sq.chapter,
          marks: sq.marks,
        });
      }
    });

    // 3. Grade each question server-side
    const keyMap = new Map<string, { correctOption: string; marks: number; negativeMarks: number }>();
    const questionsForBreakdown: any[] = [];
    const questionEvaluations: any[] = [];
    const practiceAttemptRows: any[] = [];

    let totalPossibleMarks = 0;
    let rawScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    for (const qId of qIdsToFetch) {
      const q = questionMap.get(qId);
      const qMarks = q?.marks ?? posMarks;
      const qNeg = isSee ? 0 : negMarks;
      totalPossibleMarks += qMarks;

      let correctOpt = 'a';
      if (q?.correct_answer) {
        correctOpt = normalizeOptionKey(String(q.correct_answer));
      } else if (Array.isArray(q?.options) && q.options.length > 0) {
        correctOpt = 'a';
      }

      keyMap.set(qId, { correctOption: correctOpt, marks: qMarks, negativeMarks: qNeg });

      const studentAns = answers[qId] ? String(answers[qId]).toLowerCase().trim() : null;

      const subjName = q?.subjects?.display_name || q?.subject || 'General';
      const chapName = q?.chapters?.title || q?.chapter || 'General Concepts';

      questionsForBreakdown.push({
        id: qId,
        subject: subjName,
        chapter: chapName,
        marks: qMarks,
        negativeMarks: qNeg,
      });

      if (!studentAns) {
        unattemptedCount++;
        questionEvaluations.push({
          questionId: qId,
          selectedOption: null,
          correctOption: correctOpt,
          isCorrect: false,
          marksAwarded: 0,
          explanation: q?.explanation || 'Comprehensive concept explanation.',
        });
      } else {
        const isCorrect = isAnswerCorrect(studentAns, correctOpt);
        if (isCorrect) {
          correctCount++;
          rawScore += qMarks;
          questionEvaluations.push({
            questionId: qId,
            selectedOption: studentAns,
            correctOption: correctOpt,
            isCorrect: true,
            marksAwarded: qMarks,
            explanation: q?.explanation || 'Comprehensive concept explanation.',
          });
        } else {
          incorrectCount++;
          rawScore -= qNeg;
          questionEvaluations.push({
            questionId: qId,
            selectedOption: studentAns,
            correctOption: correctOpt,
            isCorrect: false,
            marksAwarded: -qNeg,
            explanation: q?.explanation || 'Comprehensive concept explanation.',
          });
        }

        if (user) {
          practiceAttemptRows.push({
            student_id: user.id,
            question_id: qId,
            selected_option: studentAns,
            is_correct: isCorrect,
            subject_id: q?.subject_id || null,
            difficulty: q?.difficulty || 'medium',
            session_id: attemptId || null,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    const roundedScore = Math.round(rawScore * 100) / 100;
    const finalScore = !allowNegative && roundedScore < 0 ? 0 : roundedScore;
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const percentage = totalPossibleMarks > 0 ? Math.max(0, Math.round((finalScore / totalPossibleMarks) * 100)) : 0;

    // 4. Calculate Subject and Chapter Performance
    const { subjects, chapters } = calculateBreakdowns(
      questionsForBreakdown,
      answers,
      keyMap,
      posMarks,
      negMarks
    );

    const { weakTopics, recommendations } = identifyWeakTopicsAndRecommendations(chapters);

    // 5. Authentic Rank & Percentile Calculation
    // Query database for all valid past attempts on this exam
    let rank: number | null = null;
    let percentile: number | null = null;
    let notEnoughData = true;
    let totalCandidates = 0;

    try {
      const { data: pastAttempts } = await admin
        .from('exam_attempts')
        .select('score')
        .eq('exam_id', examId)
        .not('score', 'is', null);

      const candidateScores = (pastAttempts || []).map((p: any) => Number(p.score)).filter((s: any) => !isNaN(s));
      // Include current student score
      candidateScores.push(finalScore);

      const rankResult = calculateRankAndPercentile(finalScore, candidateScores);
      rank = rankResult.rank;
      percentile = rankResult.percentile;
      notEnoughData = rankResult.notEnoughData;
      totalCandidates = rankResult.totalCandidates;
    } catch {
      // Fallback safe: zero fabrication
      notEnoughData = true;
    }

    // 6. Record/Update attempt in exam_attempts
    let finalAttemptId = attemptId;
    if (user) {
      try {
        const payload = {
          exam_id: examId,
          student_id: user.id,
          score: finalScore,
          total_marks: totalPossibleMarks,
          correct_answers: correctCount,
          incorrect_answers: incorrectCount,
          unattempted: unattemptedCount,
          percentage,
          percentile,
          time_taken_seconds: Number(timeTakenSeconds) || 0,
          completed_at: new Date().toISOString(),
        };

        if (attemptId) {
          await admin.from('exam_attempts').update(payload).eq('id', attemptId);
        } else {
          const { data: newAttempt } = await admin.from('exam_attempts').insert(payload).select('id').single();
          if (newAttempt) finalAttemptId = newAttempt.id;
        }

        // Insert practice_attempts
        if (practiceAttemptRows.length > 0) {
          await admin.from('practice_attempts').insert(practiceAttemptRows);
        }
      } catch (saveErr) {
        console.warn('Saving exam attempt error:', saveErr);
      }
    }

    const payload = {
      score: finalScore,
      totalMarks: totalPossibleMarks,
      percentage,
      accuracy,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      unattempted: unattemptedCount,
      timeTakenSeconds: Number(timeTakenSeconds) || 0,
      rank,
      percentile,
      notEnoughData,
      totalCandidates,
      subjectBreakdown: subjects,
      chapterBreakdown: chapters,
      subjects,
      chapters,
      weakTopics,
      recommendations,
      questionEvaluations,
    };

    return NextResponse.json({
      success: true,
      attemptId: finalAttemptId,
      examId,
      examTitle: examSpec?.title || dbExam?.title || 'Mock Examination',
      ...payload,
      result: payload,
    });
  } catch (err: any) {
    console.error('api/exams/submit error:', err);
    return NextResponse.json({ error: err.message || 'Submission scoring failed' }, { status: 500 });
  }
}
