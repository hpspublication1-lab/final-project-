/**
 * Samyak Tutor LMS — Unified Access Control Service
 * Single authoritative source of truth for user roles, course entitlements,
 * batch access, lifecycle states, and route authorization.
 */

import { CanonicalCourseSlug, PermissionCode } from '../../types/lms';
import { isSuperAdmin } from '../config/superAdmin';

export type UserRole =
  | 'visitor'
  | 'student_free'
  | 'student_paid'
  | 'student_paid_see'
  | 'student_paid_cee'
  | 'student_all_access'
  | 'teacher'
  | 'content_manager'
  | 'support_agent'
  | 'payment_staff'
  | 'administrator'
  | 'super_administrator';

export type EnrollmentState =
  | 'not_enrolled'
  | 'free_preview'
  | 'payment_pending'
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'suspended'
  | 'refunded';

export interface RawEnrollment {
  id?: string;
  course_id?: string;
  program_id?: string;
  batch_id?: string;
  status?: string;
  enrollment_status?: string;
  plan_tier?: string;
  access_level?: string;
  starts_at?: string;
  expires_at?: string;
  created_at?: string;
}

export interface RawUserProfile {
  id?: string;
  role_name?: string;
  role?: string;
  is_admin?: boolean;
  is_banned?: boolean;
  status?: string;
  subscription_plan?: string;
  subscription_expires_at?: string | null;
  school_or_college?: string;
  primary_program?: string;
}

export interface CourseAccessSummary {
  courseSlug: CanonicalCourseSlug;
  state: EnrollmentState;
  batchId?: string;
  startsAt?: string;
  expiresAt?: string;
  daysRemaining?: number;
  isEnrolled: boolean;
  canAccessFullCourse: boolean;
  canAccessFreePreview: boolean;
}

export interface AccessContext {
  userId: string | null;
  email: string | null;
  role: UserRole;
  isSuspended: boolean;
  courses: Record<CanonicalCourseSlug, CourseAccessSummary>;
  enrolledBatchIds: string[];
  activeCoursesCount: number;
}

const CANONICAL_COURSES: CanonicalCourseSlug[] = [
  'see_class_10',
  'cee_medical',
  'ielts',
  'digital_marketing',
  'artificial_intelligence',
];

/**
 * Normalizes any legacy course/program string into canonical slug.
 */
export function normalizeCourseSlug(rawSlug?: string | null): CanonicalCourseSlug | null {
  if (!rawSlug) return null;
  const s = rawSlug.toLowerCase().trim();
  if (s === 'see_class_10' || s === 'see' || s.includes('see-')) return 'see_class_10';
  if (s === 'cee_medical' || s === 'cee' || s.includes('cee-')) return 'cee_medical';
  if (s === 'ielts' || s === 'english' || s.includes('ielts-') || s.includes('pte-')) return 'ielts';
  if (s === 'digital_marketing' || s === 'marketing' || s.includes('marketing-')) return 'digital_marketing';
  if (s === 'artificial_intelligence' || s === 'ai' || s === 'digital' || s.includes('ai-') || s.includes('python-')) return 'artificial_intelligence';
  return null;
}

/**
 * Pure function: Evaluates the exact lifecycle state for a given course enrollment.
 */
export function evaluateCourseState(
  isLoggedIn: boolean,
  isSuspended: boolean,
  enrollment?: RawEnrollment | null,
  globalLegacyPro = false,
  isGlobalAdmin = false
): CourseAccessSummary & { state: EnrollmentState } {
  // Base default for unauthenticated visitor
  if (!isLoggedIn) {
    return {
      courseSlug: 'cee_medical',
      state: 'not_enrolled',
      isEnrolled: false,
      canAccessFullCourse: false,
      canAccessFreePreview: false,
    };
  }

  // Suspended account overrides everything
  if (isSuspended) {
    return {
      courseSlug: 'cee_medical',
      state: 'suspended',
      isEnrolled: false,
      canAccessFullCourse: false,
      canAccessFreePreview: false,
    };
  }

  // Admin always has active access
  if (isGlobalAdmin) {
    return {
      courseSlug: 'cee_medical',
      state: 'active',
      isEnrolled: true,
      canAccessFullCourse: true,
      canAccessFreePreview: true,
    };
  }

  // Grandfather legacy CEE subscriber if no specific enrollment exists
  if (!enrollment && globalLegacyPro) {
    return {
      courseSlug: 'cee_medical',
      state: 'active',
      isEnrolled: true,
      canAccessFullCourse: true,
      canAccessFreePreview: true,
    };
  }

  // If user is logged in with no enrollment for this course -> Free Preview
  if (!enrollment) {
    return {
      courseSlug: 'cee_medical',
      state: 'free_preview',
      isEnrolled: false,
      canAccessFullCourse: false,
      canAccessFreePreview: true,
    };
  }

  const status = (enrollment.status || enrollment.enrollment_status || 'active').toLowerCase();
  
  if (status === 'suspended') {
    return {
      courseSlug: 'cee_medical',
      state: 'suspended',
      isEnrolled: false,
      canAccessFullCourse: false,
      canAccessFreePreview: false,
    };
  }

  if (status === 'refunded' || status === 'revoked') {
    return {
      courseSlug: 'cee_medical',
      state: 'refunded',
      isEnrolled: false,
      canAccessFullCourse: false,
      canAccessFreePreview: true,
    };
  }

  if (status === 'pending') {
    return {
      courseSlug: 'cee_medical',
      state: 'payment_pending',
      batchId: enrollment.batch_id,
      isEnrolled: false,
      canAccessFullCourse: false,
      canAccessFreePreview: true,
    };
  }

  // Check expiration date
  const now = Date.now();
  const expiresAt = enrollment.expires_at;
  const startsAt = enrollment.starts_at || enrollment.created_at;

  let daysRemaining: number | undefined = undefined;
  if (expiresAt) {
    const expireTime = new Date(expiresAt).getTime();
    const diffMs = expireTime - now;
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0 || status === 'expired') {
      return {
        courseSlug: 'cee_medical',
        state: 'expired',
        batchId: enrollment.batch_id,
        startsAt,
        expiresAt,
        daysRemaining: 0,
        isEnrolled: false,
        canAccessFullCourse: false,
        canAccessFreePreview: true,
      };
    }

    if (daysRemaining <= 7) {
      return {
        courseSlug: 'cee_medical',
        state: 'expiring_soon',
        batchId: enrollment.batch_id,
        startsAt,
        expiresAt,
        daysRemaining,
        isEnrolled: true,
        canAccessFullCourse: true,
        canAccessFreePreview: true,
      };
    }
  }

  // Active paid enrollment
  return {
    courseSlug: 'cee_medical',
    state: 'active',
    batchId: enrollment.batch_id,
    startsAt,
    expiresAt,
    daysRemaining,
    isEnrolled: true,
    canAccessFullCourse: true,
    canAccessFreePreview: true,
  };
}

/**
 * Pure function: Resolves the authoritative effective role from user identity, profile, and active enrollments.
 */
export function resolveUserRole(
  userEmail: string | null | undefined,
  profile?: RawUserProfile | null,
  activeCourses: CanonicalCourseSlug[] = []
): UserRole {
  if (!userEmail && !profile?.id) return 'visitor';

  // 1. Super Admin (Email allowlist)
  if (isSuperAdmin(userEmail)) return 'super_administrator';

  // 2. Profile role attribute checks
  const rawRole = (profile?.role_name || profile?.role || '').toLowerCase();
  if (rawRole === 'super_admin' || rawRole === 'super_administrator') return 'super_administrator';
  if (profile?.is_admin || rawRole === 'admin' || rawRole === 'administrator') return 'administrator';
  if (rawRole === 'teacher') return 'teacher';
  if (rawRole === 'content_manager') return 'content_manager';
  if (rawRole === 'payment_staff') return 'payment_staff';
  if (rawRole === 'support_agent' || rawRole === 'support_staff') return 'support_agent';

  // 3. Student role determination based on active course enrollments
  const hasSee = activeCourses.includes('see_class_10');
  const hasCee = activeCourses.includes('cee_medical');
  const otherPaidCount = activeCourses.filter((c) => c !== 'see_class_10' && c !== 'cee_medical').length;

  if (hasSee && hasCee) return 'student_all_access';
  if (hasSee && otherPaidCount > 0) return 'student_all_access';
  if (hasCee && otherPaidCount > 0) return 'student_all_access';
  if (hasSee) return 'student_paid_see';
  if (hasCee) return 'student_paid_cee';
  if (otherPaidCount > 0) return 'student_paid';

  // Logged in with no active paid courses
  return 'student_free';
}

/**
 * Pure function: Builds the complete, consistent AccessContext for any user.
 * Guaranteed: NO contradictory states like "Free Plan" and "All Plans Unlocked".
 */
export function evaluateAccessContext(
  user: { id: string; email?: string | null } | null,
  profile?: RawUserProfile | null,
  enrollments: RawEnrollment[] = []
): AccessContext {
  const isLoggedIn = !!user?.id;
  const isSuspended = Boolean(profile?.is_banned || profile?.status === 'suspended');
  const userEmail = user?.email || null;

  const isGlobalAdmin = isSuperAdmin(userEmail) || Boolean(profile?.is_admin);

  // Check legacy subscription on user_profiles
  const legacyPlan = (profile?.subscription_plan || 'free').toLowerCase();
  const legacyExpires = profile?.subscription_expires_at;
  const isLegacyActive = !legacyExpires || new Date(legacyExpires).getTime() > Date.now();
  const hasLegacyCeePro = ['student', 'pro', 'premium', 'institution'].includes(legacyPlan) && isLegacyActive;

  // Map enrollments to each canonical course
  const coursesMap = {} as Record<CanonicalCourseSlug, CourseAccessSummary>;
  const activeCourses: CanonicalCourseSlug[] = [];
  const enrolledBatchIds: string[] = [];

  for (const slug of CANONICAL_COURSES) {
    // Find matching enrollment
    const matchingEnrollment = enrollments.find((e) => {
      const cSlug = normalizeCourseSlug(e.course_id || e.program_id);
      return cSlug === slug;
    });

    const evaluated = evaluateCourseState(
      isLoggedIn,
      isSuspended,
      matchingEnrollment,
      slug === 'cee_medical' ? hasLegacyCeePro : false,
      isGlobalAdmin
    );

    evaluated.courseSlug = slug;
    coursesMap[slug] = evaluated;

    if (evaluated.canAccessFullCourse) {
      activeCourses.push(slug);
      if (evaluated.batchId && !enrolledBatchIds.includes(evaluated.batchId)) {
        enrolledBatchIds.push(evaluated.batchId);
      }
    }
  }

  const role = resolveUserRole(userEmail, profile, activeCourses);

  return {
    userId: user?.id || null,
    email: userEmail,
    role,
    isSuspended,
    courses: coursesMap,
    enrolledBatchIds,
    activeCoursesCount: activeCourses.length,
  };
}

/**
 * Authoritative Route Guard: Evaluates whether an access context can access a specific route path.
 */
export function canAccessRoute(
  ctx: AccessContext,
  pathname: string
): { allowed: boolean; reason?: string; redirectUrl?: string } {
  // Normalization
  const path = pathname.toLowerCase();

  // 1. Suspended accounts are blocked from all non-public routes
  if (ctx.isSuspended) {
    const isPublic = isPublicPath(path);
    if (!isPublic) {
      return { allowed: false, reason: 'account_suspended', redirectUrl: '/login?error=account_suspended' };
    }
    return { allowed: true };
  }

  // 2. Admin routes: /admin and /admin/*
  if (path === '/admin' || path.startsWith('/admin/')) {
    if (ctx.role === 'super_administrator' || ctx.role === 'administrator') {
      return { allowed: true };
    }
    if (ctx.role === 'payment_staff') {
      const allowedPaymentStaffPaths = [
        '/admin',
        '/admin/orders',
        '/admin/enrollments',
        '/admin/coupons',
        '/admin/activation-codes',
        '/admin/users',
      ];
      const isAllowed = allowedPaymentStaffPaths.some((p) => path === p || path.startsWith(p + '/'));
      if (isAllowed) return { allowed: true };
      return { allowed: false, reason: 'admin_permission_required', redirectUrl: '/admin?error=forbidden_academic_module' };
    }
    if (ctx.role === 'visitor') {
      return { allowed: false, reason: 'authentication_required', redirectUrl: `/login?redirect=${encodeURIComponent(pathname)}` };
    }
    return { allowed: false, reason: 'admin_permission_required', redirectUrl: '/student-dashboard?error=unauthorized_admin' };
  }

  // 3. Teacher routes: /teacher and /teacher/*
  if (path === '/teacher' || path.startsWith('/teacher/')) {
    if (ctx.role === 'super_administrator' || ctx.role === 'administrator' || ctx.role === 'teacher') {
      return { allowed: true };
    }
    if (ctx.role === 'visitor') {
      return { allowed: false, reason: 'authentication_required', redirectUrl: `/login?redirect=${encodeURIComponent(pathname)}` };
    }
    return { allowed: false, reason: 'teacher_permission_required', redirectUrl: '/student-dashboard?error=teacher_required' };
  }

  // 4. Student Protected Routes
  const studentProtectedPaths = [
    '/student-dashboard',
    '/my-courses',
    '/onboarding',
    '/profile',
    '/checkout',
    '/payment-success',
  ];

  if (studentProtectedPaths.some((p) => path === p || path.startsWith(p + '/'))) {
    if (ctx.role === 'visitor') {
      return { allowed: false, reason: 'authentication_required', redirectUrl: `/login?redirect=${encodeURIComponent(pathname)}` };
    }
    return { allowed: true };
  }

  // 5. Course-Specific Gated Learning Routes
  // SEE Subjective Marker / Vision Marker requires active SEE or All-Access
  if (path.startsWith('/vision-marker') || path.startsWith('/practice/subjective')) {
    if (ctx.role === 'super_administrator' || ctx.role === 'administrator' || ctx.role === 'teacher') return { allowed: true };
    if (ctx.courses.see_class_10?.canAccessFullCourse) return { allowed: true };
    return { allowed: false, reason: 'see_enrollment_required', redirectUrl: '/see?upgrade=required' };
  }

  // CEE Mock Test 200-Q Exam Lobby requires active CEE or All-Access
  if (path.startsWith('/mock-tests/exam') || path.startsWith('/mock-tests/take')) {
    if (ctx.role === 'super_administrator' || ctx.role === 'administrator' || ctx.role === 'teacher') return { allowed: true };
    if (ctx.courses.cee_medical?.canAccessFullCourse) return { allowed: true };
    return { allowed: false, reason: 'cee_enrollment_required', redirectUrl: '/cee-medical-entrance?upgrade=required' };
  }

  // Default allowed for public / marketing / info pages
  return { allowed: true };
}

function isPublicPath(path: string): boolean {
  const publicPrefixes = [
    '/',
    '/login',
    '/courses',
    '/see',
    '/cee-medical-entrance',
    '/pricing',
    '/about',
    '/contact',
    '/refund',
    '/privacy',
    '/terms',
    '/faq',
    '/blog',
    '/api/',
  ];
  return publicPrefixes.some((p) => path === p || (p !== '/' && path.startsWith(p)));
}
