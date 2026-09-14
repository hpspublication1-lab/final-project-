import { describe, it, expect } from 'vitest';
import {
  evaluateAccessContext,
  evaluateCourseState,
  resolveUserRole,
  canAccessRoute,
  normalizeCourseSlug,
} from '../accessControl';

describe('Samyak LMS Access Control Service', () => {
  describe('normalizeCourseSlug', () => {
    it('normalizes various aliases to canonical slugs', () => {
      expect(normalizeCourseSlug('see')).toBe('see_class_10');
      expect(normalizeCourseSlug('see_class_10')).toBe('see_class_10');
      expect(normalizeCourseSlug('cee')).toBe('cee_medical');
      expect(normalizeCourseSlug('cee_medical')).toBe('cee_medical');
      expect(normalizeCourseSlug('english')).toBe('ielts');
      expect(normalizeCourseSlug('ai')).toBe('artificial_intelligence');
      expect(normalizeCourseSlug('unknown')).toBe(null);
    });
  });

  describe('resolveUserRole', () => {
    it('returns visitor when unauthenticated', () => {
      expect(resolveUserRole(null)).toBe('visitor');
    });

    it('returns super_administrator for allowlisted super admin email', () => {
      expect(resolveUserRole('surajgaming02@gmail.com')).toBe('super_administrator');
    });

    it('returns administrator when is_admin is true', () => {
      expect(resolveUserRole('teacher@samyak.edu.np', { is_admin: true })).toBe('administrator');
    });

    it('returns teacher when profile role is teacher', () => {
      expect(resolveUserRole('teacher@samyak.edu.np', { role_name: 'teacher' })).toBe('teacher');
    });

    it('returns student_paid_see when only SEE course is active', () => {
      expect(resolveUserRole('student@gmail.com', null, ['see_class_10'])).toBe('student_paid_see');
    });

    it('returns student_paid_cee when only CEE course is active', () => {
      expect(resolveUserRole('student@gmail.com', null, ['cee_medical'])).toBe('student_paid_cee');
    });

    it('returns student_all_access when both SEE and CEE are active', () => {
      expect(resolveUserRole('student@gmail.com', null, ['see_class_10', 'cee_medical'])).toBe('student_all_access');
    });

    it('returns student_free when logged in with no active paid courses', () => {
      expect(resolveUserRole('student@gmail.com', null, [])).toBe('student_free');
    });
  });

  describe('evaluateCourseState & Lifecycle States', () => {
    it('returns not_enrolled for visitors', () => {
      const state = evaluateCourseState(false, false);
      expect(state.state).toBe('not_enrolled');
      expect(state.canAccessFullCourse).toBe(false);
      expect(state.canAccessFreePreview).toBe(false);
    });

    it('returns suspended when account is banned', () => {
      const state = evaluateCourseState(true, true);
      expect(state.state).toBe('suspended');
      expect(state.canAccessFullCourse).toBe(false);
      expect(state.canAccessFreePreview).toBe(false);
    });

    it('returns free_preview for logged-in user with no enrollment', () => {
      const state = evaluateCourseState(true, false, null);
      expect(state.state).toBe('free_preview');
      expect(state.canAccessFullCourse).toBe(false);
      expect(state.canAccessFreePreview).toBe(true);
    });

    it('returns active for valid paid enrollment', () => {
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const state = evaluateCourseState(true, false, {
        status: 'active',
        expires_at: future,
        batch_id: 'batch-see-topper',
      });
      expect(state.state).toBe('active');
      expect(state.canAccessFullCourse).toBe(true);
      expect(state.batchId).toBe('batch-see-topper');
    });

    it('returns expiring_soon when less than 7 days remain', () => {
      const nearFuture = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const state = evaluateCourseState(true, false, {
        status: 'active',
        expires_at: nearFuture,
      });
      expect(state.state).toBe('expiring_soon');
      expect(state.canAccessFullCourse).toBe(true);
      expect(state.daysRemaining).toBeLessThanOrEqual(4);
    });

    it('returns expired when expiration date has passed', () => {
      const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const state = evaluateCourseState(true, false, {
        status: 'active',
        expires_at: past,
      });
      expect(state.state).toBe('expired');
      expect(state.canAccessFullCourse).toBe(false);
      expect(state.canAccessFreePreview).toBe(true);
    });

    it('returns refunded when enrollment status is refunded', () => {
      const state = evaluateCourseState(true, false, {
        status: 'refunded',
      });
      expect(state.state).toBe('refunded');
      expect(state.canAccessFullCourse).toBe(false);
    });

    it('returns payment_pending when enrollment status is pending', () => {
      const state = evaluateCourseState(true, false, {
        status: 'pending',
      });
      expect(state.state).toBe('payment_pending');
      expect(state.canAccessFullCourse).toBe(false);
    });
  });

  describe('Non-Contradictory State Evaluation', () => {
    it('guarantees an SEE paid student sees active on SEE and free_preview on CEE', () => {
      const ctx = evaluateAccessContext(
        { id: 'user-1', email: 'see_student@samyak.np' },
        null,
        [{ course_id: 'see_class_10', status: 'active', expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }]
      );

      expect(ctx.role).toBe('student_paid_see');
      expect(ctx.courses.see_class_10.state).toBe('active');
      expect(ctx.courses.see_class_10.canAccessFullCourse).toBe(true);
      expect(ctx.courses.cee_medical.state).toBe('free_preview');
      expect(ctx.courses.cee_medical.canAccessFullCourse).toBe(false);
    });

    it('guarantees an unauthenticated visitor sees not_enrolled on all courses', () => {
      const ctx = evaluateAccessContext(null);
      expect(ctx.role).toBe('visitor');
      expect(ctx.courses.see_class_10.state).toBe('not_enrolled');
      expect(ctx.courses.cee_medical.state).toBe('not_enrolled');
      expect(ctx.courses.see_class_10.canAccessFullCourse).toBe(false);
    });
  });

  describe('canAccessRoute: Route Isolation & Protection', () => {
    it('blocks visitor from student-dashboard and redirects to login', () => {
      const ctx = evaluateAccessContext(null);
      const res = canAccessRoute(ctx, '/student-dashboard');
      expect(res.allowed).toBe(false);
      expect(res.redirectUrl).toContain('/login');
    });

    it('blocks student from admin routes', () => {
      const ctx = evaluateAccessContext(
        { id: 'user-1', email: 'student@samyak.np' },
        null,
        [{ course_id: 'see_class_10', status: 'active' }]
      );
      const res = canAccessRoute(ctx, '/admin');
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('admin_permission_required');
    });

    it('blocks student from teacher tools', () => {
      const ctx = evaluateAccessContext(
        { id: 'user-1', email: 'student@samyak.np' },
        null,
        [{ course_id: 'cee_medical', status: 'active' }]
      );
      const res = canAccessRoute(ctx, '/teacher/batches');
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('teacher_permission_required');
    });

    it('allows teacher on teacher tools', () => {
      const ctx = evaluateAccessContext(
        { id: 'teacher-1', email: 'dr_shrestha@samyak.np' },
        { role_name: 'teacher' },
        []
      );
      const res = canAccessRoute(ctx, '/teacher/live-classes');
      expect(res.allowed).toBe(true);
    });

    it('blocks SEE student from CEE-exclusive mock tests', () => {
      const ctx = evaluateAccessContext(
        { id: 'user-1', email: 'see_student@samyak.np' },
        null,
        [{ course_id: 'see_class_10', status: 'active' }]
      );
      const res = canAccessRoute(ctx, '/mock-tests/exam/cee-2026-full-mock');
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('cee_enrollment_required');
    });

    it('blocks CEE student from SEE-exclusive subjective vision marker', () => {
      const ctx = evaluateAccessContext(
        { id: 'user-2', email: 'cee_student@samyak.np' },
        null,
        [{ course_id: 'cee_medical', status: 'active' }]
      );
      const res = canAccessRoute(ctx, '/vision-marker');
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('see_enrollment_required');
    });

    it('allows super admin on everything', () => {
      const ctx = evaluateAccessContext(
        { id: 'super-1', email: 'surajgaming02@gmail.com' },
        null,
        []
      );
      expect(canAccessRoute(ctx, '/admin').allowed).toBe(true);
      expect(canAccessRoute(ctx, '/teacher/batches').allowed).toBe(true);
      expect(canAccessRoute(ctx, '/student-dashboard').allowed).toBe(true);
      expect(canAccessRoute(ctx, '/vision-marker').allowed).toBe(true);
      expect(canAccessRoute(ctx, '/mock-tests/exam/cee-1').allowed).toBe(true);
    });

    it('blocks suspended accounts from private learning routes', () => {
      const ctx = evaluateAccessContext(
        { id: 'banned-1', email: 'cheater@samyak.np' },
        { is_banned: true },
        [{ course_id: 'cee_medical', status: 'active' }]
      );
      const res = canAccessRoute(ctx, '/student-dashboard');
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('account_suspended');
    });

    it('extracts enrolled batch IDs and supports multi-enrollment switching', () => {
      const ctx = evaluateAccessContext(
        { id: 'dual-1', email: 'dual@samyak.np' },
        null,
        [
          { course_id: 'see_class_10', batch_id: 'batch-see-english', status: 'active' },
          { course_id: 'cee_medical', batch_id: 'batch-cee-target', status: 'active' },
        ]
      );
      expect(ctx.enrolledBatchIds).toContain('batch-see-english');
      expect(ctx.enrolledBatchIds).toContain('batch-cee-target');
      expect(ctx.courses.see_class_10.batchId).toBe('batch-see-english');
      expect(ctx.courses.cee_medical.batchId).toBe('batch-cee-target');
      expect(ctx.courses.see_class_10.isEnrolled).toBe(true);
      expect(ctx.courses.cee_medical.isEnrolled).toBe(true);
      expect(ctx.role).toBe('student_all_access');
    });

    it('determines video entitlement access correctly', () => {
      // Free student cannot access paid video
      const freeCtx = evaluateAccessContext(
        { id: 'free-user', email: 'free@samyak.np' },
        null,
        []
      );
      const isPrivileged = freeCtx.role === 'super_administrator' || freeCtx.role === 'administrator' || freeCtx.role === 'teacher';
      const hasPaid = isPrivileged || Object.values(freeCtx.courses).some((c) => c.canAccessFullCourse);
      expect(hasPaid).toBe(false);

      // Paid student has paid video access
      const paidCtx = evaluateAccessContext(
        { id: 'paid-user', email: 'paid@samyak.np' },
        null,
        [{ course_id: 'cee_medical', status: 'active' }]
      );
      const paidHasPaid = Object.values(paidCtx.courses).some((c) => c.canAccessFullCourse);
      expect(paidHasPaid).toBe(true);
    });

    it('calculates watch progress and auto-completes at 90%', () => {
      const calculateProgress = (watched: number, total: number) => {
        const percentage = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0;
        const isCompleted = percentage >= 90;
        return { percentage, isCompleted };
      };

      expect(calculateProgress(0, 1000)).toEqual({ percentage: 0, isCompleted: false });
      expect(calculateProgress(500, 1000)).toEqual({ percentage: 50, isCompleted: false });
      expect(calculateProgress(890, 1000)).toEqual({ percentage: 89, isCompleted: false });
      expect(calculateProgress(900, 1000)).toEqual({ percentage: 90, isCompleted: true });
      expect(calculateProgress(950, 1000)).toEqual({ percentage: 95, isCompleted: true });
      expect(calculateProgress(1000, 1000)).toEqual({ percentage: 100, isCompleted: true });
    });
  });
});
