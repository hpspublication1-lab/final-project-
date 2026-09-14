import { describe, it, expect, beforeEach } from 'vitest';
import {
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  hasPermission,
  isPaymentStaff,
  isTeacher,
  isAdmin,
  isSuperAdmin,
  canManageFinance,
  canManageAcademicContent,
} from '../rbac';
import { AuditService, AUDIT_ACTIONS } from '../../services/auditService';
import { checkDuplicateSubmission } from '../serverGuard';

describe('Operational Administration & Teacher RBAC Engine', () => {
  beforeEach(() => {
    AuditService._clearMemoryBuffer();
  });

  describe('1. Role Hierarchy & Privilege Definitions', () => {
    it('enforces canonical role hierarchy levels', () => {
      expect(ROLE_HIERARCHY.visitor).toBe(0);
      expect(ROLE_HIERARCHY.student_free).toBe(10);
      expect(ROLE_HIERARCHY.student_paid_see).toBe(20);
      expect(ROLE_HIERARCHY.student_paid_cee).toBe(20);
      expect(ROLE_HIERARCHY.student_all_access).toBe(30);
      expect(ROLE_HIERARCHY.support_staff).toBe(50);
      expect(ROLE_HIERARCHY.payment_staff).toBe(55);
      expect(ROLE_HIERARCHY.content_manager).toBe(60);
      expect(ROLE_HIERARCHY.teacher).toBe(70);
      expect(ROLE_HIERARCHY.admin).toBe(90);
      expect(ROLE_HIERARCHY.super_admin).toBe(100);
    });

    it('identifies role categories via convenience classifiers', () => {
      expect(isPaymentStaff('payment_staff')).toBe(true);
      expect(isPaymentStaff('admin')).toBe(true);
      expect(isPaymentStaff('super_admin')).toBe(true);
      expect(isPaymentStaff('teacher')).toBe(false);
      expect(isPaymentStaff('student_free')).toBe(false);

      expect(isTeacher('teacher')).toBe(true);
      expect(isTeacher('admin')).toBe(true);
      expect(isTeacher('super_admin')).toBe(true);
      expect(isTeacher('payment_staff')).toBe(false);

      expect(isAdmin('admin')).toBe(true);
      expect(isAdmin('super_admin')).toBe(true);
      expect(isAdmin('payment_staff')).toBe(false);

      expect(isSuperAdmin('super_admin')).toBe(true);
      expect(isSuperAdmin('admin')).toBe(false);
    });
  });

  describe('2. Strict Payment Staff Boundary', () => {
    it('grants financial and enrollment permissions to payment_staff', () => {
      expect(hasPermission('payment_staff', 'admin:access')).toBe(true);
      expect(hasPermission('payment_staff', 'orders:view')).toBe(true);
      expect(hasPermission('payment_staff', 'orders:create')).toBe(true);
      expect(hasPermission('payment_staff', 'orders:verify')).toBe(true);
      expect(hasPermission('payment_staff', 'orders:refund')).toBe(true);
      expect(hasPermission('payment_staff', 'enrollments:manage')).toBe(true);
      expect(hasPermission('payment_staff', 'coupons:manage')).toBe(true);
      expect(hasPermission('payment_staff', 'users:view')).toBe(true);
      expect(canManageFinance('payment_staff')).toBe(true);
    });

    it('STRICTLY BLOCKS payment_staff from academic content authoring and test grading', () => {
      expect(hasPermission('payment_staff', 'content:create')).toBe(false);
      expect(hasPermission('payment_staff', 'content:edit')).toBe(false);
      expect(hasPermission('payment_staff', 'content:delete')).toBe(false);
      expect(hasPermission('payment_staff', 'content:publish')).toBe(false);
      expect(hasPermission('payment_staff', 'content:archive')).toBe(false);
      expect(hasPermission('payment_staff', 'tests:create')).toBe(false);
      expect(hasPermission('payment_staff', 'tests:grade')).toBe(false);
      expect(hasPermission('payment_staff', 'tests:publish')).toBe(false);
      expect(hasPermission('payment_staff', 'live:host')).toBe(false);
      expect(canManageAcademicContent('payment_staff')).toBe(false);
    });

    it('STRICTLY BLOCKS payment_staff from role assignment and platform settings', () => {
      expect(hasPermission('payment_staff', 'users:assign_role')).toBe(false);
      expect(hasPermission('payment_staff', 'settings:manage')).toBe(false);
    });
  });

  describe('3. Role Assignment Security (users:assign_role)', () => {
    it('only super_admin possesses users:assign_role permission', () => {
      expect(hasPermission('super_admin', 'users:assign_role')).toBe(true);
      expect(hasPermission('admin', 'users:assign_role')).toBe(false);
      expect(hasPermission('payment_staff', 'users:assign_role')).toBe(false);
      expect(hasPermission('teacher', 'users:assign_role')).toBe(false);
      expect(hasPermission('content_manager', 'users:assign_role')).toBe(false);
      expect(hasPermission('student_free', 'users:assign_role')).toBe(false);
    });
  });

  describe('4. Central Audit Trail & Logging', () => {
    it('records and queries audit events accurately', async () => {
      const record = await AuditService.recordAuditEvent({
        actorId: 'usr_admin_1',
        actorEmail: 'admin@samyak.edu.np',
        action: AUDIT_ACTIONS.ROLE_ASSIGN,
        resourceType: 'user_role',
        resourceId: 'usr_teacher_9',
        changesDiff: {
          previousRole: 'student_free',
          newRole: 'teacher',
        },
      });

      expect(record.success).toBe(true);
      expect(record.logId).toBeDefined();

      const query = await AuditService.queryAuditLogs({
        action: AUDIT_ACTIONS.ROLE_ASSIGN,
      });

      expect(query.total).toBe(1);
      expect(query.logs[0].action).toBe(AUDIT_ACTIONS.ROLE_ASSIGN);
      expect(query.logs[0].actor_id).toBe('usr_admin_1');
      expect(query.logs[0].changes_diff?.newRole).toBe('teacher');
    });

    it('filters audit logs by action and resource type', async () => {
      await AuditService.recordAuditEvent({
        actorId: 'usr_staff_1',
        action: AUDIT_ACTIONS.ORDER_VERIFY,
        resourceType: 'order',
        resourceId: 'ord_123',
      });

      await AuditService.recordAuditEvent({
        actorId: 'usr_admin_1',
        action: AUDIT_ACTIONS.ENROLLMENT_GRANT,
        resourceType: 'enrollment',
        resourceId: 'enr_456',
      });

      const orderLogs = await AuditService.queryAuditLogs({ action: AUDIT_ACTIONS.ORDER_VERIFY });
      expect(orderLogs.total).toBe(1);
      expect(orderLogs.logs[0].resource_id).toBe('ord_123');

      const enrollmentLogs = await AuditService.queryAuditLogs({ action: AUDIT_ACTIONS.ENROLLMENT_GRANT });
      expect(enrollmentLogs.total).toBe(1);
      expect(enrollmentLogs.logs[0].resource_id).toBe('enr_456');
    });
  });

  describe('5. Duplicate Submission Prevention', () => {
    it('blocks rapid duplicate requests with identical action keys', () => {
      const key = `action_test_${Date.now()}`;
      // First submission is accepted
      const isFirstDuplicate = checkDuplicateSubmission(key, 2000);
      expect(isFirstDuplicate).toBe(false);

      // Immediate second submission is blocked
      const isSecondDuplicate = checkDuplicateSubmission(key, 2000);
      expect(isSecondDuplicate).toBe(true);
    });

    it('allows distinct action keys independently', () => {
      const keyA = `action_a_${Date.now()}`;
      const keyB = `action_b_${Date.now()}`;

      expect(checkDuplicateSubmission(keyA, 2000)).toBe(false);
      expect(checkDuplicateSubmission(keyB, 2000)).toBe(false);
    });
  });

  describe('6. Content & Assessment Permissions Matrix', () => {
    it('allows teachers to author questions and grade tests', () => {
      expect(hasPermission('teacher', 'tests:create')).toBe(true);
      expect(hasPermission('teacher', 'tests:grade')).toBe(true);
      expect(hasPermission('teacher', 'content:create')).toBe(true);
      expect(hasPermission('teacher', 'content:edit')).toBe(true);
      expect(hasPermission('teacher', 'doubts:answer')).toBe(true);
      expect(hasPermission('teacher', 'live:host')).toBe(true);
    });

    it('blocks regular students from authoring tests or grading', () => {
      expect(hasPermission('student_free', 'tests:create')).toBe(false);
      expect(hasPermission('student_free', 'tests:grade')).toBe(false);
      expect(hasPermission('student_paid_cee', 'tests:create')).toBe(false);
      expect(hasPermission('student_all_access', 'tests:grade')).toBe(false);
    });
  });
});
