import { describe, it, expect } from 'vitest';
import {
  optionLetterToText,
  normalizeOptionKey,
  isAnswerCorrect,
  computeAccuracy,
  longestCorrectStreak,
  calculateMarkingScore,
  calculateSessionMetrics,
  classifyPace,
  expectedEloScore,
  eloDelta,
} from './scoring';

describe('optionLetterToText', () => {
  const qWithKeys = { option_a: 'Mitochondria', option_b: 'Ribosome', option_c: 'Nucleus', option_d: 'Golgi' };
  const qWithArray = { options: ['Mitochondria', 'Ribosome', 'Nucleus', 'Golgi'] };

  it('maps a lowercase letter to its option text with option_a..d', () => {
    expect(optionLetterToText(qWithKeys, 'a')).toBe('Mitochondria');
  });

  it('maps a letter to its option text with options array', () => {
    expect(optionLetterToText(qWithArray, 'b')).toBe('Ribosome');
    expect(optionLetterToText(qWithArray, 'D')).toBe('Golgi');
  });

  it('is case-insensitive', () => {
    expect(optionLetterToText(qWithKeys, 'C')).toBe('Nucleus');
  });

  it('returns a dash for missing question or letter', () => {
    expect(optionLetterToText(null, 'a')).toBe('—');
    expect(optionLetterToText(qWithKeys, null)).toBe('—');
  });

  it('falls back to the uppercased letter when the option is absent', () => {
    expect(optionLetterToText({}, 'b')).toBe('B');
  });
});

describe('normalizeOptionKey & isAnswerCorrect', () => {
  it('normalizes single letters', () => {
    expect(normalizeOptionKey('A')).toBe('a');
    expect(normalizeOptionKey(' b ')).toBe('b');
  });

  it('evaluates answers correctly regardless of case and spacing', () => {
    expect(isAnswerCorrect('A', 'a')).toBe(true);
    expect(isAnswerCorrect('B', 'b')).toBe(true);
    expect(isAnswerCorrect('C', 'B')).toBe(false);
    expect(isAnswerCorrect(null, 'A')).toBe(false);
    expect(isAnswerCorrect('A', null)).toBe(false);
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

describe('calculateMarkingScore (CEE & SEE)', () => {
  it('computes CEE negative marking (+1 for correct, -0.25 for incorrect)', () => {
    // 8 correct, 2 incorrect: 8*1 - 2*0.25 = 7.5
    expect(calculateMarkingScore(8, 2, { positiveMarks: 1, negativeMarks: 0.25 })).toBe(7.5);
    // 0 correct, 4 incorrect: 0 - 1.0 = -1.0
    expect(calculateMarkingScore(0, 4, { positiveMarks: 1, negativeMarks: 0.25, allowNegativeTotal: true })).toBe(-1.0);
    // Clamped at 0 if allowNegativeTotal is false
    expect(calculateMarkingScore(0, 4, { positiveMarks: 1, negativeMarks: 0.25, allowNegativeTotal: false })).toBe(0);
  });

  it('computes SEE marking without negative marks (negativeMarks = 0)', () => {
    expect(calculateMarkingScore(10, 5, { positiveMarks: 1, negativeMarks: 0 })).toBe(10);
    expect(calculateMarkingScore(4, 1, { positiveMarks: 4, negativeMarks: 0 })).toBe(16);
  });
});

describe('calculateSessionMetrics', () => {
  it('evaluates a full CEE practice session accurately', () => {
    const attempts = [
      { questionId: 'q1', selectedOption: 'a', correctOption: 'a' }, // Correct (+1)
      { questionId: 'q2', selectedOption: 'b', correctOption: 'a' }, // Incorrect (-0.25)
      { questionId: 'q3', selectedOption: 'c', correctOption: 'c' }, // Correct (+1)
      { questionId: 'q4', selectedOption: null, correctOption: 'd' }, // Unattempted (0)
    ];

    const res = calculateSessionMetrics(attempts, { positiveMarks: 1, negativeMarks: 0.25 }, 120);

    expect(res.totalQuestions).toBe(4);
    expect(res.attemptedCount).toBe(3);
    expect(res.correctCount).toBe(2);
    expect(res.incorrectCount).toBe(1);
    expect(res.unattemptedCount).toBe(1);
    expect(res.rawScore).toBe(1.75); // 2 - 0.25 = 1.75
    expect(res.accuracy).toBe(67); // 2 / 3 = 67%
    expect(res.totalTimeSeconds).toBe(120);
    expect(res.averagePaceSeconds).toBe(30); // 120 / 4 = 30s per question
  });

  it('evaluates an SEE multi-mark session accurately', () => {
    const attempts = [
      { questionId: 'q1', selectedOption: 'a', correctOption: 'a', marks: 1, negativeMarks: 0 },
      { questionId: 'q2', selectedOption: 'b', correctOption: 'b', marks: 2, negativeMarks: 0 },
      { questionId: 'q3', selectedOption: 'c', correctOption: 'a', marks: 4, negativeMarks: 0 },
    ];

    const res = calculateSessionMetrics(attempts, { positiveMarks: 1, negativeMarks: 0 }, 180);

    expect(res.totalMarks).toBe(7);
    expect(res.correctCount).toBe(2);
    expect(res.incorrectCount).toBe(1);
    expect(res.rawScore).toBe(3); // 1 + 2 = 3 marks
    expect(res.percentage).toBe(43); // 3 / 7 = 43%
  });
});

describe('classifyPace', () => {
  it('classifies student pacing relative to target', () => {
    expect(classifyPace(20, 60)).toBe('Speedy');
    expect(classifyPace(55, 60)).toBe('Optimal');
    expect(classifyPace(95, 60)).toBe('Caution');
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
    expect(expectedEloScore(1000, 1200)).toBeLessThan(0.5);
  });

  it('computes positive delta for an underdog win', () => {
    const delta = eloDelta(1000, 1400, 1);
    expect(delta).toBeGreaterThan(16);
  });

  it('computes negative delta for a favorite loss', () => {
    const delta = eloDelta(1400, 1000, 0);
    expect(delta).toBeLessThan(-16);
  });

  it('produces near-zero delta for a draw between equals', () => {
    const delta = eloDelta(1200, 1200, 0.5);
    expect(Math.abs(delta)).toBeLessThanOrEqual(1);
  });
});
