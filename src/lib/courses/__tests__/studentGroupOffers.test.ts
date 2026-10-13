import { describe, it, expect } from 'vitest';
import {
  STUDENT_GROUP_OFFERS,
  STUDENT_GROUPS_LIST,
  getStudentGroupOffer,
  validateStreamPurity,
} from '../studentGroupOffers';

describe('Free Offers & Pedagogical Progression by Student Group (Prompt Specification)', () => {
  it('covers all 6 authoritative student groups without omission', () => {
    expect(STUDENT_GROUPS_LIST.length).toBe(6);

    const ids = STUDENT_GROUPS_LIST.map((g) => g.id);
    expect(ids).toContain('class_10_see');
    expect(ids).toContain('class_11');
    expect(ids).toContain('class_12');
    expect(ids).toContain('medical_cee');
    expect(ids).toContain('engineering_entrance');
    expect(ids).toContain('lok_sewa');
  });

  it('enforces that every group has verified responsible faculty and reviewed subjects', () => {
    for (const group of STUDENT_GROUPS_LIST) {
      expect(group.responsibleFaculty.length).toBeGreaterThan(0);
      for (const faculty of group.responsibleFaculty) {
        expect(faculty.name).toBeTruthy();
        expect(faculty.verified).toBe(true);
      }
      expect(group.reviewedSubjects.length).toBeGreaterThan(0);
    }
  });

  describe('Class 10 / SEE Offer Specifications', () => {
    const see = STUDENT_GROUP_OFFERS.class_10_see;

    it('matches required free resources menu for Class 10 / SEE', () => {
      const titles = see.freeResourcesToProvide.map((r) => r.title.toLowerCase());
      expect(titles.some((t) => t.includes('subject diagnostic'))).toBe(true);
      expect(titles.some((t) => t.includes('chapter revision sheets'))).toBe(true);
      expect(titles.some((t) => t.includes('original model papers') && t.includes('worked solutions'))).toBe(true);
      expect(titles.some((t) => t.includes('one weekly mock'))).toBe(true);
      expect(titles.some((t) => t.includes('answer-writing and diagram guides') || t.includes('answer-writing'))).toBe(true);
      expect(titles.some((t) => t.includes('seven-day revision plan'))).toBe(true);
    });

    it('promotes the exact main offer with scanner validation condition', () => {
      expect(see.mainOfferToPromote.hook).toBe(
        'Take a free SEE test and see which topics to revise next.'
      );
      expect(see.mainOfferToPromote.scannerValidationRule).toContain(
        'Add two handwritten-answer feedback trials per week only after the scanner is validated for the chosen question types.'
      );
    });

    it('features optional paid progression with live teaching and individual teacher support', () => {
      expect(see.optionalPaidProgression.summary.toLowerCase()).toContain('structured full syllabus course');
      expect(see.optionalPaidProgression.summary.toLowerCase()).toContain('live teaching');
      expect(see.optionalPaidProgression.summary.toLowerCase()).toContain('individual teacher support');
    });
  });

  describe('Class 11 Offer Specifications', () => {
    const cls11 = STUDENT_GROUP_OFFERS.class_11;

    it('matches required free resources menu for Class 11', () => {
      const titles = cls11.freeResourcesToProvide.map((r) => r.title.toLowerCase());
      expect(titles.some((t) => t.includes('class 10-to-11 bridge lessons'))).toBe(true);
      expect(titles.some((t) => t.includes('prerequisite quizzes'))).toBe(true);
      expect(titles.some((t) => t.includes('selected chapter notes'))).toBe(true);
      expect(titles.some((t) => t.includes('formula') && t.includes('definition sheets'))).toBe(true);
      expect(titles.some((t) => t.includes('one complete sample lesson per offered subject'))).toBe(true);
      expect(titles.some((t) => t.includes('study planner'))).toBe(true);
    });

    it('promotes the exact main offer with student stream/subject choice', () => {
      expect(cls11.mainOfferToPromote.hook).toBe(
        'Check whether your foundations are ready for Class 11.'
      );
      expect(cls11.mainOfferToPromote.editorialGuideline).toContain(
        'Let students choose their stream and subjects.'
      );
    });

    it('features optional paid progression with full subject courses and live doubt sessions', () => {
      expect(cls11.optionalPaidProgression.summary.toLowerCase()).toContain('full subject courses');
      expect(cls11.optionalPaidProgression.summary.toLowerCase()).toContain('regular assignments');
      expect(cls11.optionalPaidProgression.summary.toLowerCase()).toContain('live doubt sessions');
    });
  });

  describe('Class 12 Offer Specifications', () => {
    const cls12 = STUDENT_GROUP_OFFERS.class_12;

    it('matches required free resources menu for Class 12', () => {
      const titles = cls12.freeResourcesToProvide.map((r) => r.title.toLowerCase());
      expect(titles.some((t) => t.includes('revision sheets') && t.includes('derivation'))).toBe(true);
      expect(titles.some((t) => t.includes('official past papers') && t.includes('samyak-authored solutions'))).toBe(true);
      expect(titles.some((t) => t.includes('timed chapter tests'))).toBe(true);
      expect(titles.some((t) => t.includes('weekly mock') && t.includes('mistake report'))).toBe(true);
    });

    it('promotes the exact main offer', () => {
      expect(cls12.mainOfferToPromote.hook).toBe(
        'Take a free Class 12 mock and get a focused revision plan.'
      );
    });

    it('features optional paid progression with extended mock series and mentoring', () => {
      expect(cls12.optionalPaidProgression.summary.toLowerCase()).toContain('full revision course');
      expect(cls12.optionalPaidProgression.summary.toLowerCase()).toContain('extended mock series');
      expect(cls12.optionalPaidProgression.summary.toLowerCase()).toContain('teacher evaluation');
      expect(cls12.optionalPaidProgression.summary.toLowerCase()).toContain('mentoring');
    });
  });

  describe('Medical Entrance / CEE Offer Specifications', () => {
    const cee = STUDENT_GROUP_OFFERS.medical_cee;

    it('matches required free resources menu for CEE', () => {
      const titles = cee.freeResourcesToProvide.map((r) => r.title.toLowerCase());
      expect(titles.some((t) => t.includes('ten reviewed mcqs daily with explanations'))).toBe(true);
      expect(titles.some((t) => t.includes('weekly mock'))).toBe(true);
      expect(titles.some((t) => t.includes('biology flashcards'))).toBe(true);
      expect(titles.some((t) => t.includes('physics and chemistry drills'))).toBe(true);
      expect(titles.some((t) => t.includes('mistake notebook'))).toBe(true);
      expect(titles.some((t) => t.includes('topic-level performance report'))).toBe(true);
    });

    it('promotes the exact main offer with distractor explanations requirement', () => {
      expect(cee.mainOfferToPromote.hook).toBe(
        'Find your weak CEE topics with a free diagnostic.'
      );
      expect(cee.mainOfferToPromote.editorialGuideline).toContain(
        'Explain why distractors are wrong, not just which option is correct.'
      );
    });

    it('features optional paid progression with larger practice bank and adaptive practice', () => {
      expect(cee.optionalPaidProgression.summary.toLowerCase()).toContain('larger practice bank');
      expect(cee.optionalPaidProgression.summary.toLowerCase()).toContain('full-length test series');
      expect(cee.optionalPaidProgression.summary.toLowerCase()).toContain('structured teaching');
      expect(cee.optionalPaidProgression.summary.toLowerCase()).toContain('additional adaptive practice and mentoring');
    });
  });

  describe('Engineering Entrance Offer Specifications', () => {
    const ioe = STUDENT_GROUP_OFFERS.engineering_entrance;

    it('matches required free resources menu for Engineering Entrance', () => {
      const titles = ioe.freeResourcesToProvide.map((r) => r.title.toLowerCase());
      expect(titles.some((t) => t.includes('ten timed questions daily'))).toBe(true);
      expect(titles.some((t) => t.includes('formula sheets'))).toBe(true);
      expect(titles.some((t) => t.includes('worked numerical problems'))).toBe(true);
      expect(titles.some((t) => t.includes('topic diagnostic'))).toBe(true);
      expect(titles.some((t) => t.includes('weekly speed-and-accuracy test'))).toBe(true);
    });

    it('promotes the exact main offer and matches to selected entrance exam (IOE)', () => {
      expect(ioe.mainOfferToPromote.hook).toBe(
        'Find out which topic costs you time in entrance practice.'
      );
      expect(ioe.mainOfferToPromote.editorialGuideline).toContain(
        'Match each resource to the selected entrance exam, such as IOE.'
      );
    });

    it('features optional paid progression with complete entrance prep and timed mocks', () => {
      expect(ioe.optionalPaidProgression.summary.toLowerCase()).toContain('complete entrance preparation');
      expect(ioe.optionalPaidProgression.summary.toLowerCase()).toContain('extensive timed mocks');
      expect(ioe.optionalPaidProgression.summary.toLowerCase()).toContain('advanced problem-solving sessions');
    });
  });

  describe('Lok Sewa Offer Specifications', () => {
    const loksewa = STUDENT_GROUP_OFFERS.lok_sewa;

    it('matches required free resources menu for Lok Sewa', () => {
      const titles = loksewa.freeResourcesToProvide.map((r) => r.title.toLowerCase());
      expect(titles.some((t) => t.includes('dated current-affairs digest with source links'))).toBe(true);
      expect(titles.some((t) => t.includes('gk and reasoning quizzes'))).toBe(true);
      expect(titles.some((t) => t.includes('sample nepali/english practice'))).toBe(true);
      expect(titles.some((t) => t.includes('syllabus checklist'))).toBe(true);
      expect(titles.some((t) => t.includes('verified vacancy/exam links'))).toBe(true);
    });

    it('promotes the exact main offer and separates federal/provincial exams and levels', () => {
      expect(loksewa.mainOfferToPromote.hook).toBe(
        'Try a free Lok Sewa quiz and get a study checklist for your chosen post.'
      );
      expect(loksewa.mainOfferToPromote.editorialGuideline).toContain(
        'Separate federal/provincial exams and levels.'
      );
    });

    it('features optional paid progression with post-specific courses, writing evaluation & interview prep', () => {
      expect(loksewa.optionalPaidProgression.summary.toLowerCase()).toContain('post-specific courses');
      expect(loksewa.optionalPaidProgression.summary.toLowerCase()).toContain('complete mock series');
      expect(loksewa.optionalPaidProgression.summary.toLowerCase()).toContain('writing evaluation');
      expect(loksewa.optionalPaidProgression.summary.toLowerCase()).toContain('interview preparation');
    });
  });

  describe('Stream Purity & Generic Bank Prevention', () => {
    it('passes stream purity validation without generic question bank cross-pollination', () => {
      const purity = validateStreamPurity();
      expect(purity.valid).toBe(true);
      expect(purity.issues.length).toBe(0);
    });

    it('resolves group offers by normalized aliases correctly', () => {
      expect(getStudentGroupOffer('see')?.id).toBe('class_10_see');
      expect(getStudentGroupOffer('class_10')?.id).toBe('class_10_see');
      expect(getStudentGroupOffer('class11')?.id).toBe('class_11');
      expect(getStudentGroupOffer('class12')?.id).toBe('class_12');
      expect(getStudentGroupOffer('cee')?.id).toBe('medical_cee');
      expect(getStudentGroupOffer('ioe')?.id).toBe('engineering_entrance');
      expect(getStudentGroupOffer('loksewa')?.id).toBe('lok_sewa');
      expect(getStudentGroupOffer('unknown_group')).toBeUndefined();
    });
  });
});
