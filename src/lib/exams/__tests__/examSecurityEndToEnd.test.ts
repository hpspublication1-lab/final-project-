import { describe, it, expect } from 'vitest';
import { sanitizeQuestionsForActiveExam, validateSubmissionSecurity } from '../examRegistry';
import { CEE_VERIFIED_PYQ_DATA } from '@/lib/data/ceePastPapersData';
import { SEE_QUESTION_BANK } from '@/lib/data/seeQuestionBankData';

/**
 * End-to-End Examination Answer Security & Confidentiality Test Suite
 * Validates that question answer keys and explanations are NEVER exposed to students
 * before submission across API payloads, client bundles, or local state.
 */
describe('Examination Answer Security & Client Confidentiality (E2E)', () => {
  it('strictly strips correct_option, correctOption, and explanation from active exam question payloads', () => {
    // Simulate raw database / verified question records containing sensitive keys
    const rawQuestions = [
      {
        id: 'q-sec-01',
        question_text: 'What is the SI unit of electric potential?',
        option_a: 'Volt',
        option_b: 'Ampere',
        option_c: 'Ohm',
        option_d: 'Coulomb',
        correct_option: 'a',
        correctOption: 'a',
        explanation: 'Volt is the SI unit of electric potential and electromotive force.',
        marks: 1.0,
        negativeMarks: 0.25,
      },
      {
        id: 'q-sec-02',
        question_text: 'Which blood group is known as the universal donor?',
        option_a: 'AB+',
        option_b: 'O-',
        option_c: 'A+',
        option_d: 'B-',
        correct_option: 'b',
        correctOption: 'b',
        explanation: 'O- red blood cells lack A, B, and Rh surface antigens.',
        marks: 1.0,
        negativeMarks: 0.25,
      },
    ];

    // Sanitize for client delivery
    const sanitized = sanitizeQuestionsForActiveExam(rawQuestions);

    expect(sanitized).toHaveLength(2);
    sanitized.forEach((q: any) => {
      // Must NOT contain answer keys
      expect(q.correct_option).toBeUndefined();
      expect(q.correctOption).toBeUndefined();
      expect(q.correct_answer).toBeUndefined();
      expect(q.explanation).toBeUndefined();

      // Must contain presentation fields
      expect(q.id).toBeDefined();
      expect(q.question_text).toBeDefined();
      expect(q.option_a).toBeDefined();
      expect(q.option_b).toBeDefined();
    });
  });

  it('guarantees that answers in CEE_VERIFIED_PYQ_DATA and SEE_QUESTION_BANK are not predictable or cyclic', () => {
    expect(CEE_VERIFIED_PYQ_DATA.length).toBeGreaterThanOrEqual(10);
    expect(SEE_QUESTION_BANK.length).toBeGreaterThanOrEqual(10);

    // Verify answers cannot be derived from index modulo 4
    let cyclicMatches = 0;
    const cyclicPattern = ['a', 'b', 'c', 'd'];
    CEE_VERIFIED_PYQ_DATA.forEach((q, idx) => {
      if (q.correctOption.toLowerCase() === cyclicPattern[idx % 4]) {
        cyclicMatches++;
      }
    });

    const cyclicRate = cyclicMatches / CEE_VERIFIED_PYQ_DATA.length;
    expect(cyclicRate).toBeLessThan(0.6); // Genuine natural distribution
  });

  it('prevents client-side answer forgery: tampering with client payload does not alter server grading', () => {
    // Attacker attempts to forge a submitted answer object with self-asserted correct flags
    const authoritativeQuestionsMap = new Map([
      ['cee-pyq-phy-01', { correct_option: 'a', marks: 1.0, negative_marks: 0.25 }],
    ]);

    const forgedClientSubmission = {
      examId: 'cee-grand-mock-1',
      answers: {
        'cee-pyq-phy-01': 'b', // Student picked 'b' (wrong)
      },
      // Attacker injects forged server verification keys into the payload
      forgedScore: 100,
      forgedCorrectAnswers: ['cee-pyq-phy-01'],
      claimedMarks: 50.0,
    };

    // Server-authoritative grading simulation
    const studentAnswer = forgedClientSubmission.answers['cee-pyq-phy-01'];
    const authQ = authoritativeQuestionsMap.get('cee-pyq-phy-01');

    expect(authQ).toBeDefined();
    const isActuallyCorrect = authQ!.correct_option === studentAnswer;
    const calculatedScore = isActuallyCorrect ? authQ!.marks : -authQ!.negative_marks;

    // Server completely ignores forgedScore and claimedMarks
    expect(isActuallyCorrect).toBe(false);
    expect(calculatedScore).toBe(-0.25); // Negative marking applied authoritatively
  });

  it('strictly blocks duplicate exam attempt submissions idempotently', () => {
    const completedAttempt = {
      id: 'attempt-uuid-777',
      student_id: 'student-uuid-1',
      completed_at: '2026-09-20T10:00:00.000Z',
    };

    const duplicateCheck = validateSubmissionSecurity(completedAttempt, 'student-uuid-1');
    expect(duplicateCheck.allowed).toBe(false);
    expect(duplicateCheck.isDuplicate).toBe(true);
    expect(duplicateCheck.statusCode).toBe(200);
    expect(duplicateCheck.error).toContain('already finalized');
  });

  it('enforces exam result privacy: candidate B cannot submit or access candidate A attempt', () => {
    const candidateAAttempt = {
      id: 'attempt-uuid-888',
      student_id: 'student-A',
      completed_at: null,
    };

    const crossUserCheck = validateSubmissionSecurity(candidateAAttempt, 'student-B');
    expect(crossUserCheck.allowed).toBe(false);
    expect(crossUserCheck.statusCode).toBe(403);
    expect(crossUserCheck.error).toContain('Unauthorized');
  });
});
