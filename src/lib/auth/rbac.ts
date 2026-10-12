/**
 * Central Role-Based Access Control (RBAC) Engine
 * Authoritative permissions dictionary and deterministic permission evaluation.
 */

import { UserRoleType, PermissionCode, CanonicalCourseSlug } from '@/types/lms';

export const ROLE_HIERARCHY: Record<UserRoleType, number> = {
  visitor: 0,
  student_free: 10,
  student_paid_see: 20,
  student_paid_cee: 20,
  student_all_access: 30,
  support_staff: 50,
  payment_staff: 55,
  content_manager: 60,
  teacher: 70,
  admin: 90,
  super_admin: 100,
};

const BASE_STUDENT_PERMISSIONS: PermissionCode[] = [
  'content:read',
  'content:preview',
  'tests:attempt',
  'doubts:ask',
];

const PAID_SEE_PERMISSIONS: PermissionCode[] = [
  ...BASE_STUDENT_PERMISSIONS,
  'live:attend',
  'ai:vision_marker',
  'ai:tutor_unlimited',
];

const PAID_CEE_PERMISSIONS: PermissionCode[] = [
  ...BASE_STUDENT_PERMISSIONS,
  'live:attend',
  'ai:tutor_unlimited',
];

const ALL_ACCESS_PERMISSIONS: PermissionCode[] = [
  ...BASE_STUDENT_PERMISSIONS,
  'live:attend',
  'ai:vision_marker',
  'ai:tutor_unlimited',
];

const TEACHER_PERMISSIONS: PermissionCode[] = [
  ...ALL_ACCESS_PERMISSIONS,
  'live:host',
  'live:record',
  'content:create',
  'content:edit',
  'content:publish',
  'tests:create',
  'tests:grade',
  'tests:publish',
  'doubts:answer',
];

const CONTENT_MANAGER_PERMISSIONS: PermissionCode[] = [
  'content:read',
  'content:create',
  'content:edit',
  'content:delete',
  'content:publish',
  'content:archive',
  'tests:create',
  'tests:publish',
];

const SUPPORT_STAFF_PERMISSIONS: PermissionCode[] = [
  'content:read',
  'users:view',
  'doubts:answer',
];

/**
 * Strict Payment Staff Boundary:
 * Restricted to finance, payments, orders, and manual enrollment management.
 * Explicitly omitted: academic content authoring, test grading, user role changes, platform settings.
 */
const PAYMENT_STAFF_PERMISSIONS: PermissionCode[] = [
  'admin:access',
  'orders:view',
  'orders:create',
  'orders:refund',
  'orders:verify',
  'enrollments:manage',
  'coupons:manage',
  'users:view',
];

const ADMIN_PERMISSIONS: PermissionCode[] = [
  ...TEACHER_PERMISSIONS,
  ...CONTENT_MANAGER_PERMISSIONS,
  ...SUPPORT_STAFF_PERMISSIONS,
  ...PAYMENT_STAFF_PERMISSIONS,
  'admin:access',
  'users:edit',
  'coupons:manage',
  'orders:create',
  'orders:refund',
  'orders:verify',
  'enrollments:manage',
  'settings:manage',
  'announcements:manage',
  'audit:view',
];

const SUPER_ADMIN_PERMISSIONS: PermissionCode[] = [
  ...ADMIN_PERMISSIONS,
  'users:assign_role',
];

export const ROLE_PERMISSIONS: Record<UserRoleType, Set<PermissionCode>> = {
  visitor: new Set(['content:preview']),
  student_free: new Set(BASE_STUDENT_PERMISSIONS),
  student_paid_see: new Set(PAID_SEE_PERMISSIONS),
  student_paid_cee: new Set(PAID_CEE_PERMISSIONS),
  student_all_access: new Set(ALL_ACCESS_PERMISSIONS),
  support_staff: new Set(SUPPORT_STAFF_PERMISSIONS),
  payment_staff: new Set(PAYMENT_STAFF_PERMISSIONS),
  content_manager: new Set(CONTENT_MANAGER_PERMISSIONS),
  teacher: new Set(TEACHER_PERMISSIONS),
  admin: new Set(ADMIN_PERMISSIONS),
  super_admin: new Set(SUPER_ADMIN_PERMISSIONS),
};

/**
 * Checks whether a given role is granted a specific permission.
 */
export function hasPermission(role: UserRoleType | undefined | null, permission: PermissionCode): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.has(permission) : false;
}

/**
 * Checks whether a student has active enrollment in a course.
 */
export function canAccessCourse(
  role: UserRoleType,
  enrolledCourseSlugs: CanonicalCourseSlug[],
  targetCourse: CanonicalCourseSlug
): boolean {
  if (role === 'super_admin' || role === 'admin' || role === 'teacher') return true;
  if (role === 'student_all_access') return true;
  if (targetCourse === 'see_class_10' && role === 'student_paid_see') return true;
  if (targetCourse === 'cee_medical' && role === 'student_paid_cee') return true;
  return enrolledCourseSlugs.includes(targetCourse);
}

/**
 * Normalizes any raw database role string or alias into a canonical UserRoleType.
 */
export function normalizeRoleType(
  rawRole?: string | null,
  isAdminFlag?: boolean
): UserRoleType {
  const r = (rawRole || '').toLowerCase().trim();
  if (r === 'super_admin' || r === 'super_administrator') return 'super_admin';
  if (isAdminFlag || r === 'admin' || r === 'administrator') return 'admin';
  if (r === 'teacher' || r === 'faculty' || r === 'instructor') return 'teacher';
  if (r === 'content_manager' || r === 'content_reviewer') return 'content_manager';
  if (r === 'payment_staff' || r === 'finance_staff') return 'payment_staff';
  if (r === 'support_staff' || r === 'support_agent' || r === 'support') return 'support_staff';
  if (r === 'student_all_access') return 'student_all_access';
  if (r === 'student_paid_cee') return 'student_paid_cee';
  if (r === 'student_paid_see') return 'student_paid_see';
  if (r === 'student_free' || r === 'student') return 'student_free';
  return 'visitor';
}

/**
 * Convenience role classifiers
 */
export function isTeacher(role?: UserRoleType | null): boolean {
  return role === 'teacher' || role === 'admin' || role === 'super_admin';
}

export function isAdmin(role?: UserRoleType | null): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function isSuperAdmin(role?: UserRoleType | null): boolean {
  return role === 'super_admin';
}

export function isPaymentStaff(role?: UserRoleType | null): boolean {
  return role === 'payment_staff' || role === 'admin' || role === 'super_admin';
}

export function isSupportStaff(role?: UserRoleType | null): boolean {
  return role === 'support_staff' || role === 'admin' || role === 'super_admin';
}

export function isStaffRole(role?: UserRoleType | null): boolean {
  return (
    role === 'support_staff' ||
    role === 'payment_staff' ||
    role === 'content_manager' ||
    role === 'teacher' ||
    role === 'admin' ||
    role === 'super_admin'
  );
}

export function canManageAcademicContent(role?: UserRoleType | null): boolean {
  return hasPermission(role, 'content:edit') || hasPermission(role, 'tests:create');
}

export function canManageFinance(role?: UserRoleType | null): boolean {
  return hasPermission(role, 'orders:verify') || hasPermission(role, 'orders:refund');
}

