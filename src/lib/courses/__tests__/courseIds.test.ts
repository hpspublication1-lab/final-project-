import { describe, it, expect } from 'vitest';
import { parseCourseId, programValuesFor, belongsToCourse, PROGRAM_VALUES } from '../courseIds';
import { CANONICAL_COURSES, normalizeCourseId } from '@/contexts/ProgramContext';

describe('course ids', () => {
  it('maps canonical ids and known aliases exactly', () => {
    expect(parseCourseId('cee')).toBe('cee_medical');
    expect(parseCourseId('CEE_MEDICAL')).toBe('cee_medical');
    expect(parseCourseId('see')).toBe('see_class_10');
    expect(parseCourseId('english')).toBe('ielts');
    expect(parseCourseId('loksewa')).toBe('lok_sewa');
  });

  it('never turns an unknown, empty or ambiguous value into CEE', () => {
    for (const v of [null, undefined, '', '  ', 'pte', 'pte-academic', 'neb', 'cee-crash', 'digital', 'medical']) {
      expect(parseCourseId(v as string)).toBeNull();
    }
    // The UI helper still defaults to CEE — which is exactly why data filters must not use it.
    expect(normalizeCourseId('pte-academic')).toBe('ielts');
    expect(normalizeCourseId('something-new')).toBe('cee_medical');
  });

  it('does not match on substrings', () => {
    expect(parseCourseId('see_class_10_extra')).toBeNull();
    expect(parseCourseId('main')).toBeNull(); // contains "ai"
  });

  it('covers every canonical course, and no stored value belongs to two courses', () => {
    expect(Object.keys(PROGRAM_VALUES).sort()).toEqual([...CANONICAL_COURSES].sort());
    const seen = new Map<string, string>();
    for (const [course, values] of Object.entries(PROGRAM_VALUES)) {
      for (const v of values) {
        expect(seen.has(v), `${v} is claimed by ${seen.get(v)} and ${course}`).toBe(false);
        seen.set(v, course);
      }
    }
  });

  it('isolates courses from each other', () => {
    expect(belongsToCourse('cee', 'cee_medical')).toBe(true);
    expect(belongsToCourse('ielts', 'cee_medical')).toBe(false);
    expect(belongsToCourse('cee', 'ioe_engineering')).toBe(false);
    expect(belongsToCourse('loksewa', 'ioe_engineering')).toBe(false);
    expect(belongsToCourse(null, 'cee_medical')).toBe(false);
    expect(belongsToCourse('digital', 'digital_marketing')).toBe(false);
    expect(belongsToCourse('digital', 'artificial_intelligence')).toBe(false);
    expect(programValuesFor('see_class_10')).toEqual(['see_class_10', 'see']);
  });
});

import { courseFromTitle, resolveRowCourse } from '../courseIds';

describe('which course a row belongs to', () => {
  it('reads course words whole, so "seed", "band" and "main" name no course', () => {
    expect(courseFromTitle('Seed germination and dormancy')).toBeNull();
    expect(courseFromTitle('Band theory of solids')).toBeNull();
    expect(courseFromTitle('SEE 2082 Main Batch')).toBe('see_class_10');
    expect(courseFromTitle('see_science')).toBe('see_class_10');
    expect(courseFromTitle('Class 10 Compulsory Science')).toBe('see_class_10');
    expect(courseFromTitle('IELTS Writing Task 2')).toBe('ielts');
    expect(courseFromTitle('Prompt engineering basics')).toBe('artificial_intelligence');
    expect(courseFromTitle('IOE Engineering Mathematics')).toBe('ioe_engineering');
    expect(courseFromTitle('SEE and NEB Class 11 bridge course')).toBe('ambiguous');
  });

  it('trusts any stored course except the CEE default, which every untagged upload got', () => {
    expect(resolveRowCourse({ program_type: 'ielts', title: 'Anything' })).toBe('ielts');
    expect(resolveRowCourse({ program_type: 'see', title: 'Cell biology' })).toBe('see_class_10');
    // Stored 'cee' but the title says SEE: the title wins (the old SEE rule, kept until the data is fixed).
    expect(resolveRowCourse({ program_type: 'cee', title: 'SEE Science Model Set 1' })).toBe('see_class_10');
    // Stored 'cee' and nothing says otherwise: CEE, as before.
    expect(resolveRowCourse({ program_type: 'cee', title: 'Seed germination' })).toBe('cee_medical');
    expect(resolveRowCourse({ program_type: 'cee', title: 'Band theory of solids' })).toBe('cee_medical');
  });

  it('places ambiguous, empty and unknown rows in no course — never CEE by default', () => {
    expect(resolveRowCourse({ program_type: 'digital', title: 'Week 1' })).toBeNull();
    expect(resolveRowCourse({ program_type: 'cee', title: 'SEE and NEB Class 11 bridge course' })).toBeNull();
    expect(resolveRowCourse({ program_type: null, title: 'Untitled' })).toBeNull();
    expect(resolveRowCourse({ program_type: 'pte', title: 'Untitled' })).toBeNull();
    expect(resolveRowCourse(null)).toBeNull();
  });

  it('in strict mode reads program_type and nothing else', () => {
    const prev = process.env.NEXT_PUBLIC_STRICT_COURSE_ISOLATION;
    process.env.NEXT_PUBLIC_STRICT_COURSE_ISOLATION = 'on';
    try {
      expect(resolveRowCourse({ program_type: 'cee', title: 'SEE Science Model Set 1' })).toBe('cee_medical');
      expect(resolveRowCourse({ program_type: null, title: 'IELTS Writing' })).toBeNull();
    } finally {
      process.env.NEXT_PUBLIC_STRICT_COURSE_ISOLATION = prev;
    }
  });
});

import { storedProgramValue } from '../courseIds';
import { CANONICAL_COURSES as ALL_COURSES } from '@/contexts/ProgramContext';

describe('storedProgramValue', () => {
  it('always fits program_type VARCHAR(20) and reads back as the same course', () => {
    for (const c of ALL_COURSES) {
      const v = storedProgramValue(c);
      expect(v.length).toBeLessThanOrEqual(20);
      expect(parseCourseId(v)).toBe(c);
    }
    expect(storedProgramValue('artificial_intelligence')).toBe('ai');
    expect(storedProgramValue('cee_medical')).toBe('cee_medical');
  });
});
