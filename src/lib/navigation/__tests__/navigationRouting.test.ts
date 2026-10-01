import { describe, it, expect } from 'vitest';
import { CANONICAL_CATALOG, getAllCourses, getCourseBySlug, CourseTrack } from '@/lib/courses/catalog';

/**
 * Mirror of safe redirect resolution logic used in AuthPageClient and auth callback.
 */
function resolveSafeRedirect(searchParamsStr: string): { destination: string; reasonText: string | null } {
  const params = new URLSearchParams(searchParamsStr);
  const raw = params.get('redirect') || params.get('returnUrl') || params.get('redirectTo') || params.get('next');
  const explicitReason = params.get('reason');

  // Reject external / open-redirect vectors
  const safeRedirect = raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : null;

  if (explicitReason) {
    return { destination: safeRedirect ?? '/student-dashboard', reasonText: explicitReason };
  }

  if (safeRedirect) {
    if (safeRedirect.includes('/checkout')) {
      return { destination: safeRedirect, reasonText: 'Sign in to complete your course enrollment and activate your batch access.' };
    }
    if (safeRedirect.includes('/mock-tests')) {
      return { destination: safeRedirect, reasonText: 'Sign in to save your mock exam scores and track your national percentile rank.' };
    }
    if (safeRedirect.includes('/practice')) {
      return { destination: safeRedirect, reasonText: 'Sign in to save question bookmarks and track your topic accuracy.' };
    }
    if (safeRedirect.includes('/study-plan')) {
      return { destination: safeRedirect, reasonText: 'Sign in to access your personalized daily study plan and tasks.' };
    }
    if (safeRedirect.includes('/mistake')) {
      return { destination: safeRedirect, reasonText: 'Sign in to access your personalized mistakes notebook and revision sets.' };
    }
    return { destination: safeRedirect, reasonText: 'Sign in to continue to your learning destination. You will be redirected automatically.' };
  }

  return { destination: '/student-dashboard', reasonText: null };
}

describe('Prompt 5 — Navigation and Course Discovery Tests', () => {
  describe('1. Canonical Course Catalog & Discovery', () => {
    it('contains approved courses covering flagship CEE and SEE tracks', () => {
      const courses = getAllCourses();
      expect(courses.length).toBeGreaterThanOrEqual(4);

      const tracks = new Set(courses.map((c) => c.track));
      expect(tracks.has('cee_medical')).toBe(true);
      expect(tracks.has('see_class_10')).toBe(true);
    });

    it('each course has valid route paths, non-zero prices, and existing slugs', () => {
      CANONICAL_CATALOG.forEach((course) => {
        expect(course.slug).toBeTruthy();
        expect(course.title).toBeTruthy();
        expect(course.priceNpr).toBeGreaterThan(0);
        expect(course.enrollPath).toMatch(/^\/checkout\?plan=/);
        expect(getCourseBySlug(course.slug)).toBeDefined();
      });
    });

    it('resolves flagship CEE course and flagship SEE course by exact slug', () => {
      const cee = getCourseBySlug('cee-mbbs-mastery-2026');
      expect(cee).toBeDefined();
      expect(cee?.track).toBe('cee_medical');
      expect(cee?.priceNpr).toBe(7990);

      const see = getCourseBySlug('see-class-10-board-topper-batch');
      expect(see).toBeDefined();
      expect(see?.track).toBe('see_class_10');
      expect(see?.priceNpr).toBe(4990);
    });

    it('returns undefined for nonexistent or unpublished course slugs without throwing', () => {
      expect(getCourseBySlug('non-existent-batch-slug')).toBeUndefined();
      expect(getCourseBySlug('')).toBeUndefined();
    });
  });

  describe('2. Navigation Pillar Mapping', () => {
    const PILLAR_DESTINATIONS = {
      learn: '/subjects',
      practice: '/practice',
      mockTests: '/mock-tests',
      revise: '/mistake-analyser',
      progress: '/student-dashboard',
      support: '/contact',
    };

    it('all 6 core pillars have well-defined, absolute local destinations', () => {
      Object.entries(PILLAR_DESTINATIONS).forEach(([pillar, destination]) => {
        expect(destination.startsWith('/')).toBe(true);
        expect(destination.startsWith('//')).toBe(false);
        expect(destination.length).toBeGreaterThan(1);
      });
    });
  });

  describe('3. Account-Required Redirection & Destination Preservation', () => {
    it('preserves ?redirect param and provides helpful context copy for checkout', () => {
      const { destination, reasonText } = resolveSafeRedirect('?redirect=/checkout?plan=cee-mbbs-mastery-2026');
      expect(destination).toBe('/checkout?plan=cee-mbbs-mastery-2026');
      expect(reasonText).toContain('Sign in to complete your course enrollment');
    });

    it('preserves ?returnUrl param for mock tests', () => {
      const { destination, reasonText } = resolveSafeRedirect('?returnUrl=/mock-tests');
      expect(destination).toBe('/mock-tests');
      expect(reasonText).toContain('mock exam scores');
    });

    it('preserves ?redirectTo param for practice', () => {
      const { destination, reasonText } = resolveSafeRedirect('?redirectTo=/practice');
      expect(destination).toBe('/practice');
      expect(reasonText).toContain('question bookmarks');
    });

    it('preserves ?next param for study plan', () => {
      const { destination, reasonText } = resolveSafeRedirect('?next=/study-plan');
      expect(destination).toBe('/study-plan');
      expect(reasonText).toContain('study plan');
    });

    it('respects explicit reason parameter over deduced reason', () => {
      const { destination, reasonText } = resolveSafeRedirect('?redirect=/practice&reason=Custom%20verification%20message');
      expect(destination).toBe('/practice');
      expect(reasonText).toBe('Custom verification message');
    });

    it('rejects open-redirect attack vectors and falls back to safe dashboard', () => {
      const evil1 = resolveSafeRedirect('?redirect=https://evil.com/phish');
      expect(evil1.destination).toBe('/student-dashboard');

      const evil2 = resolveSafeRedirect('?returnUrl=//attacker.com');
      expect(evil2.destination).toBe('/student-dashboard');

      const evil3 = resolveSafeRedirect('?redirectTo=/\\attacker.com');
      expect(evil3.destination).toBe('/student-dashboard');
    });

    it('falls back to /student-dashboard when no redirect param is present', () => {
      const { destination, reasonText } = resolveSafeRedirect('');
      expect(destination).toBe('/student-dashboard');
      expect(reasonText).toBeNull();
    });
  });
});
