/**
 * Pure, framework-free scoring helpers shared across the app and covered by
 * unit tests (src/lib/scoring.test.ts). Keeping these side-effect-free makes
 * the battle/practice math verifiable without a running database or browser.
 */

/** Map an MCQ option letter (a/b/c/d, any case) to its text on a question row. */
export function optionLetterToText(
  question: Record<string, any> | null | undefined,
  letter: string | null | undefined
): string {
  if (!question || !letter) return '—';
  const key = `option_${letter.toLowerCase()}`;
  if (question[key]) return question[key];

  // If question has options array
  if (Array.isArray(question.options)) {
    const idx = letter.toLowerCase().charCodeAt(0) - 97;
    if (idx >= 0 && idx < question.options.length) {
      const opt = question.options[idx];
      return typeof opt === 'object' && opt !== null ? (opt.text || opt.title || String(opt)) : String(opt);
    }
  }

  return letter.toUpperCase();
}

/** Normalize an option identifier to lowercase single character ('a' | 'b' | 'c' | 'd') or clean string. */
export function normalizeOptionKey(opt: string | null | undefined): string {
  if (!opt) return '';
  const s = opt.trim().toLowerCase();
  const match = s.match(/^[a-d]$/);
  return match ? match[0] : s;
}

/** Determine if a selected option matches the correct answer. */
export function isAnswerCorrect(
  selected: string | null | undefined,
  correct: string | null | undefined
): boolean {
  if (!selected || !correct) return false;
  const sNorm = normalizeOptionKey(selected);
  const cNorm = normalizeOptionKey(correct);
  return sNorm === cNorm;
}

/** Percentage correct, rounded, guarding divide-by-zero. */
export function computeAccuracy(correct: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

/** Longest run of consecutive true (correct) values in order. */
export function longestCorrectStreak(results: boolean[]): number {
  let best = 0;
  let run = 0;
  for (const ok of results) {
    if (ok) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

export interface SessionScoreOptions {
  positiveMarks?: number;
  negativeMarks?: number;
  allowNegativeTotal?: boolean;
}

/**
 * Calculate raw score according to marking scheme:
 * - CEE Medical: +1.0 for correct, -0.25 for incorrect, 0 for unattempted
 * - SEE Class 10: +1.0 (or question marks) for correct, 0 for incorrect
 */
export function calculateMarkingScore(
  correctCount: number,
  incorrectCount: number,
  options: SessionScoreOptions = {}
): number {
  const pos = options.positiveMarks ?? 1.0;
  const neg = options.negativeMarks ?? 0.25;
  const allowNeg = options.allowNegativeTotal ?? true;

  const raw = correctCount * pos - incorrectCount * neg;
  const rounded = Math.round(raw * 100) / 100;
  return allowNeg ? rounded : Math.max(0, rounded);
}

export interface QuestionAttemptInput {
  questionId: string;
  selectedOption?: string | null;
  correctOption?: string | null;
  marks?: number;
  negativeMarks?: number;
  timeSpentSeconds?: number;
}

export interface EvaluatedSessionResult {
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  rawScore: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  totalTimeSeconds: number;
  averagePaceSeconds: number;
  streak: number;
}

/**
 * Comprehensive session scoring computation.
 */
export function calculateSessionMetrics(
  attempts: QuestionAttemptInput[],
  options: SessionScoreOptions = {},
  totalSessionTimeSec = 0
): EvaluatedSessionResult {
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let rawScore = 0;
  let totalMarks = 0;
  const correctnessList: boolean[] = [];

  const defaultPos = options.positiveMarks ?? 1.0;
  const defaultNeg = options.negativeMarks ?? 0.25;

  for (const att of attempts) {
    const qMarks = att.marks ?? defaultPos;
    const qNeg = att.negativeMarks ?? defaultNeg;
    totalMarks += qMarks;

    const hasAnswered = Boolean(att.selectedOption && att.selectedOption.trim() !== '');
    if (!hasAnswered) {
      unattemptedCount++;
      correctnessList.push(false);
      continue;
    }

    const isCorrect = isAnswerCorrect(att.selectedOption, att.correctOption);
    correctnessList.push(isCorrect);

    if (isCorrect) {
      correctCount++;
      rawScore += qMarks;
    } else {
      incorrectCount++;
      rawScore -= qNeg;
    }
  }

  const attemptedCount = correctCount + incorrectCount;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const percentage = totalMarks > 0 ? Math.max(0, Math.round((rawScore / totalMarks) * 100)) : 0;
  const roundedScore = Math.round(rawScore * 100) / 100;
  const finalScore = options.allowNegativeTotal === false ? Math.max(0, roundedScore) : roundedScore;
  const streak = longestCorrectStreak(correctnessList);
  const averagePaceSeconds = attempts.length > 0 ? Math.round(totalSessionTimeSec / attempts.length) : 0;

  return {
    totalQuestions: attempts.length,
    attemptedCount,
    correctCount,
    incorrectCount,
    unattemptedCount,
    rawScore: finalScore,
    totalMarks,
    percentage,
    accuracy,
    totalTimeSeconds: totalSessionTimeSec,
    averagePaceSeconds,
    streak,
  };
}

/**
 * Classify time spent per question relative to exam target (e.g. 54 seconds for CEE, 60 seconds for general).
 */
export function classifyPace(
  secondsPerQuestion: number,
  targetSeconds = 60
): 'Speedy' | 'Optimal' | 'Caution' {
  if (secondsPerQuestion < targetSeconds * 0.6) return 'Speedy';
  if (secondsPerQuestion <= targetSeconds * 1.2) return 'Optimal';
  return 'Caution';
}

/**
 * Standard ELO expected score for player A against player B.
 * Mirrors the formula used server-side in submit_battle_result().
 */
export function expectedEloScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Symmetric ELO delta for player A. scoreA is 1 (win), 0.5 (draw), 0 (loss).
 * K defaults to 32, matching the server settlement logic.
 */
export function eloDelta(ratingA: number, ratingB: number, scoreA: number, k = 32): number {
  return Math.round(k * (scoreA - expectedEloScore(ratingA, ratingB)));
}
