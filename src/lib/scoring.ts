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
  return question[key] ?? letter.toUpperCase();
}

/** Percentage correct, rounded, guarding divide-by-zero. */
export function computeAccuracy(correct: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

/** Longest run of consecutive `true` (correct) values in order. */
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

/**
 * Standard ELO expected score for player A against player B.
 * Mirrors the formula used server-side in submit_battle_result().
 */
export function expectedEloScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Symmetric ELO delta for player A. `scoreA` is 1 (win), 0.5 (draw), 0 (loss).
 * K defaults to 32, matching the server settlement logic.
 */
export function eloDelta(ratingA: number, ratingB: number, scoreA: number, k = 32): number {
  return Math.round(k * (scoreA - expectedEloScore(ratingA, ratingB)));
}
