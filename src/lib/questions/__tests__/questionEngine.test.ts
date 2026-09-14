import { describe, it, expect } from 'vitest';
import {
  calculateMarkingScore,
  calculateSessionMetrics,
  classifyPace,
  isAnswerCorrect,
  normalizeOptionKey,
  optionLetterToText
} from '../../scoring';
import { SEE_QUESTION_BANK } from '../../data/seeQuestionBankData';

describe('Question Engine & Scoring Suite', () => {
  describe('Option Key Normalization', () => {
    it('normalizes uppercase, lowercase, and spaced options', () => {
      expect(normalizeOptionKey('A')).toBe('a');
      expect(normalizeOptionKey('  b  ')).toBe('b');
      expect(normalizeOptionKey('C')).toBe('c');
      expect(normalizeOptionKey('d')).toBe('d');
      expect(normalizeOptionKey(null)).toBe('');
      expect(normalizeOptionKey(undefined)).toBe('');
    });

    it('correctly compares selected answer with correct option', () => {
      expect(isAnswerCorrect('B', 'b')).toBe(true);
      expect(isAnswerCorrect(' a ', 'A')).toBe(true);
      expect(isAnswerCorrect('c', 'd')).toBe(false);
      expect(isAnswerCorrect(null, 'a')).toBe(false);
      expect(isAnswerCorrect('a', undefined)).toBe(false);
    });
  });

  describe('CEE Negative Marking (-0.25) vs SEE Rules', () => {
    it('applies +1.0 for correct and -0.25 for incorrect in CEE mode', () => {
      const ceeConfig = { positiveMarks: 1.0, negativeMarks: 0.25, allowNegativeTotal: true };

      // 10 correct, 2 incorrect -> 10 * 1.0 - 2 * 0.25 = 9.5
      const score = calculateMarkingScore(10, 2, ceeConfig);
      expect(score).toBe(9.5);

      // 0 correct, 4 incorrect -> -1.0
      const negativeScore = calculateMarkingScore(0, 4, ceeConfig);
      expect(negativeScore).toBe(-1.0);
    });

    it('applies +marks for correct and 0 for incorrect in SEE mode without negative marks', () => {
      const seeConfig = { positiveMarks: 4.0, negativeMarks: 0, allowNegativeTotal: false };

      // 5 correct, 3 incorrect -> 5 * 4.0 - 0 = 20.0
      const score = calculateMarkingScore(5, 3, seeConfig);
      expect(score).toBe(20.0);

      // 0 correct, 5 incorrect -> 0
      const zeroScore = calculateMarkingScore(0, 5, seeConfig);
      expect(zeroScore).toBe(0);
    });
  });

  describe('Session Metrics Computation', () => {
    it('accurately computes CEE session with mixed answers, penalties, and accuracy', () => {
      const attempts = [
        { questionId: 'q1', selectedOption: 'a', correctOption: 'a', marks: 1, negativeMarks: 0.25 },
        { questionId: 'q2', selectedOption: 'b', correctOption: 'b', marks: 1, negativeMarks: 0.25 },
        { questionId: 'q3', selectedOption: 'c', correctOption: 'c', marks: 1, negativeMarks: 0.25 },
        { questionId: 'q4', selectedOption: 'a', correctOption: 'd', marks: 1, negativeMarks: 0.25 },
        { questionId: 'q5', selectedOption: null, correctOption: 'b', marks: 1, negativeMarks: 0.25 },
      ];

      const metrics = calculateSessionMetrics(
        attempts,
        { positiveMarks: 1.0, negativeMarks: 0.25, allowNegativeTotal: true },
        300
      );

      expect(metrics.totalQuestions).toBe(5);
      expect(metrics.attemptedCount).toBe(4);
      expect(metrics.correctCount).toBe(3);
      expect(metrics.incorrectCount).toBe(1);
      expect(metrics.unattemptedCount).toBe(1);
      expect(metrics.rawScore).toBe(2.75);
      expect(metrics.accuracy).toBe(75);
      expect(metrics.averagePaceSeconds).toBe(60);
    });

    it('classifies pace correctly for speed drills', () => {
      expect(classifyPace(30)).toBe('Speedy');
      expect(classifyPace(60)).toBe('Optimal');
      expect(classifyPace(100)).toBe('Caution');
    });
  });

  describe('Authoritative Question Bank Integration', () => {
    it('verifies that SEE_QUESTION_BANK contains valid multi-mark questions and rubrics', () => {
      expect(SEE_QUESTION_BANK.length).toBeGreaterThan(10);
      const sampleQuestion = SEE_QUESTION_BANK[0];
      expect(sampleQuestion).toHaveProperty('id');
      expect(sampleQuestion).toHaveProperty('question');
      expect(sampleQuestion).toHaveProperty('marks');
      expect(sampleQuestion).toHaveProperty('solution');
      expect(sampleQuestion.marks).toBeGreaterThanOrEqual(1);
    });

    it('maps option letters to text correctly for both option_x and array formats', () => {
      const objFormat = { option_a: 'Mitochondria', option_b: 'Ribosome' };
      expect(optionLetterToText(objFormat, 'a')).toBe('Mitochondria');
      expect(optionLetterToText(objFormat, 'b')).toBe('Ribosome');

      const arrayFormat = { options: ['Force', 'Pressure', 'Gravity'] };
      expect(optionLetterToText(arrayFormat, 'a')).toBe('Force');
      expect(optionLetterToText(arrayFormat, 'c')).toBe('Gravity');
    });
  });
});
