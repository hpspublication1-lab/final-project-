/**
 * Official MEC (Medical Education Commission, Nepal) CEE blueprint,
 * scoring, and analysis helpers. Pure + framework-free so it can be
 * unit-tested and reused on both client and server.
 *
 * Source of truth for the exam structure the app should model. NOTE: the
 * legacy app used 4 subjects (biology / chemistry / physics / mental_agility)
 * with +4 / -1 marking. The OFFICIAL CEE is 200 MCQs, +1 correct, -0.25 wrong,
 * with Biology split into Botany + Zoology and a Mental Agility Test (MAT)
 * section. These constants encode the real thing.
 */

export type CeeSectionKey = 'physics' | 'chemistry' | 'botany' | 'zoology' | 'mat';

export interface CeeSection {
  key: CeeSectionKey;
  label: string;
  /** Number of MCQs in this section. */
  count: number;
  /** Maps to the app's subjects.name enum where applicable (Botany+Zoology → biology). */
  subjectSlug: 'physics' | 'chemistry' | 'biology' | 'mental_agility';
  emoji: string;
}

/** MEC CEE 200-MCQ blueprint. */
export const CEE_BLUEPRINT: readonly CeeSection[] = [
  { key: 'physics',   label: 'Physics',            count: 50, subjectSlug: 'physics',        emoji: '⚛️' },
  { key: 'chemistry', label: 'Chemistry',          count: 50, subjectSlug: 'chemistry',      emoji: '🧪' },
  { key: 'botany',    label: 'Botany',             count: 40, subjectSlug: 'biology',        emoji: '🌿' },
  { key: 'zoology',   label: 'Zoology',            count: 40, subjectSlug: 'biology',        emoji: '🦁' },
  { key: 'mat',       label: 'Mental Agility Test', count: 20, subjectSlug: 'mental_agility', emoji: '🧠' },
] as const;

export const CEE_TOTAL_QUESTIONS = 200;      // sum of section counts
export const CEE_DURATION_MINUTES = 180;     // MEC allots 3 hours for 200 MCQs
export const CEE_MARK_CORRECT = 1.0;
export const CEE_MARK_WRONG = -0.25;         // negative marking
export const CEE_OPTIONS = 4;

/** Runtime assertion helper — the blueprint must always sum to 200. */
export function blueprintTotal(): number {
  return CEE_BLUEPRINT.reduce((sum, s) => sum + s.count, 0);
}

export interface ScoreInput {
  correct: number;
  incorrect: number;
  /** Optional — defaults to CEE_TOTAL_QUESTIONS. */
  total?: number;
}

export interface ScoreResult {
  score: number;             // raw CEE score (can be negative)
  maxScore: number;          // total * CEE_MARK_CORRECT
  attempted: number;
  unattempted: number;
  accuracy: number;          // % correct of ATTEMPTED (0..100)
  percentile01: number;      // score / maxScore, clamped 0..1
}

/**
 * Official CEE score = correct×1.0 − incorrect×0.25.
 */
export function scoreCee({ correct, incorrect, total = CEE_TOTAL_QUESTIONS }: ScoreInput): ScoreResult {
  const attempted = correct + incorrect;
  const score = correct * CEE_MARK_CORRECT + incorrect * CEE_MARK_WRONG;
  const maxScore = total * CEE_MARK_CORRECT;
  return {
    score: Math.round(score * 100) / 100,
    maxScore,
    attempted,
    unattempted: Math.max(0, total - attempted),
    accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
    percentile01: maxScore > 0 ? Math.max(0, Math.min(1, score / maxScore)) : 0,
  };
}

/**
 * Break-even accuracy for negative marking: the minimum fraction of
 * ATTEMPTED questions a student must get right for attempting to be
 * expected-value-positive. With +1 / -0.25 this is 0.20 (20%).
 */
export const CEE_BREAKEVEN_ACCURACY = CEE_OPTIONS > 1
  ? -CEE_MARK_WRONG / (CEE_MARK_CORRECT - CEE_MARK_WRONG)
  : 0; // = 0.25 / 1.25 = 0.20

/**
 * Guesswork Penalty Index (GPI): how much a student's wrong answers cost
 * them, and whether their attempting behaviour helped or hurt.
 *
 * - marksLostToWrong: total marks surrendered to negative marking.
 * - netFromAttempts: marks gained/lost purely from choosing to attempt
 *   (vs. leaving those questions blank).
 * - gpi: marksLostToWrong / attempted, i.e. average penalty per attempt
 *   (0 = never wrong, up to 0.25 = always wrong). Lower is better.
 * - verdict: guidance based on accuracy vs. the break-even threshold.
 */
export interface GpiResult {
  attempted: number;
  marksLostToWrong: number;
  netFromAttempts: number;
  gpi: number;
  breakevenAccuracy: number;
  verdict: 'disciplined' | 'balanced' | 'over-guessing';
}

export function guessworkPenaltyIndex({ correct, incorrect }: { correct: number; incorrect: number }): GpiResult {
  const attempted = correct + incorrect;
  const marksLostToWrong = Math.abs(incorrect * CEE_MARK_WRONG);
  const netFromAttempts = correct * CEE_MARK_CORRECT + incorrect * CEE_MARK_WRONG;
  const accuracy = attempted > 0 ? correct / attempted : 0;
  const gpi = attempted > 0 ? Math.round((marksLostToWrong / attempted) * 1000) / 1000 : 0;

  let verdict: GpiResult['verdict'];
  if (accuracy >= 0.5) verdict = 'disciplined';
  else if (accuracy >= CEE_BREAKEVEN_ACCURACY) verdict = 'balanced';
  else verdict = 'over-guessing';

  return {
    attempted,
    marksLostToWrong: Math.round(marksLostToWrong * 100) / 100,
    netFromAttempts: Math.round(netFromAttempts * 100) / 100,
    gpi,
    breakevenAccuracy: Math.round(CEE_BREAKEVEN_ACCURACY * 100) / 100,
    verdict,
  };
}

/**
 * Build a full-length CEE section plan (how many questions to pull per
 * app subject) from the blueprint — useful when assembling a mock test.
 */
export function ceeSubjectQuota(): Record<string, number> {
  const quota: Record<string, number> = {};
  for (const s of CEE_BLUEPRINT) {
    quota[s.subjectSlug] = (quota[s.subjectSlug] ?? 0) + s.count;
  }
  return quota; // { physics:50, chemistry:50, biology:80, mental_agility:20 }
}
