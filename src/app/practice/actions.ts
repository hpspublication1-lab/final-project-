'use server';

import { createClient } from '@/lib/supabase/server';
import { withProgramType } from '@/lib/courses/programColumn';

export interface QuestionRow {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  subjectId: string | null;
  chapterId: string | null;
  subjectName: string | null;
  chapterTitle: string | null;
}

export interface FetchQuestionsResult {
  questions: QuestionRow[];
  error: string | null;
}

export interface ChapterOption {
  id: string;
  title: string;
}

import { FALLBACK_PRACTICE_QUESTIONS } from '@/lib/data/practiceQuestionsFallback';
import { FALLBACK_SUBJECT_COURSE, normalizeSubjectSlug } from '@/lib/data/fallbackBankScope';
import { parseCourseId, resolveRowCourse } from '@/lib/courses/courseIds';
import type { CanonicalCourseId } from '@/contexts/ProgramContext';


type SubjectRow = { id: string; name: string | null; display_name: string | null; slug?: string | null; program_type?: string | null };

/**
 * Find a subject by name inside one course. Matching happens here rather than in
 * a PostgREST `.or()` string, which the subject name used to be pasted into.
 */
async function findSubjectForCourse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  subjectName: string,
  course: CanonicalCourseId | null,
): Promise<SubjectRow | null> {
  if (!course) return null;
  const { data, error } = await supabase.from('subjects').select(await withProgramType(supabase, 'subjects', 'id, name, display_name, slug')).limit(500);
  if (error || !data) return null;
  const mine = (data as unknown as SubjectRow[]).filter((row) => resolveRowCourse(row) === course);
  const wantSlug = normalizeSubjectSlug(subjectName);
  const wantName = subjectName.trim().toLowerCase();
  const keys = (row: SubjectRow) => [row.slug, row.name, row.display_name].filter(Boolean).map((v) => String(v).toLowerCase());
  return (
    mine.find((row) => keys(row).some((k) => k === wantSlug || k === wantName || normalizeSubjectSlug(k) === wantSlug)) ??
    mine.find((row) => keys(row).some((k) => k.includes(wantSlug) || k.includes(wantName))) ??
    null
  );
}

/** The subjects stored for a course, for courses with no built-in subject list. */
export async function fetchCourseSubjects(courseRaw: string): Promise<{ id: string; name: string }[]> {
  const course = parseCourseId(courseRaw);
  if (!course) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('subjects')
      .select(await withProgramType(supabase, 'subjects', 'id, name, display_name, slug, is_active, sort_order'))
      .order('sort_order', { ascending: true })
      .limit(500);
    if (error || !data) return [];
    return (data as unknown as (SubjectRow & { is_active?: boolean | null })[])
      .filter((row) => row.is_active !== false && resolveRowCourse(row) === course)
      .map((row) => ({ id: row.id, name: row.display_name || row.name || '' }))
      .filter((row) => row.name);
  } catch {
    return [];
  }
}




export async function fetchSubjectChapters(subjectName: string, courseRaw: string): Promise<ChapterOption[]> {
  try {
    const supabase = await createClient();
    const subjectData = await findSubjectForCourse(supabase, subjectName, parseCourseId(courseRaw));
    if (!subjectData) return [];
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, title')
      .eq('subject_id', subjectData.id)
      .order('order_index', { ascending: true });
    // Real chapters only. A made-up list ("Fundamental Concepts", …) used to be shown
    // when there were none, and picking one of those filtered nothing.
    return (chapters as ChapterOption[] | null) ?? [];
  } catch (err) {
    console.warn('fetchSubjectChapters failed:', err);
    return [];
  }
}

/** Normalise a DB correct answer (letter "B", index "1", or option text) to an
 *  option id: 'a' | 'b' | 'c' | 'd'. */
function toOptionId(correct: unknown, options: string[]): string {
  const ids = ['a', 'b', 'c', 'd'];
  if (typeof correct === 'number') return ids[correct] ?? 'a';
  const s = String(correct ?? '').trim();
  if (/^[A-Da-d]$/.test(s)) return s.toLowerCase();
  if (/^[0-9]+$/.test(s)) return ids[parseInt(s, 10)] ?? 'a';
  const idx = options.findIndex((o) => (o ?? '').trim() === s);
  return ids[idx >= 0 ? idx : 0];
}

export async function fetchPracticeQuestions(
  subjectName: string,
  difficulty: string,
  count: number,
  chapterId: string | null | undefined,
  courseRaw: string
): Promise<FetchQuestionsResult> {
  const targetSlug = normalizeSubjectSlug(subjectName);
  const course = parseCourseId(courseRaw);
  if (!course) return { questions: [], error: 'Unknown course.' };
  const realChapter = !!chapterId && !chapterId.startsWith('chap-');

  try {
    const supabase = await createClient();

    // The subject must belong to this student's course.
    const subjectData = await findSubjectForCourse(supabase, subjectName, course);

    if (subjectData) {
      // Build query — real schema: options (array), correct_answer (letter), is_published.
      let query = supabase
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
          subjects(name, display_name),
          chapters(title)
        `)
        .eq('subject_id', subjectData.id)
        .eq('is_published', true);

      if (realChapter) {
        query = query.eq('chapter_id', chapterId as string);
      }

      if (difficulty !== 'All') {
        query = query.eq('difficulty', difficulty.toLowerCase());
      }

      // Fetch more than needed so we can randomize
      const fetchCount = Math.min(count * 3, 200);
      const { data, error } = await query.limit(fetchCount);

      if (!error && data && data.length > 0) {
        // Shuffle and take requested count
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, count);

        const questions: QuestionRow[] = selected.map((row: any) => {
          const opts = Array.isArray(row.options) ? row.options : [];
          const optionA = row.option_a ?? opts[0]?.text ?? opts[0] ?? '';
          const optionB = row.option_b ?? opts[1]?.text ?? opts[1] ?? '';
          const optionC = row.option_c ?? opts[2]?.text ?? opts[2] ?? '';
          const optionD = row.option_d ?? opts[3]?.text ?? opts[3] ?? '';
          return {
            id: row.id,
            questionText: row.question_text ?? row.question ?? '',
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption: toOptionId(row.correct_option ?? row.correct_answer, [optionA, optionB, optionC, optionD]),
            explanation: row.explanation ?? null,
            difficulty: row.difficulty ?? 'medium',
            subjectId: row.subject_id ?? null,
            chapterId: row.chapter_id ?? null,
            subjectName: row.subjects?.display_name ?? subjectName,
            chapterTitle: row.chapters?.title ?? null,
          };
        });

        return { questions, error: null };
      }
    }
  } catch (err: any) {
    console.warn('Database question fetch encountered an issue, falling back to verified bank:', err?.message);
  }

  // Built-in bank: only this exact subject, only in its own course, and only when no
  // chapter was picked (the bank has no chapter ids). It used to fall back to SEE
  // science → CEE physics/chemistry, and to the whole bank when nothing matched.
  if (realChapter || FALLBACK_SUBJECT_COURSE[targetSlug] !== course) {
    return { questions: [], error: null };
  }
  const pool = FALLBACK_PRACTICE_QUESTIONS.filter(
    (q) => q.subjectSlug === targetSlug && (difficulty === 'All' || q.difficulty === difficulty.toLowerCase()),
  );
  const shuffledFallback = [...pool].sort(() => Math.random() - 0.5);
  const selectedFallback = shuffledFallback.slice(0, count);

  const fallbackRows: QuestionRow[] = selectedFallback.map((fb, idx) => ({
    id: fb.id || `fb-q-${idx}`,
    questionText: fb.questionText,
    optionA: fb.optionA,
    optionB: fb.optionB,
    optionC: fb.optionC,
    optionD: fb.optionD,
    correctOption: fb.correctOption,
    explanation: fb.explanation,
    difficulty: fb.difficulty,
    subjectId: null,
    chapterId: null,
    subjectName: fb.subjectDisplayName || subjectName,
    chapterTitle: fb.chapterTitle,
  }));

  return { questions: fallbackRows, error: null };
}

export interface SaveAttemptInput {
  subjectName: string;
  /** The student's course; the subject is looked up inside it. */
  course?: string;
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattempted: number;
  score: number;
  totalMarks: number;
  timeTakenSeconds: number;
  questionAttempts: Array<{
    questionId: string;
    selectedOption: string;
    isCorrect: boolean;
    subjectId: string | null;
    difficulty: string;
  }>;
}

export interface SaveAttemptResult {
  success: boolean;
  attemptId: string | null;
  error: string | null;
}

export async function savePracticeAttempt(input: SaveAttemptInput): Promise<SaveAttemptResult> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, attemptId: null, error: 'Not authenticated' };
    }

    // Get or create a practice exam record
    const practiceTitle = `Practice: ${input.subjectName} (${input.difficulty})`;

    const subjectData = await findSubjectForCourse(supabase, input.subjectName, parseCourseId(input.course ?? ''));

    // Upsert a practice exam
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .upsert(
        {
          title: practiceTitle,
          description: `Auto-generated practice session for ${input.subjectName}`,
          subject_id: subjectData?.id ?? null,
          duration_minutes: Math.ceil(input.timeTakenSeconds / 60) + 5,
          total_marks: input.totalMarks,
          is_published: true, // exams table uses is_published (no is_active/is_premium/negative_marking)
        },
        { onConflict: 'title', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (examError || !examData) {
      // Try to fetch existing exam
      const { data: existingExam } = await supabase
        .from('exams')
        .select('id')
        .eq('title', practiceTitle)
        .maybeSingle();

      if (!existingExam) {
        return { success: false, attemptId: null, error: examError?.message ?? 'Could not find or create exam' };
      }

      // Save attempt with existing exam
      return await insertAttempt(supabase, user.id, existingExam.id, input);
    }

    return await insertAttempt(supabase, user.id, examData.id, input);
  } catch (err: any) {
    console.error('savePracticeAttempt error:', err);
    return { success: false, attemptId: null, error: err.message ?? 'Unknown error' };
  }
}

async function insertAttempt(
  supabase: any,
  userId: string,
  examId: string,
  input: SaveAttemptInput
): Promise<SaveAttemptResult> {
  const percentage = input.totalMarks > 0
    ? Math.round((input.score / input.totalMarks) * 100)
    : 0;

  const { data: attemptData, error: attemptError } = await supabase
    .from('exam_attempts')
    .insert({
      exam_id: examId,
      student_id: userId,
      score: input.score,
      total_marks: input.totalMarks,
      correct_answers: input.correctAnswers,
      incorrect_answers: input.incorrectAnswers,
      unattempted: input.unattempted,
      percentage,
      time_taken_seconds: input.timeTakenSeconds,
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (attemptError || !attemptData) {
    console.error('Error saving attempt:', attemptError?.message);
    return { success: false, attemptId: null, error: attemptError?.message ?? 'Failed to save attempt' };
  }

  // Save individual question attempts (best-effort, don't fail if this errors)
  if (input.questionAttempts.length > 0) {
    const sessionId = attemptData.id;
    const rows = input.questionAttempts.map((qa) => ({
      student_id: userId,
      question_id: qa.questionId,
      selected_option: qa.selectedOption,
      is_correct: qa.isCorrect,
      subject_id: qa.subjectId,
      difficulty: qa.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
      session_id: sessionId,
    }));

    await supabase.from('practice_attempts').insert(rows);
  }

  return { success: true, attemptId: attemptData.id, error: null };
}
