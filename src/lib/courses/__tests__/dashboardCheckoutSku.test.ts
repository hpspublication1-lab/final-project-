import { describe, it, expect } from 'vitest';
import { COURSES_MAP, CANONICAL_COURSES } from '@/contexts/ProgramContext';
import { resolveCheckoutPlanSku, getCourseBySlug } from '@/lib/courses/catalog';
describe('dashboard checkout plan per course', () => {
  it('each course resolves to its own real plan', () => {
    for (const c of CANONICAL_COURSES) {
      const sku = resolveCheckoutPlanSku(COURSES_MAP[c].courseSlug);
      const course = getCourseBySlug(COURSES_MAP[c].courseSlug);
      expect(course).toBeTruthy();
      if (c !== 'cee_medical') expect(sku).not.toBe('cee-mbbs-mastery-2026');
    }
  });
});
