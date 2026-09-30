import { describe, it, expect } from 'vitest';
import { CEE_VERIFIED_PYQ_DATA } from '@/lib/data/ceePastPapersData';
import { SEE_QUESTION_BANK } from '@/lib/data/seeQuestionBankData';
import { sanitizeQuestionsForActiveExam } from '../examRegistry';

/**
 * Production Scoring Validation:
 * Simulates server-authoritative submission resolution.
 * Synthetic/fabricated questions are strictly rejected.
 */
function gradeSubmittedAnswer(
  questionId: string,
  selectedOption: string,
  dbQuestionsMap: Map<string, { correct_option: string; marks: number; negative_marks: number }>
): { valid: boolean; isCorrect: boolean; scoreDelta: number; error?: string } {
  // Reject unverified synthetic question IDs
  if (typeof questionId === 'string' && questionId.startsWith('synthetic-mock-q-')) {
    return {
      valid: false,
      isCorrect: false,
      scoreDelta: 0,
      error: 'Unverified or synthetic question ID rejected from official exam grading.',
    };
  }

  // Check in DB questions map
  const dbQ = dbQuestionsMap.get(questionId);
  if (dbQ) {
    const isCorrect = dbQ.correct_option.toLowerCase() === selectedOption.toLowerCase();
    const marks = dbQ.marks ?? 1.0;
    const negMarks = dbQ.negative_marks ?? 0.25;
    return {
      valid: true,
      isCorrect,
      scoreDelta: isCorrect ? marks : -negMarks,
    };
  }

  // Check in verified CEE PYQs
  const pyq = CEE_VERIFIED_PYQ_DATA.find((q) => q.id === questionId);
  if (pyq) {
    const isCorrect = pyq.correctOption.toLowerCase() === selectedOption.toLowerCase();
    return {
      valid: true,
      isCorrect,
      scoreDelta: isCorrect ? 1.0 : -0.25,
    };
  }

  // Check in SEE Question Bank
  const seeQ = SEE_QUESTION_BANK.find((q) => q.id === questionId);
  if (seeQ) {
    const isCorrect = seeQ.solution.toLowerCase().trim() === selectedOption.toLowerCase().trim();
    return {
      valid: true,
      isCorrect,
      scoreDelta: isCorrect ? 1.0 : 0.0, // SEE has zero negative marking
    };
  }

  // Unknown / client-fabricated ID
  return {
    valid: false,
    isCorrect: false,
    scoreDelta: 0,
    error: `Unknown question ID [${questionId}] rejected.`,
  };
}

describe('Examination Answer Integrity & Anti-Fabrication Suite', () => {
  it('strictly rejects synthetic question IDs (synthetic-mock-q-*) from official scoring', () => {
    const dbMap = new Map();
    const result1 = gradeSubmittedAnswer('synthetic-mock-q-cee-full-1', 'a', dbMap);
    expect(result1.valid).toBe(false);
    expect(result1.error).toContain('synthetic question ID rejected');

    const result2 = gradeSubmittedAnswer('synthetic-mock-q-cee-full-199', 'd', dbMap);
    expect(result2.valid).toBe(false);
    expect(result2.error).toContain('synthetic question ID rejected');
  });

  it('strictly rejects arbitrary client-fabricated question IDs not present in verified repos or DB', () => {
    const dbMap = new Map();
    const result = gradeSubmittedAnswer('fake-uuid-99999', 'b', dbMap);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unknown question ID');
  });

  it('correctly grades authentic CEE verified PYQ questions with server-side answers', () => {
    const dbMap = new Map();
    const samplePyq = CEE_VERIFIED_PYQ_DATA[0];
    expect(samplePyq).toBeDefined();

    // Correct answer
    const correctRes = gradeSubmittedAnswer(samplePyq.id, samplePyq.correctOption, dbMap);
    expect(correctRes.valid).toBe(true);
    expect(correctRes.isCorrect).toBe(true);
    expect(correctRes.scoreDelta).toBe(1.0);

    // Incorrect answer
    const wrongOpt = samplePyq.correctOption === 'a' ? 'b' : 'a';
    const wrongRes = gradeSubmittedAnswer(samplePyq.id, wrongOpt, dbMap);
    expect(wrongRes.valid).toBe(true);
    expect(wrongRes.isCorrect).toBe(false);
    expect(wrongRes.scoreDelta).toBe(-0.25);
  });

  it('correctly grades authentic SEE model questions with NEB zero negative marking', () => {
    const dbMap = new Map();
    const sampleSee = SEE_QUESTION_BANK[0];
    expect(sampleSee).toBeDefined();

    // Correct
    const correctRes = gradeSubmittedAnswer(sampleSee.id, sampleSee.solution, dbMap);
    expect(correctRes.valid).toBe(true);
    expect(correctRes.isCorrect).toBe(true);
    expect(correctRes.scoreDelta).toBe(1.0);

    // Wrong option should give 0 penalty in SEE
    const wrongOpt = 'incorrect-student-answer';
    const wrongRes = gradeSubmittedAnswer(sampleSee.id, wrongOpt, dbMap);
    expect(wrongRes.valid).toBe(true);
    expect(wrongRes.isCorrect).toBe(false);
    expect(wrongRes.scoreDelta).toBe(0.0);
  });

  it('verifies non-predictable answer distribution across verified PYQ dataset', () => {
    // Ensure that answers in CEE_VERIFIED_PYQ_DATA are genuinely distributed and not cyclic
    const answerCounts: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };
    CEE_VERIFIED_PYQ_DATA.forEach((q) => {
      const opt = q.correctOption.toLowerCase();
      if (answerCounts[opt] !== undefined) {
        answerCounts[opt]++;
      }
    });

    // Every option (a, b, c, d) should be represented legitimately
    expect(answerCounts.a).toBeGreaterThan(0);
    expect(answerCounts.b).toBeGreaterThan(0);
    expect(answerCounts.c).toBeGreaterThan(0);
    expect(answerCounts.d).toBeGreaterThan(0);

    // Verify answers do not follow cyclic i % 4 pattern
    let cyclicMatches = 0;
    const cyclicPattern = ['a', 'b', 'c', 'd'];
    CEE_VERIFIED_PYQ_DATA.forEach((q, idx) => {
      if (q.correctOption.toLowerCase() === cyclicPattern[idx % 4]) {
        cyclicMatches++;
      }
    });
    // Natural occurrence is around 25%, not 100%
    const cyclicRate = cyclicMatches / CEE_VERIFIED_PYQ_DATA.length;
    expect(cyclicRate).toBeLessThan(0.6); // Genuinely diverse distribution
  });

  it('strips correct_option and explanation from active exam questions before delivering to client', () => {
    const questionsWithKeys = [
      {
        id: 'q-101',
        question_text: 'What is the SI unit of magnetic flux?',
        option_a: 'Tesla',
        option_b: 'Weber',
        option_c: 'Henry',
        option_d: 'Gauss',
        correct_option: 'b',
        explanation: 'Weber (Wb) is the SI unit of magnetic flux.',
      },
      {
        id: 'q-102',
        question_text: 'Which organelle is known as the powerhouse of the cell?',
        option_a: 'Ribosome',
        option_b: 'Mitochondria',
        option_c: 'Golgi Apparatus',
        option_d: 'Lysosome',
        correct_option: 'b',
        explanation: 'Mitochondria generate most of the chemical energy needed to power the cell biochemical reactions.',
      },
    ];

    const sanitized = sanitizeQuestionsForActiveExam(questionsWithKeys);
    expect(sanitized).toHaveLength(2);

    sanitized.forEach((q: any) => {
      expect(q.correct_option).toBeUndefined();
      expect(q.correctOption).toBeUndefined();
      expect(q.explanation).toBeUndefined();
      expect(q.option_a).toBeDefined();
      expect(q.option_b).toBeDefined();
      expect(q.question_text).toBeDefined();
    });
  });
});
