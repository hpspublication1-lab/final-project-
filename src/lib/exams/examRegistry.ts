/**
 * Pure, framework-agnostic Exam Registry & Evaluation Engine
 * Handles blueprints for all 8 examination types:
 * 1. CEE Full-Length 200-Question Examinations
 * 2. CEE Subject Tests
 * 3. SEE Subject Tests
 * 4. SEE Model Examinations
 * 5. Chapter Tests
 * 6. Scheduled Tests
 * 7. Practice Tests
 * 8. Free Diagnostic Tests
 */

export type ExamCategory =
  | 'cee_full_200'
  | 'cee_subject'
  | 'see_model'
  | 'see_subject'
  | 'chapter_test'
  | 'scheduled_test'
  | 'practice_test'
  | 'diagnostic_free';

export interface ExamSectionBlueprint {
  name: string;
  questionCount: number;
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
  subjectKey: string;
}

export interface CanonicalExamSpec {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: ExamCategory;
  programType: 'cee_medical' | 'see_class_10';
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  positiveMarks: number;
  negativeMarks: number;
  allowNegativeTotal: boolean;
  isPremium: boolean;
  isFreeDiagnostic: boolean;
  scheduledStartIso?: string;
  scheduledEndIso?: string;
  sections: ExamSectionBlueprint[];
}

/** Preloaded Catalog of Authentic Exam Specifications */
export const CANONICAL_EXAM_CATALOG: CanonicalExamSpec[] = [
  // 1. CEE Full-Length 200-Question Mocks
  {
    id: 'cee-grand-mock-1',
    slug: 'cee-grand-mock-1',
    title: 'MEC CEE Grand Mock Examination #1 (Full 200 MCQs)',
    description: 'Authentic 200-question MEC medical entrance simulation covering Physics (50), Chemistry (50), Botany (40), Zoology (40), and MAT (20). Strict -0.25 negative marking applied.',
    category: 'cee_full_200',
    programType: 'cee_medical',
    totalQuestions: 200,
    totalMarks: 200,
    durationMinutes: 180,
    positiveMarks: 1.0,
    negativeMarks: 0.25,
    allowNegativeTotal: true,
    isPremium: false,
    isFreeDiagnostic: false,
    sections: [
      { name: 'Physics', questionCount: 50, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'physics' },
      { name: 'Chemistry', questionCount: 50, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'chemistry' },
      { name: 'Botany', questionCount: 40, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'biology' },
      { name: 'Zoology', questionCount: 40, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'biology' },
      { name: 'Mental Agility Test (MAT)', questionCount: 20, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'mental_agility' },
    ],
  },
  {
    id: 'cee-grand-mock-2',
    slug: 'cee-grand-mock-2',
    title: 'MEC CEE Grand Mock Examination #2 (High Rigor)',
    description: 'Full 200-question comprehensive medical entrance exam simulation with advanced clinical application and numerical problem solving.',
    category: 'cee_full_200',
    programType: 'cee_medical',
    totalQuestions: 200,
    totalMarks: 200,
    durationMinutes: 180,
    positiveMarks: 1.0,
    negativeMarks: 0.25,
    allowNegativeTotal: true,
    isPremium: true,
    isFreeDiagnostic: false,
    sections: [
      { name: 'Physics', questionCount: 50, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'physics' },
      { name: 'Chemistry', questionCount: 50, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'chemistry' },
      { name: 'Botany', questionCount: 40, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'biology' },
      { name: 'Zoology', questionCount: 40, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'biology' },
      { name: 'Mental Agility Test (MAT)', questionCount: 20, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'mental_agility' },
    ],
  },

  // 2. CEE Subject Tests
  {
    id: 'cee-subj-physics',
    slug: 'cee-subj-physics',
    title: 'CEE Physics High-Yield 50-Question Sectional Sprint',
    description: 'Timed drill covering Mechanics, Thermodynamics, Waves, Modern Physics, and Electromagnetism.',
    category: 'cee_subject',
    programType: 'cee_medical',
    totalQuestions: 50,
    totalMarks: 50,
    durationMinutes: 45,
    positiveMarks: 1.0,
    negativeMarks: 0.25,
    allowNegativeTotal: true,
    isPremium: false,
    isFreeDiagnostic: false,
    sections: [{ name: 'Physics', questionCount: 50, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'physics' }],
  },
  {
    id: 'cee-subj-chemistry',
    slug: 'cee-subj-chemistry',
    title: 'CEE Chemistry Comprehensive 50-Question Sprint',
    description: 'Organic reaction mechanisms, stoichiometry, equilibrium, thermodynamics, and inorganic periodicity.',
    category: 'cee_subject',
    programType: 'cee_medical',
    totalQuestions: 50,
    totalMarks: 50,
    durationMinutes: 45,
    positiveMarks: 1.0,
    negativeMarks: 0.25,
    allowNegativeTotal: true,
    isPremium: false,
    isFreeDiagnostic: false,
    sections: [{ name: 'Chemistry', questionCount: 50, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'chemistry' }],
  },
  {
    id: 'cee-subj-biology',
    slug: 'cee-subj-biology',
    title: 'CEE Biology 80-Question Master Test (Botany + Zoology)',
    description: 'Extensive coverage of Human Physiology, Cell Biology, Genetics, Plant Physiology, and Ecology.',
    category: 'cee_subject',
    programType: 'cee_medical',
    totalQuestions: 80,
    totalMarks: 80,
    durationMinutes: 75,
    positiveMarks: 1.0,
    negativeMarks: 0.25,
    allowNegativeTotal: true,
    isPremium: false,
    isFreeDiagnostic: false,
    sections: [{ name: 'Biology', questionCount: 80, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'biology' }],
  },
  {
    id: 'cee-subj-mat',
    slug: 'cee-subj-mat',
    title: 'Mental Agility Test (MAT) 20-Question Speed Sprint',
    description: 'Fast-paced assessment testing spatial intuition, series completion, logical deduction, and verbal agility.',
    category: 'cee_subject',
    programType: 'cee_medical',
    totalQuestions: 20,
    totalMarks: 20,
    durationMinutes: 20,
    positiveMarks: 1.0,
    negativeMarks: 0.25,
    allowNegativeTotal: true,
    isPremium: false,
    isFreeDiagnostic: false,
    sections: [{ name: 'Mental Agility', questionCount: 20, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'mental_agility' }],
  },

  // 3. SEE Model Examinations
  {
    id: 'see-board-model-sci',
    slug: 'see-board-model-sci',
    title: 'SEE Class 10 Compulsory Science Official Model Paper (75 Marks)',
    description: 'Complete NEB CDC board examination model test: Group A (15M Very Short), Group B (26M Short), Group C (18M Long), and Group D (16M HOTS).',
    category: 'see_model',
    programType: 'see_class_10',
    totalQuestions: 38,
    totalMarks: 75,
    durationMinutes: 135,
    positiveMarks: 1.0,
    negativeMarks: 0.0,
    allowNegativeTotal: false,
    isPremium: false,
    isFreeDiagnostic: false,
    sections: [
      { name: 'Group A (Very Short - 1M)', questionCount: 15, marksPerQuestion: 1, negativeMarksPerQuestion: 0, subjectKey: 'science' },
      { name: 'Group B (Short - 2M)', questionCount: 13, marksPerQuestion: 2, negativeMarksPerQuestion: 0, subjectKey: 'science' },
      { name: 'Group C (Problem Solving - 3M)', questionCount: 6, marksPerQuestion: 3, negativeMarksPerQuestion: 0, subjectKey: 'science' },
      { name: 'Group D (HOTS - 4M)', questionCount: 4, marksPerQuestion: 4, negativeMarksPerQuestion: 0, subjectKey: 'science' },
    ],
  },
  {
    id: 'see-board-model-math',
    slug: 'see-board-model-math',
    title: 'SEE Class 10 Compulsory Mathematics Model Test (75 Marks)',
    description: 'NEB board pattern math exam covering Sets, Arithmetic, Algebra, Geometry, Trigonometry, and Statistics.',
    category: 'see_model',
    programType: 'see_class_10',
    totalQuestions: 35,
    totalMarks: 75,
    durationMinutes: 135,
    positiveMarks: 1.0,
    negativeMarks: 0.0,
    allowNegativeTotal: false,
    isPremium: false,
    isFreeDiagnostic: false,
    sections: [{ name: 'Compulsory Mathematics', questionCount: 35, marksPerQuestion: 2, negativeMarksPerQuestion: 0, subjectKey: 'math' }],
  },

  // 4. SEE Subject Tests
  {
    id: 'see-subj-science-unit',
    slug: 'see-subj-science-unit',
    title: 'SEE Science Physics & Chemistry 25-Mark Unit Test',
    description: 'Focused chapter test on Force, Pressure, Chemical Reactions, and Metals.',
    category: 'see_subject',
    programType: 'see_class_10',
    totalQuestions: 15,
    totalMarks: 25,
    durationMinutes: 45,
    positiveMarks: 1.0,
    negativeMarks: 0.0,
    allowNegativeTotal: false,
    isPremium: false,
    isFreeDiagnostic: false,
    sections: [{ name: 'Science', questionCount: 15, marksPerQuestion: 2, negativeMarksPerQuestion: 0, subjectKey: 'science' }],
  },

  // 5. Chapter Tests
  {
    id: 'chapter-force-gravity',
    slug: 'chapter-force-gravity',
    title: 'Chapter Drill: Force, Gravitation & Pressure (25 MCQs)',
    description: 'Rigorous numerical formulas, Newton laws, universal gravity constant, and fluid pressure concepts.',
    category: 'chapter_test',
    programType: 'cee_medical',
    totalQuestions: 25,
    totalMarks: 25,
    durationMinutes: 25,
    positiveMarks: 1.0,
    negativeMarks: 0.25,
    allowNegativeTotal: true,
    isPremium: false,
    isFreeDiagnostic: false,
    sections: [{ name: 'Physics', questionCount: 25, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'physics' }],
  },

  // 6. Scheduled Tests (e.g. Saturday Grand Mock)
  {
    id: 'scheduled-sat-grand-mock',
    slug: 'scheduled-sat-grand-mock',
    title: 'Saturday All-Nepal CEE Live Grand Mock 2082',
    description: 'Nationwide synchronized mock exam. Live leaderboards and authentic percentile scoring published after the exam window closes.',
    category: 'scheduled_test',
    programType: 'cee_medical',
    totalQuestions: 200,
    totalMarks: 200,
    durationMinutes: 180,
    positiveMarks: 1.0,
    negativeMarks: 0.25,
    allowNegativeTotal: true,
    isPremium: false,
    isFreeDiagnostic: false,
    scheduledStartIso: '2026-09-19T10:00:00+05:45',
    scheduledEndIso: '2026-09-19T13:00:00+05:45',
    sections: [
      { name: 'Physics', questionCount: 50, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'physics' },
      { name: 'Chemistry', questionCount: 50, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'chemistry' },
      { name: 'Botany', questionCount: 40, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'biology' },
      { name: 'Zoology', questionCount: 40, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'biology' },
      { name: 'Mental Agility Test (MAT)', questionCount: 20, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'mental_agility' },
    ],
  },

  // 7. Practice Tests
  {
    id: 'practice-general-sprint',
    slug: 'practice-general-sprint',
    title: 'Self-Paced Diagnostic Practice Drill (30 MCQs)',
    description: 'Un-timed, low-stress practice drill with immediate answer explanations and formula references.',
    category: 'practice_test',
    programType: 'cee_medical',
    totalQuestions: 30,
    totalMarks: 30,
    durationMinutes: 35,
    positiveMarks: 1.0,
    negativeMarks: 0.25,
    allowNegativeTotal: true,
    isPremium: false,
    isFreeDiagnostic: false,
    sections: [{ name: 'General Practice', questionCount: 30, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'biology' }],
  },

  // 8. Free Diagnostic Entrance Tests
  {
    id: 'free-cee-diagnostic-1',
    slug: 'free-cee-diagnostic-1',
    title: 'Free All-Nepal CEE Diagnostic Readiness Test',
    description: 'Benchmark your entrance baseline with 50 high-yield questions across all 4 subjects. Open to all students without payment.',
    category: 'diagnostic_free',
    programType: 'cee_medical',
    totalQuestions: 50,
    totalMarks: 50,
    durationMinutes: 45,
    positiveMarks: 1.0,
    negativeMarks: 0.25,
    allowNegativeTotal: true,
    isPremium: false,
    isFreeDiagnostic: true,
    sections: [
      { name: 'Physics', questionCount: 15, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'physics' },
      { name: 'Chemistry', questionCount: 15, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'chemistry' },
      { name: 'Biology', questionCount: 15, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'biology' },
      { name: 'MAT', questionCount: 5, marksPerQuestion: 1, negativeMarksPerQuestion: 0.25, subjectKey: 'mental_agility' },
    ],
  },
];

export interface RankPercentileResult {
  rank: number | null;
  percentile: number | null;
  totalCandidates: number;
  notEnoughData: boolean;
  message?: string;
}

/**
 * Strict Rank and Percentile Calculator
 * RULE: Never fabricate ranks or percentiles.
 * If total valid candidates < 5, returns notEnoughData = true and null rank/percentile.
 */
export function calculateRankAndPercentile(
  studentScore: number,
  candidateScores: number[]
): RankPercentileResult {
  // Ensure we count valid candidate scores
  const validScores = candidateScores.filter((s) => typeof s === 'number' && !isNaN(s));

  if (validScores.length < 5) {
    return {
      rank: null,
      percentile: null,
      totalCandidates: validScores.length,
      notEnoughData: true,
      message: 'Not enough valid attempts yet. Ranks and percentiles are computed after 5+ student submissions.',
    };
  }

  // Calculate Rank: 1 + number of candidates with strictly higher scores
  const strictlyHigher = validScores.filter((s) => s > studentScore).length;
  const rank = strictlyHigher + 1;

  // Calculate Percentile: (number of candidates with score <= studentScore) / total * 100
  const equalOrLower = validScores.filter((s) => s <= studentScore).length;
  const rawPercentile = (equalOrLower / validScores.length) * 100;
  const percentile = Math.round(rawPercentile * 10) / 10;

  return {
    rank,
    percentile,
    totalCandidates: validScores.length,
    notEnoughData: false,
  };
}

export interface SubjectPerformance {
  subject: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  netScore: number;
  maxMarks: number;
  accuracy: number;
}

export interface ChapterPerformance {
  chapter: string;
  subject: string;
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  status: 'strong' | 'average' | 'weak';
}

/** Compute Subject and Chapter breakdowns */
export function calculateBreakdowns(
  questions: Array<{ id: string; subject: string; chapter?: string; marks?: number; negativeMarks?: number }>,
  selectedAnswers: Record<string, string>,
  keyMap: Map<string, { correctOption: string; marks?: number; negativeMarks?: number }>,
  defaultPosMarks = 1.0,
  defaultNegMarks = 0.25
) {
  const subjectMap = new Map<string, SubjectPerformance>();
  const chapterMap = new Map<string, { subject: string; attempted: number; correct: number; incorrect: number }>();

  questions.forEach((q) => {
    const subjName = q.subject || 'General';
    const chapName = q.chapter || 'General Concepts';

    if (!subjectMap.has(subjName)) {
      subjectMap.set(subjName, {
        subject: subjName,
        totalQuestions: 0,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        netScore: 0,
        maxMarks: 0,
        accuracy: 0,
      });
    }

    if (!chapterMap.has(chapName)) {
      chapterMap.set(chapName, { subject: subjName, attempted: 0, correct: 0, incorrect: 0 });
    }

    const sEntry = subjectMap.get(subjName)!;
    const cEntry = chapterMap.get(chapName)!;

    const qMarks = q.marks ?? defaultPosMarks;
    const qNeg = q.negativeMarks ?? defaultNegMarks;
    sEntry.totalQuestions++;
    sEntry.maxMarks += qMarks;

    const studentAnswer = selectedAnswers[q.id];
    const keyInfo = keyMap.get(q.id);
    const correctOpt = (keyInfo?.correctOption ?? 'a').toLowerCase().trim();

    if (!studentAnswer) {
      sEntry.unattempted++;
      return;
    }

    sEntry.attempted++;
    cEntry.attempted++;

    const isCorrect = studentAnswer.toLowerCase().trim() === correctOpt;
    if (isCorrect) {
      sEntry.correct++;
      sEntry.netScore += qMarks;
      cEntry.correct++;
    } else {
      sEntry.incorrect++;
      sEntry.netScore -= qNeg;
      cEntry.incorrect++;
    }
  });

  // Calculate percentage and accuracies
  const subjects: SubjectPerformance[] = Array.from(subjectMap.values()).map((s) => ({
    ...s,
    netScore: Math.round(s.netScore * 100) / 100,
    accuracy: s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0,
  }));

  const chapters: ChapterPerformance[] = Array.from(chapterMap.entries()).map(([chap, data]) => {
    const acc = data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0;
    const status: 'strong' | 'average' | 'weak' =
      acc >= 75 ? 'strong' : acc >= 50 ? 'average' : 'weak';
    return {
      chapter: chap,
      subject: data.subject,
      attempted: data.attempted,
      correct: data.correct,
      incorrect: data.incorrect,
      accuracy: acc,
      status,
    };
  });

  return { subjects, chapters };
}

/** Identify weak topics and concrete revision advice */
export function identifyWeakTopicsAndRecommendations(
  chapters: ChapterPerformance[]
): { weakTopics: string[]; recommendations: string[] } {
  const weak = chapters.filter((c) => c.status === 'weak' && c.attempted >= 1);
  const weakTopics = weak.map((w) => `${w.chapter} (${w.subject})`);

  const recommendations: string[] = [];
  if (weak.length === 0) {
    recommendations.push('Excellent concept retention across all chapters! Continue full-length mock stamina drills.');
  } else {
    weak.slice(0, 4).forEach((w) => {
      recommendations.push(`Revise fundamental theory and numerical formula sheets for ${w.chapter} in ${w.subject}.`);
    });
    recommendations.push('Practice targeted 15-question chapter drills before attempting another full 200-Q mock.');
  }

  return { weakTopics, recommendations };
}

export interface ActiveExamSession {
  selectedExam: { id: string; duration: number; [key: string]: any };
  questions: any[];
  answers: Record<string, string>;
  markedForReview: string[];
  visitedQuestions: string[];
  attemptId: string | null;
  currentIdx: number;
  targetEndTime: number;
}

export interface TimerRecoveryResult {
  canRecover: boolean;
  isExpired: boolean;
  remainingSeconds: number;
  session: ActiveExamSession | null;
  reason: 'valid' | 'expired' | 'corrupted' | 'no_session';
}

/**
 * Pure helper to test and recover exam timer state safely
 * Guarantees no negative time, no resets, and triggers auto-submit when expired
 */
export function calculateTimerRecovery(
  rawSavedSession: string | null,
  nowMs: number = Date.now()
): TimerRecoveryResult {
  if (!rawSavedSession) {
    return { canRecover: false, isExpired: false, remainingSeconds: 0, session: null, reason: 'no_session' };
  }

  try {
    const session: ActiveExamSession = JSON.parse(rawSavedSession);
    if (!session || !session.selectedExam || !Array.isArray(session.questions) || session.questions.length === 0) {
      return { canRecover: false, isExpired: false, remainingSeconds: 0, session: null, reason: 'corrupted' };
    }

    const remaining = Math.floor((session.targetEndTime - nowMs) / 1000);

    if (remaining <= 0) {
      return { canRecover: false, isExpired: true, remainingSeconds: 0, session, reason: 'expired' };
    }

    return { canRecover: true, isExpired: false, remainingSeconds: remaining, session, reason: 'valid' };
  } catch {
    return { canRecover: false, isExpired: false, remainingSeconds: 0, session: null, reason: 'corrupted' };
  }
}

export interface SubmissionSecurityCheck {
  allowed: boolean;
  isDuplicate: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Validates candidate ownership and idempotency against duplicate submissions
 */
export function validateSubmissionSecurity(
  existingAttempt: { id: string; student_id?: string | null; completed_at?: string | null } | null,
  currentUserId: string | null
): SubmissionSecurityCheck {
  if (!existingAttempt) {
    return { allowed: true, isDuplicate: false };
  }

  // Result Privacy Guard: prevent candidate A from submitting or updating candidate B's attempt
  if (existingAttempt.student_id && currentUserId && existingAttempt.student_id !== currentUserId) {
    return {
      allowed: false,
      isDuplicate: false,
      error: 'Unauthorized: You cannot access or submit another candidate\'s examination attempt.',
      statusCode: 403,
    };
  }

  // Duplicate Submission Guard: prevent double-scoring completed attempts
  if (existingAttempt.completed_at) {
    return {
      allowed: false,
      isDuplicate: true,
      error: 'This examination attempt was already finalized and scored.',
      statusCode: 200, // Idempotent OK
    };
  }

  return { allowed: true, isDuplicate: false };
}

/**
 * Result Privacy filter: ensures answer keys, solutions, and explanations
 * are NEVER leaked to the client during active examination (only upon final grading)
 */
export function sanitizeQuestionsForActiveExam<T extends { explanation?: string | null; correct_option?: string }>(
  questions: T[]
): Omit<T, 'explanation' | 'correct_option'>[] {
  return questions.map(({ explanation, correct_option, ...safeQ }) => safeQ);
}

export type ScheduledStatus = 'upcoming' | 'live' | 'closed' | 'open_anytime';

export interface ScheduledExamCheck {
  status: ScheduledStatus;
  canStart: boolean;
  message: string;
  startsInSeconds?: number;
}

/**
 * Checks scheduled test access window
 */
export function evaluateScheduledStatus(
  scheduledStartIso?: string,
  scheduledEndIso?: string,
  nowMs: number = Date.now()
): ScheduledExamCheck {
  if (!scheduledStartIso) {
    return { status: 'open_anytime', canStart: true, message: 'Available anytime for student practice' };
  }

  const startMs = new Date(scheduledStartIso).getTime();
  const endMs = scheduledEndIso ? new Date(scheduledEndIso).getTime() : startMs + 4 * 3600 * 1000;

  if (nowMs < startMs) {
    const diffSec = Math.ceil((startMs - nowMs) / 1000);
    return {
      status: 'upcoming',
      canStart: false,
      message: `Exam scheduled to go live at ${new Date(scheduledStartIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      startsInSeconds: diffSec,
    };
  }

  if (nowMs > endMs) {
    return {
      status: 'closed',
      canStart: false,
      message: 'The synchronized examination window has concluded.',
    };
  }

  return {
    status: 'live',
    canStart: true,
    message: 'Examination is live! Submit before the window closes.',
  };
}

export interface SubjectiveRubricCriterion {
  criterion: string;
  score: number;
  maxMarks: number;
  feedback: string;
}

export interface SubjectiveEvaluationItem {
  id: string;
  questionId: string;
  studentId: string;
  studentName?: string;
  subject: string;
  questionText: string;
  sampleSolution: string;
  studentAnswerText?: string;
  studentImageUrl?: string;
  totalMarks: number;
  aiDraftScore: number;
  aiDraftFeedback: string;
  aiRubricBreakdown: SubjectiveRubricCriterion[];
  teacherScore?: number;
  teacherFeedback?: string;
  status: 'pending_review' | 'teacher_reviewed' | 'published';
  isAiDraft: boolean;
  publishedAt?: string;
  createdAt: string;
}

/**
 * Pure state machine transition for SEE Subjective Evaluation
 */
export function transitionSubjectiveEvaluation(
  current: SubjectiveEvaluationItem,
  action: {
    teacherScore?: number;
    teacherFeedback?: string;
    rubricBreakdown?: SubjectiveRubricCriterion[];
    publish?: boolean;
  },
  nowIso: string = new Date().toISOString()
): SubjectiveEvaluationItem {
  const updated = { ...current };

  if (action.rubricBreakdown) {
    updated.aiRubricBreakdown = action.rubricBreakdown;
  }

  const sumRubric = updated.aiRubricBreakdown.reduce((sum, r) => sum + r.score, 0);
  updated.teacherScore = action.teacherScore !== undefined ? action.teacherScore : Math.round(sumRubric * 10) / 10;
  updated.teacherFeedback = action.teacherFeedback !== undefined ? action.teacherFeedback : (current.teacherFeedback || current.aiDraftFeedback);

  if (action.publish) {
    updated.status = 'published';
    updated.isAiDraft = false; // Official board evaluation
    updated.publishedAt = nowIso;
  } else {
    updated.status = 'teacher_reviewed';
    updated.isAiDraft = false;
  }

  return updated;
}

