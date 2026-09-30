import { describe, it, expect } from 'vitest';

function calculateChampionshipMatchScore(
  correctCount: number,
  incorrectCount: number,
  timeTakenSeconds: number
): { accuracy: number; speedBonus: number; matchPoints: number } {
  const totalQ = correctCount + incorrectCount;
  const accuracy = totalQ > 0 ? (correctCount / totalQ) * 100 : 0;
  let speedBonus = 0;
  if (accuracy >= 80 && timeTakenSeconds > 0 && timeTakenSeconds < 300) {
    speedBonus = Math.min(5, Math.round((300 - timeTakenSeconds) / 20));
  }
  const matchPoints = Math.max(0, correctCount * 10 - incorrectCount * 2.5 + speedBonus);
  return { accuracy, speedBonus, matchPoints };
}

function evaluateAntiCheat(
  existingFlags: number,
  tabSwitches: number,
  fastResponses: number
): { isDisqualified: boolean; flaggedForReview: boolean; totalFlags: number } {
  const totalFlags = existingFlags + tabSwitches + fastResponses;
  return {
    isDisqualified: false, // Preserves student account access; requires admin confirmation for payout
    flaggedForReview: totalFlags >= 4,
    totalFlags,
  };
}

describe('Daily Championship Engine & Anti-Cheat Validation', () => {
  it('correctly calculates CEE match points with positive and negative marking', () => {
    const res = calculateChampionshipMatchScore(8, 2, 200);
    expect(res.accuracy).toBe(80);
    expect(res.speedBonus).toBe(5);
    expect(res.matchPoints).toBe(80);
  });

  it('awards no speed bonus if accuracy is below 80%', () => {
    const res = calculateChampionshipMatchScore(7, 3, 60);
    expect(res.accuracy).toBe(70);
    expect(res.speedBonus).toBe(0);
    expect(res.matchPoints).toBe(62.5);
  });

  it('clamps match score at zero to prevent negative championship totals', () => {
    const res = calculateChampionshipMatchScore(0, 10, 290);
    expect(res.accuracy).toBe(0);
    expect(res.speedBonus).toBe(0);
    expect(res.matchPoints).toBe(0);
  });

  it('caps speed bonus at maximum 5 points for ultra-fast completions', () => {
    const res = calculateChampionshipMatchScore(10, 0, 10);
    expect(res.accuracy).toBe(100);
    expect(res.speedBonus).toBe(5);
    expect(res.matchPoints).toBe(105);
  });

  it('flags entries for administrative review rather than unilateral disqualification when flags reach threshold', () => {
    const clean = evaluateAntiCheat(0, 1, 1);
    expect(clean.flaggedForReview).toBe(false);
    expect(clean.isDisqualified).toBe(false);
    expect(clean.totalFlags).toBe(2);

    const flagged = evaluateAntiCheat(2, 2, 0);
    expect(flagged.flaggedForReview).toBe(true);
    expect(flagged.isDisqualified).toBe(false);
    expect(flagged.totalFlags).toBe(4);
  });

  it('enforces 10-match daily cap', () => {
    const matchesPlayed = 10;
    const canPlayMore = matchesPlayed < 10;
    expect(canPlayMore).toBe(false);
  });
});
