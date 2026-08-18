import { describe, it, expect } from 'vitest';
import {
  optionLetterToText,
  computeAccuracy,
  longestCorrectStreak,
  expectedEloScore,
  eloDelta,
} from './scoring';

describe('optionLetterToText', () => {
  const q = { option_a: 'Mitochondria', option_b: 'Ribosome', option_c: 'Nucleus', option_d: 'Golgi' };

  it('maps a lowercase letter to its option text', () => {
    expect(optionLetterToText(q, 'a')).toBe('Mitochondria');
  });

  it('is case-insensitive', () => {
    expect(optionLetterToText(q, 'C')).toBe('Nucleus');
  });

  it('returns a dash for missing question or letter', () => {
    expect(optionLetterToText(null, 'a')).toBe('—');
    expect(optionLetterToText(q, null)).toBe('—');
  });

  it('falls back to the uppercased letter when the option is absent', () => {
    expect(optionLetterToText({}, 'b')).toBe('B');
  });
});

describe('computeAccuracy', () => {
  it('computes a rounded percentage', () => {
    expect(computeAccuracy(3, 4)).toBe(75);
    expect(computeAccuracy(1, 3)).toBe(33);
  });

  it('guards divide-by-zero', () => {
    expect(computeAccuracy(0, 0)).toBe(0);
    expect(computeAccuracy(5, 0)).toBe(0);
  });
});

describe('longestCorrectStreak', () => {
  it('finds the longest run of consecutive correct answers', () => {
    expect(longestCorrectStreak([true, true, false, true, true, true, false])).toBe(3);
  });

  it('handles all-correct and all-wrong', () => {
    expect(longestCorrectStreak([true, true, true])).toBe(3);
    expect(longestCorrectStreak([false, false])).toBe(0);
    expect(longestCorrectStreak([])).toBe(0);
  });
});

describe('ELO', () => {
  it('gives 0.5 expected score for equal ratings', () => {
    expect(expectedEloScore(1200, 1200)).toBeCloseTo(0.5, 5);
  });

  it('favors the higher-rated player', () => {
    expect(expectedEloScore(1400, 1200)).toBeGreaterThan(0.5);
  });

  it('produces a symmetric, zero-sum delta for equal ratings', () => {
    const winner = eloDelta(1200, 1200, 1);
    const loser = eloDelta(1200, 1200, 0);
    expect(winner).toBe(16); // K=32 * (1 - 0.5)
    expect(loser).toBe(-16);
    expect(winner + loser).toBe(0);
  });

  it('awards fewer points when a favorite beats an underdog', () => {
    const favoriteWins = eloDelta(1600, 1200, 1);
    const evenWin = eloDelta(1200, 1200, 1);
    expect(favoriteWins).toBeLessThan(evenWin);
    expect(favoriteWins).toBeGreaterThan(0);
  });
});
