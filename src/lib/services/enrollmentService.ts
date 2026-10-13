/**
 * Samyak Tutor LMS — Authoritative Enrollment Service
 * Manages the canonical chain: User → Purchase/Manual Grant → Course → Batch → Access Period.
 */

import { createAdminClient } from '../supabase/admin';
import { CanonicalCourseSlug, Enrollment } from '../../types/lms';
import { normalizeCourseSlug, evaluateAccessContext, AccessContext } from '../auth/accessControl';
import { AuditService } from './auditService';

export interface GrantEnrollmentInput {
  userId: string;
  courseSlug: CanonicalCourseSlug;
  batchId?: string;
  accessPeriodDays?: number; // Default 365 days
  planTier?: 'free_starter' | 'course_pass' | 'pro_pass' | 'all_access';
  grantType: 'purchase' | 'manual_admin' | 'scholarship';
  orderId?: string;
  adminUserId?: string;
  notes?: string;
}

export interface RevokeEnrollmentInput {
  enrollmentId: string;
  adminUserId: string;
  reason: string;
}

export class EnrollmentService {
  /**
   * Connects: User → Purchase/Manual Grant → Course → Batch → Access Period.
   */
  static async grantEnrollment(input: GrantEnrollmentInput): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
    const admin = createAdminClient();
    if (!admin) return { success: false, error: 'Database client unconfigured' };

    const {
      userId,
      courseSlug,
      batchId,
      accessPeriodDays = 365,
      planTier = 'course_pass',
      grantType,
      orderId,
      adminUserId,
      notes,
    } = input;

    const startsAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + accessPeriodDays * 24 * 60 * 60 * 1000).toISOString();

    try {
      // 1. Always activate subscription in user_profiles
      await admin
        .from('user_profiles')
        .update({
          subscription_plan: 'pro',
          subscription_expires_at: expiresAt,
          updated_at: startsAt,
        })
        .eq('id', userId);

      // 2. Record in subscriptions table for expiry and billing tracking
      await admin
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'pro',
          status: 'active',
          started_at: startsAt,
          expires_at: expiresAt,
          payment_reference: orderId || `grant_${grantType}`,
          created_at: startsAt,
          updated_at: startsAt,
        });

      // 3. Link to batch_enrollments if batchId is provided
      if (batchId) {
        await admin
          .from('batch_enrollments')
          .upsert({
            batch_id: batchId,
            student_id: userId,
            enrolled_at: startsAt,
          });
      }

      // 4. Best-effort sync to legacy enrollments table if possible
      let createdEnrollmentId = `enr_${Date.now()}`;
      try {
        const { data: enrData, error: enrErr } = await admin
          .from('enrollments')
          .insert({
            student_id: userId,
            course_id: courseSlug,
            total_price: 1,
            amount_paid: 1,
            remaining_amount: 0,
            enrollment_status: 'PAID',
            created_at: startsAt,
            updated_at: startsAt,
          })
          .select('id')
          .maybeSingle();

        if (enrData?.id) {
          createdEnrollmentId = enrData.id;
        } else if (enrErr) {
          console.warn('[EnrollmentService] Legacy enrollments table insert note:', enrErr.message);
        }
      } catch (legacyErr: any) {
        console.warn('[EnrollmentService] Legacy enrollments table skipped:', legacyErr?.message);
      }

      // 5. Log audit trail safely via AuditService
      if (adminUserId) {
        await AuditService.recordAuditEvent({
          actorId: adminUserId,
          action: 'grant_enrollment',
          resourceType: 'enrollment',
          resourceId: createdEnrollmentId,
          changesDiff: {
            target_user_id: userId,
            course_slug: courseSlug,
            batch_id: batchId,
            grant_type: grantType,
            access_period_days: accessPeriodDays,
            notes,
          },
        });
      }

      return { success: true, enrollmentId: createdEnrollmentId };
    } catch (err: any) {
      console.error('EnrollmentService.grantEnrollment exception:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Revokes or refunds an active enrollment.
   */
  static async revokeEnrollment(input: RevokeEnrollmentInput): Promise<{ success: boolean; error?: string }> {
    const admin = createAdminClient();
    if (!admin) return { success: false, error: 'Database client unconfigured' };

    const { enrollmentId, adminUserId, reason } = input;
    const now = new Date().toISOString();

    try {
      // Find who holds this enrollment if in enrollments table
      let targetStudentId = '';
      const { data: enrRow } = await admin
        .from('enrollments')
        .select('student_id')
        .eq('id', enrollmentId)
        .maybeSingle();

      if (enrRow?.student_id) {
        targetStudentId = enrRow.student_id;
        await admin
          .from('enrollments')
          .update({
            enrollment_status: 'CANCELLED',
            updated_at: now,
          })
          .eq('id', enrollmentId);
      }

      // If enrollmentId is a student user ID directly
      if (!targetStudentId) {
        targetStudentId = enrollmentId;
      }

      if (targetStudentId) {
        await admin
          .from('user_profiles')
          .update({
            subscription_plan: 'free',
            subscription_expires_at: null,
            updated_at: now,
          })
          .eq('id', targetStudentId);

        await admin
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: now,
          })
          .eq('user_id', targetStudentId);
      }

      // Log safely via AuditService
      await AuditService.recordAuditEvent({
        actorId: adminUserId,
        action: 'revoke_enrollment',
        resourceType: 'enrollment',
        resourceId: enrollmentId,
        changesDiff: { reason, revoked_user_id: targetStudentId },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetches complete access context for a user directly from Supabase.
   */
  static async getStudentAccess(userId: string): Promise<AccessContext> {
    const admin = createAdminClient();
    if (!admin) {
      return evaluateAccessContext(null);
    }

    try {
      const [userRes, profRes, enrollRes, subRes] = await Promise.all([
        admin.auth.admin.getUserById(userId),
        admin.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
        admin.from('enrollments').select('*').eq('student_id', userId),
        admin.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      const user = userRes.data?.user ? { id: userRes.data.user.id, email: userRes.data.user.email } : null;
      const profile = profRes.data || null;
      const enrollments = enrollRes.data || [];

      // Combine with subscription expiry dates
      const combinedEnrollments = enrollments.map((e: any) => {
        const sub = (subRes.data || []).find((s: any) => s.user_id === userId);
        return {
          ...e,
          expires_at: sub?.expires_at || profile?.subscription_expires_at,
          starts_at: sub?.started_at || e.created_at,
        };
      });

      return evaluateAccessContext(user, profile, combinedEnrollments);
    } catch (err) {
      console.error('EnrollmentService.getStudentAccess error:', err);
      return evaluateAccessContext({ id: userId });
    }
  }
}
