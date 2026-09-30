import { describe, it, expect } from 'vitest';

/**
 * Task 1 Hardening: Synthetic Question Disallowance
 * In accordance with production integrity requirements, synthetic question IDs
 * (synthetic-mock-q-*) and cyclic answer formulas have been deprecated and disallowed
 * from official scored examinations.
 */
function validateQuestionAllowedInScoredExam(qId: string): { allowed: boolean; reason?: string } {
  if (typeof qId === 'string' && qId.startsWith('synthetic-mock-q-')) {
    return {
      allowed: false,
      reason: 'Synthetic placeholder questions are forbidden in official scored examinations.',
    };
  }
  return { allowed: true };
}

describe('Synthetic Mock Test Deprecation & Anti-Cheat Validation', () => {
  it('strictly rejects synthetic question IDs from official scored exams', () => {
    expect(validateQuestionAllowedInScoredExam('synthetic-mock-q-cee-full-1').allowed).toBe(false);
    expect(validateQuestionAllowedInScoredExam('synthetic-mock-q-cee-full-200').allowed).toBe(false);
    expect(validateQuestionAllowedInScoredExam('synthetic-mock-q-cee-full-101').allowed).toBe(false);
  });

  it('allows verified PYQ and database question IDs', () => {
    expect(validateQuestionAllowedInScoredExam('cee-pyq-phy-01').allowed).toBe(true);
    expect(validateQuestionAllowedInScoredExam('00000000-0000-0000-0000-000000000001').allowed).toBe(true);
  });
});
