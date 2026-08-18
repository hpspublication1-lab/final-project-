/**
 * SuperMemo SM-2 spaced-repetition algorithm — pure implementation.
 *
 * Reference (Wozniak, 1990):
 *   EF' = EF + (0.1 - (5 - q)(0.08 + (5 - q)·0.02)),  floored at 1.3
 *   q >= 3 (recalled):  n=0 → I=1, n=1 → I=6, else I=round(I·EF); n++
 *   q <  3 (lapsed):    n=0, I=1  (EF is still updated by the formula)
 *
 * Field names mirror the flashcard_reviews table so the DB row can be
 * passed straight in and the result written straight back.
 */

export interface Sm2State {
  /** SM-2 E-Factor. Starts at 2.5, never drops below 1.3. */
  easeFactor: number;
  /** Days until the next review. */
  intervalDays: number;
  /** Consecutive successful repetitions. */
  repetitions: number;
}

export interface Sm2Result extends Sm2State {
  /** ISO timestamp for the next due date. */
  dueAt: string;
  /** The quality grade that produced this state (0..5). */
  lastGrade: number;
}

/** Quality grade: 0 = blackout … 5 = perfect recall. */
export type Sm2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export const SM2_MIN_EASE_FACTOR = 1.3;
export const SM2_DEFAULT_EASE_FACTOR = 2.5;

export function initialSm2State(): Sm2State {
  return { easeFactor: SM2_DEFAULT_EASE_FACTOR, intervalDays: 0, repetitions: 0 };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clampQuality(q: number): number {
  if (Number.isNaN(q)) return 0;
  return Math.max(0, Math.min(5, Math.round(q)));
}

/**
 * Apply one SM-2 review. Returns the next scheduling state + due date.
 * `now` is injectable for deterministic tests.
 */
export function reviewCard(prev: Sm2State, quality: number, now: Date = new Date()): Sm2Result {
  const q = clampQuality(quality);

  let { easeFactor, intervalDays, repetitions } = prev;

  if (q >= 3) {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  // E-Factor is recalculated on every review (both recall and lapse).
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < SM2_MIN_EASE_FACTOR) easeFactor = SM2_MIN_EASE_FACTOR;
  easeFactor = round2(easeFactor);

  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString();

  return { easeFactor, intervalDays, repetitions, dueAt, lastGrade: q };
}

/** Map a flashcard_reviews DB row (snake_case) into an Sm2State. */
export function sm2StateFromRow(row: { ease_factor?: number; interval_days?: number; repetitions?: number } | null | undefined): Sm2State {
  if (!row) return initialSm2State();
  return {
    easeFactor: row.ease_factor ?? SM2_DEFAULT_EASE_FACTOR,
    intervalDays: row.interval_days ?? 0,
    repetitions: row.repetitions ?? 0,
  };
}
