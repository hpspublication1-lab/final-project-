'use server';

import { createClient } from '@/lib/supabase/server';

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
  chapterId?: string | null
): Promise<FetchQuestionsResult> {
  try {
    const supabase = await createClient();

    // Map display name to enum value
    const subjectMap: Record<string, string> = {
      Biology: 'biology',
      Chemistry: 'chemistry',
      Physics: 'physics',
      'Mental Agility': 'mental_agility',
    };
    const subjectEnum = subjectMap[subjectName] ?? subjectName.toLowerCase();

    // Get subject id
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', subjectEnum)
      .single();

    if (subjectError || !subjectData) {
      return { questions: [], error: `Subject not found: ${subjectName}` };
    }

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

    if (chapterId) {
      query = query.eq('chapter_id', chapterId);
    }

    if (difficulty !== 'All') {
      query = query.eq('difficulty', difficulty.toLowerCase());
    }

    // Fetch more than needed so we can randomize
    const fetchCount = Math.min(count * 3, 200);
    let { data, error } = await query.limit(fetchCount);

    if (error) {
      console.warn('Primary question query failed, attempting wildcard fallback:', error.message);
      // Fallback query without strict column listing
      const fallbackQuery = supabase
        .from('questions')
        .select('*, subjects(name, display_name), chapters(title)')
        .eq('subject_id', subjectData.id);
      
      const fallbackResult = await fallbackQuery.limit(fetchCount);
      data = fallbackResult.data;
      if (fallbackResult.error && (!data || data.length === 0)) {
        console.error('Error fetching questions:', error.message);
        return { questions: [], error: error.message };
      }
    }

    if (!data || data.length === 0) {
      return { questions: [], error: null };
    }

    // Shuffle and take requested count
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    const questions: QuestionRow[] = selected.map((row: any) => {
      // Support both option_a..d and options JSON array format
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
        // Normalise to the option-id scheme the UI uses ('a'|'b'|'c'|'d').
        // correct_answer may be a letter ("B"), an index, or the option text.
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
  } catch (err: any) {
    console.error('fetchPracticeQuestions error:', err);
    return { questions: [], error: err.message ?? 'Unknown error' };
  }
}

export interface SaveAttemptInput {
  subjectName: string;
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
    const subjectMap: Record<string, string> = {
      Biology: 'biology',
      Chemistry: 'chemistry',
      Physics: 'physics',
      'Mental Agility': 'mental_agility',
    };
    const subjectEnum = subjectMap[input.subjectName] ?? input.subjectName.toLowerCase();

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', subjectEnum)
      .maybeSingle();

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
