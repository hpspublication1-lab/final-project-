import { describe, it, expect } from 'vitest';
import { shouldSuppressTrialPromo } from '../TrialBannerAndModals';

describe('TrialBannerAndModals - Route Boundary & Suppression Logic (FIX-001)', () => {
  describe('Administrative Interface Routes (Must Suppress)', () => {
    it('suppresses on exact /admin route', () => {
      expect(shouldSuppressTrialPromo('/admin')).toBe(true);
      expect(shouldSuppressTrialPromo('/admin/')).toBe(true);
    });

    it('suppresses on /admin/login', () => {
      expect(shouldSuppressTrialPromo('/admin/login')).toBe(true);
    });

    it('suppresses on CEE Visual Intelligence Studio and nested CMS routes', () => {
      expect(shouldSuppressTrialPromo('/admin/cee-visual')).toBe(true);
      expect(shouldSuppressTrialPromo('/admin/cee-visual/studio')).toBe(true);
      expect(shouldSuppressTrialPromo('/admin/cee-visual/reviews')).toBe(true);
      expect(shouldSuppressTrialPromo('/admin/cee-visual/syllabus')).toBe(true);
      expect(shouldSuppressTrialPromo('/admin/cee-visual/roles')).toBe(true);
    });

    it('suppresses on other admin management routes', () => {
      expect(shouldSuppressTrialPromo('/admin/users')).toBe(true);
      expect(shouldSuppressTrialPromo('/admin/courses')).toBe(true);
      expect(shouldSuppressTrialPromo('/admin/settings')).toBe(true);
      expect(shouldSuppressTrialPromo('/admin/analytics')).toBe(true);
    });
  });

  describe('Staff and Teacher Portal Routes (Must Suppress)', () => {
    it('suppresses on /staff and nested staff routes', () => {
      expect(shouldSuppressTrialPromo('/staff')).toBe(true);
      expect(shouldSuppressTrialPromo('/staff/')).toBe(true);
      expect(shouldSuppressTrialPromo('/staff/dashboard')).toBe(true);
      expect(shouldSuppressTrialPromo('/staff/grading')).toBe(true);
    });

    it('suppresses on /teacher and nested teacher routes', () => {
      expect(shouldSuppressTrialPromo('/teacher')).toBe(true);
      expect(shouldSuppressTrialPromo('/teacher/')).toBe(true);
      expect(shouldSuppressTrialPromo('/teacher/classes')).toBe(true);
      expect(shouldSuppressTrialPromo('/teacher/live')).toBe(true);
    });
  });

  describe('Authentication and Onboarding Routes (Must Suppress)', () => {
    it('suppresses on sign-in, registration, and password recovery', () => {
      expect(shouldSuppressTrialPromo('/login')).toBe(true);
      expect(shouldSuppressTrialPromo('/login/')).toBe(true);
      expect(shouldSuppressTrialPromo('/signup')).toBe(true);
      expect(shouldSuppressTrialPromo('/register')).toBe(true);
      expect(shouldSuppressTrialPromo('/reset-password')).toBe(true);
      expect(shouldSuppressTrialPromo('/onboarding')).toBe(true);
    });

    it('suppresses on /auth/* callback endpoints', () => {
      expect(shouldSuppressTrialPromo('/auth/callback')).toBe(true);
      expect(shouldSuppressTrialPromo('/auth/confirm')).toBe(true);
    });
  });

  describe('Student-Facing Promotional Routes (Must NOT Suppress)', () => {
    it('preserves trial promo on root and marketing pages', () => {
      expect(shouldSuppressTrialPromo('/')).toBe(false);
      expect(shouldSuppressTrialPromo('/pricing')).toBe(false);
      expect(shouldSuppressTrialPromo('/about')).toBe(false);
      expect(shouldSuppressTrialPromo('/contact')).toBe(false);
      expect(shouldSuppressTrialPromo('/blog')).toBe(false);
    });

    it('preserves trial promo on student learning workflows', () => {
      expect(shouldSuppressTrialPromo('/dashboard')).toBe(false);
      expect(shouldSuppressTrialPromo('/student-dashboard')).toBe(false);
      expect(shouldSuppressTrialPromo('/courses')).toBe(false);
      expect(shouldSuppressTrialPromo('/courses/mbbs-mastery')).toBe(false);
      expect(shouldSuppressTrialPromo('/practice')).toBe(false);
      expect(shouldSuppressTrialPromo('/mock-tests')).toBe(false);
      expect(shouldSuppressTrialPromo('/cee/visual/lab')).toBe(false);
      expect(shouldSuppressTrialPromo('/battle-arena')).toBe(false);
    });
  });

  describe('Route Boundary False Positive Prevention', () => {
    it('does not falsely suppress paths that only contain prefix as a substring', () => {
      expect(shouldSuppressTrialPromo('/administrator')).toBe(false);
      expect(shouldSuppressTrialPromo('/staff-picks')).toBe(false);
      expect(shouldSuppressTrialPromo('/teachers-guide')).toBe(false);
    });

    it('handles empty or missing paths gracefully', () => {
      expect(shouldSuppressTrialPromo('')).toBe(false);
    });
  });
});
