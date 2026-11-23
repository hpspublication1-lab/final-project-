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

  it('places ambiguous and unknown rows in no course', () => {
    expect(resolveRowCourse({ program_type: 'digital', title: 'Week 1' })).toBeNull();
    expect(resolveRowCourse({ program_type: 'cee', title: 'SEE and NEB Class 11 bridge course' })).toBeNull();
    expect(resolveRowCourse({ program_type: 'pte', title: 'Untitled' })).toBeNull();
    expect(resolveRowCourse(null)).toBeNull();
  });

  it('treats a row with nothing stored like the old column default, CEE', () => {
    // The live database may have no program_type column at all; then every row
    // is "nothing stored", and CEE's own content must stay in CEE.
    expect(resolveRowCourse({ program_type: null, title: 'Untitled' })).toBe('cee_medical');
    expect(resolveRowCourse({ title: 'Untitled' })).toBe('cee_medical');
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

import { ALL_COURSE_IDS, COURSE_TITLES } from '../courseIds';
import { COURSES_MAP } from '@/contexts/ProgramContext';

describe('server-side course list', () => {
  it('has the same courses and names as the client list', () => {
    expect([...ALL_COURSE_IDS].sort()).toEqual([...ALL_COURSES].sort());
    for (const c of ALL_COURSES) expect(COURSE_TITLES[c]).toBe(COURSES_MAP[c].name);
  });
});

describe('rows with no stored course (no program_type column)', () => {
  it('keeps unlabelled CEE content in CEE', () => {
    expect(resolveRowCourse({ name: 'biology', display_name: 'Biology' })).toBe('cee_medical');
    expect(resolveRowCourse({ title: 'Grand Mock Test 1' })).toBe('cee_medical');
  });
  it('places subjects the repo names by course', () => {
    expect(resolveRowCourse({ name: 'compulsory_science' })).toBe('see_class_10');
    expect(resolveRowCourse({ name: 'optional_math' })).toBe('see_class_10');
    expect(resolveRowCourse({ name: 'social_studies' })).toBe('see_class_10');
    expect(resolveRowCourse({ name: 'english' })).toBe('see_class_10');
    // a stored 'cee' (the default) doesn't override the repo's own classification
    expect(resolveRowCourse({ name: 'optional_math', program_type: 'cee' })).toBe('see_class_10');
    // an explicit other course does
    expect(resolveRowCourse({ name: 'english', program_type: 'ielts' })).toBe('ielts');
  });
  it('places the other live subjects by their names, or not at all', () => {
    expect(resolveRowCourse({ name: 'loksewa_gk' })).toBe('lok_sewa');
    expect(resolveRowCourse({ name: 'loksewa_governance' })).toBe('lok_sewa');
    expect(resolveRowCourse({ name: 'engineering_math' })).toBe('ioe_engineering');
    expect(resolveRowCourse({ name: 'neb_computer_science' })).toBeNull(); // which class?
    expect(resolveRowCourse({ name: 'neb_class_12_physics' })).toBe('neb_class_12');
  });
  it('places the live batches by their titles', () => {
    expect(resolveRowCourse({ title: 'IELTS Academic & General 8.0+ Band Batch', slug: 'ielts-mastery-batch-2026' })).toBe('ielts');
    expect(resolveRowCourse({ title: 'SEE 2026 — English Medium Mastery Batch' })).toBe('see_class_10');
  });
  it('an unknown stored value is not guessed', () => {
    expect(resolveRowCourse({ title: 'Something', program_type: 'xyz' })).toBeNull();
  });
});
