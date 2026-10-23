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

export interface ChapterOption {
  id: string;
  title: string;
}

import { FALLBACK_PRACTICE_QUESTIONS } from '@/lib/data/practiceQuestionsFallback';

const SUBJECT_MAP: Record<string, string> = {
  // CEE
  biology: 'biology',
  chemistry: 'chemistry',
  physics: 'physics',
  'mental agility': 'mental_agility',
  mental_agility: 'mental_agility',
  mat: 'mental_agility',
  botany: 'biology',
  zoology: 'biology',

  // SEE
  'compulsory science': 'compulsory_science',
  'compulsory science & tech': 'compulsory_science',
  compulsory_science: 'compulsory_science',
  science: 'compulsory_science',
  'compulsory mathematics': 'compulsory_math',
  compulsory_math: 'compulsory_math',
  'compulsory math': 'compulsory_math',
  math: 'compulsory_math',
  mathematics: 'compulsory_math',
  'optional mathematics': 'optional_math',
  optional_math: 'optional_math',
  'opt math': 'optional_math',
  opt_math: 'optional_math',
  english: 'english',
  'social studies': 'social_studies',
  social_studies: 'social_studies',

  // Lok Sewa
  'general knowledge': 'loksewa_gk',
  'general knowledge (gk)': 'loksewa_gk',
  'general knowledge (gk / सामान्य ज्ञान)': 'loksewa_gk',
  loksewa_gk: 'loksewa_gk',
  gk: 'loksewa_gk',
  'general mental ability (iq / बौद्धिक परीक्षण)': 'loksewa_iq',
  'general mental ability': 'loksewa_iq',
  loksewa_iq: 'loksewa_iq',
  iq: 'loksewa_iq',
  'governance & constitution (शासन प्रणाली)': 'loksewa_governance',
  'governance & constitution': 'loksewa_governance',
  loksewa_governance: 'loksewa_governance',

  // IOE & NEB
  'engineering mathematics': 'engineering_math',
  'engineering mathematics (ioe 140m)': 'engineering_math',
  engineering_math: 'engineering_math',
  'computer science': 'neb_computer_science',
  'computer science & c programming': 'neb_computer_science',
  neb_computer_science: 'neb_computer_science',
};

function normalizeSubjectSlug(subjectName: string): string {
  const clean = (subjectName || '').toLowerCase().trim();
  return SUBJECT_MAP[clean] || clean.replace(/\s+/g, '_');
}

const DEFAULT_CURRICULUM_CHAPTERS: Record<string, string[]> = {
  biology: ['Cell Biology & Genetics', 'Plant Physiology', 'Animal Diversity', 'Human Physiology', 'Ecology & Environment'],
  chemistry: ['Chemical Bonding & Structure', 'Physical Chemistry & Thermodynamics', 'Organic Chemistry', 'Inorganic Chemistry', 'Electrochemistry'],
  physics: ['Mechanics & Gravitation', 'Optics & Wave Motion', 'Heat & Thermodynamics', 'Current Electricity & Magnetism', 'Modern Physics'],
  mental_agility: ['Number Series & Coding', 'Logical & Analytical Reasoning', 'Spatial & Visual Puzzles', 'Verbal Reasoning'],
  compulsory_science: ['Force & Gravitation', 'Pressure & Hydraulics', 'Energy, Light & Electricity', 'Chemical Reactions & Periodic Table', 'Metals & Industrial Chemistry', 'Heredity & Chromosomes'],
  compulsory_math: ['Sets & Cardinality', 'Compound Interest', 'Mensuration (3D Solids)', 'Algebra & Equations', 'Geometry (Theorems & Circles)', 'Trigonometry & Statistics'],
  optional_math: ['Functions & Polynomials', 'Matrices & Determinants', 'Coordinate Geometry', 'Trigonometry', 'Vectors & Transformation', 'Statistics'],
  english: ['Grammar & Sentence Structure', 'Reading Comprehension & Vocabulary', 'Subject-Verb Agreement', 'Indirect Speech & Voice'],
  social_studies: ['Constitution of Nepal (2072)', 'Social Problems & Solutions', 'Geography & Heritage of Nepal', 'International Relations & UN'],
  loksewa_gk: ['Geography & History of Nepal', 'Constitution & Governance', 'Socio-Economic Development', 'Current Affairs & SAARC'],
  loksewa_iq: ['Logical Deduction', 'Numerical Sequence', 'Analogy & Classification', 'Spatial Reasoning'],
};

export async function fetchSubjectChapters(subjectName: string): Promise<ChapterOption[]> {
  const targetSlug = normalizeSubjectSlug(subjectName);
  try {
    const supabase = await createClient();
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name, display_name')
      .or(`name.eq.${targetSlug},name.ilike.%${targetSlug}%,display_name.ilike.%${subjectName.trim()}%`)
      .limit(1)
      .maybeSingle();

    if (subjectData) {
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, title')
        .eq('subject_id', subjectData.id)
        .order('order_index', { ascending: true });

      if (chapters && chapters.length > 0) {
        return chapters as ChapterOption[];
      }
    }
  } catch (err) {
    console.warn('fetchSubjectChapters Supabase query failed, falling back to curriculum defaults:', err);
  }

  // Graceful fallback to verified curriculum chapters
  const fallbackTitles = DEFAULT_CURRICULUM_CHAPTERS[targetSlug] || [
    'Fundamental Concepts',
    'Core Problem Solving',
    'Advanced High-Yield Applications',
  ];

  return fallbackTitles.map((title, idx) => ({
    id: `chap-${targetSlug}-${idx + 1}`,
    title,
  }));
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
  const targetSlug = normalizeSubjectSlug(subjectName);

  try {
    const supabase = await createClient();

    // Flexible subject resolution (matches slug or display name)
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name, display_name')
      .or(`name.eq.${targetSlug},name.ilike.%${targetSlug}%,display_name.ilike.%${subjectName.trim()}%`)
      .limit(1)
      .maybeSingle();

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

      if (chapterId && !chapterId.startsWith('chap-')) {
        query = query.eq('chapter_id', chapterId);
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

  // Graceful fallback to verified practice question bank
  const matchingFallback = FALLBACK_PRACTICE_QUESTIONS.filter((q) => {
    if (q.subjectSlug === targetSlug) return true;
    if (targetSlug.includes('science') && (q.subjectSlug === 'compulsory_science' || q.subjectSlug === 'physics' || q.subjectSlug === 'chemistry')) return true;
    if (targetSlug.includes('math') && (q.subjectSlug === 'compulsory_math' || q.subjectSlug === 'optional_math')) return true;
    if (targetSlug.includes('bio') && q.subjectSlug === 'biology') return true;
    return false;
  });

  const pool = matchingFallback.length > 0 ? matchingFallback : FALLBACK_PRACTICE_QUESTIONS;
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
    const subjectSlug = normalizeSubjectSlug(input.subjectName);

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .or(`name.eq.${subjectSlug},name.ilike.%${subjectSlug}%,display_name.ilike.%${input.subjectName.trim()}%`)
      .limit(1)
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
