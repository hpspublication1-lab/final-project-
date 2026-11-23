import { describe, it, expect } from 'vitest';
import { bankQuestionsForLesson, FALLBACK_SUBJECT_COURSE } from '../fallbackBankScope';
import { FALLBACK_PRACTICE_QUESTIONS } from '../practiceQuestionsFallback';

describe('built-in question bank stays in its course', () => {
  it('every bank subject is assigned to exactly one course', () => {
    for (const q of FALLBACK_PRACTICE_QUESTIONS) expect(FALLBACK_SUBJECT_COURSE[q.subjectSlug]).toBeTruthy();
  });

  it('never gives another course or subject', () => {
    expect(bankQuestionsForLesson('ielts', 'English')).toEqual([]);
    expect(bankQuestionsForLesson('artificial_intelligence', 'Python')).toEqual([]);
    expect(bankQuestionsForLesson('see_class_10', 'Biology')).toEqual([]);
    expect(bankQuestionsForLesson('cee_medical', 'Compulsory Science')).toEqual([]);
    expect(bankQuestionsForLesson('see_class_10', 'nepali')).toEqual([]);
    expect(bankQuestionsForLesson(null, 'Biology')).toEqual([]);
  });

  it('SEE science lessons get only SEE science, not CEE physics or chemistry', () => {
    const qs = bankQuestionsForLesson('see_class_10', 'science');
    expect(qs.length).toBeGreaterThan(0);
    expect(new Set(qs.map((q) => q.subjectSlug))).toEqual(new Set(['compulsory_science']));
  });

  it('SEE route slugs resolve to their subjects', () => {
    expect(bankQuestionsForLesson('see_class_10', 'mathematics').every((q) => q.subjectSlug === 'compulsory_math')).toBe(true);
    expect(bankQuestionsForLesson('see_class_10', 'opt_math').every((q) => q.subjectSlug === 'optional_math')).toBe(true);
    expect(bankQuestionsForLesson('see_class_10', 'social').length).toBeGreaterThan(0);
  });

  it('CEE biology lesson gets CEE biology', () => {
    const qs = bankQuestionsForLesson('cee_medical', 'Biology');
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every((q) => q.subjectSlug === 'biology')).toBe(true);
  });
});
