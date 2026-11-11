/**
 * Samyak Tutor LMS — Centralized Audit Trail Service
 * Records, preserves, and queries administrative actions and high-risk operations.
 */

import crypto from 'crypto';
import { createAdminClient } from '../supabase/admin';
import { AuditLog } from '@/types/lms';

export interface RecordAuditInput {
  actorId: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  changesDiff?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQueryOptions {
  page?: number;
  limit?: number;
  actorId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Computes an immutable HMAC-SHA256 seal for an audit event.
 * Detects post-facto database alterations or unauthorized edits.
 */
export function computeAuditSeal(
  entry: {
    actorId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    timestamp: string;
    changesDiff?: Record<string, any>;
  },
  secretKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY || 'samyak_audit_master_seal'
): string {
  const cleanDiff = { ...(entry.changesDiff || {}) };
  delete cleanDiff.audit_seal;

  const canonical = [
    entry.timestamp,
    entry.actorId,
    entry.action,
    entry.resourceType,
    entry.resourceId || 'global',
    JSON.stringify(cleanDiff),
  ].join('|');

  return crypto.createHmac('sha256', secretKey).update(canonical).digest('hex');
}

// Canonical Audit Action Constants
export const AUDIT_ACTIONS = {
  ROLE_ASSIGN: 'role_assign',
  ENROLLMENT_GRANT: 'enrollment_grant',
  ENROLLMENT_REVOKE: 'enrollment_revoke',
  ORDER_VERIFY: 'order_verify',
  ORDER_REFUND: 'order_refund',
  CONTENT_PUBLISH: 'content_publish',
  CONTENT_ARCHIVE: 'content_archive',
  TEST_CREATE: 'test_create',
  TEST_PUBLISH: 'test_publish',
  TEST_RESULT_MODIFY: 'test_result_modify',
  SETTINGS_UPDATE: 'settings_update',
  ANNOUNCEMENT_BROADCAST: 'announcement_broadcast',
  COUPON_CREATE: 'coupon_create',
  DOUBT_RESOLVE: 'doubt_resolve',
  IMPERSONATION_START: 'admin_impersonate_start',
  IMPERSONATION_EXIT: 'admin_impersonate_exit',
  IMPERSONATION_BLOCKED: 'admin_impersonate_sensitive_action_blocked',
} as const;

// In-memory buffer for high-performance retrieval and offline/test resilience
const inMemoryAuditBuffer: AuditLog[] = [];
const MAX_BUFFER_SIZE = 200;

export class AuditService {
  /**
   * Records an audit event for administrative operations with cryptographic sealing.
   */
  static async recordAuditEvent(input: RecordAuditInput): Promise<{ success: boolean; logId?: string; auditSeal?: string; error?: string }> {
    const timestamp = new Date().toISOString();
    const fallbackId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'samyak_audit_master_seal';

    const auditSeal = computeAuditSeal({
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      timestamp,
      changesDiff: {
        ...(input.changesDiff || {}),
        actor_email: input.actorEmail,
      },
    }, secret);

    const logEntry: AuditLog = {
      id: fallbackId,
      actor_id: input.actorId,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId || 'global',
      changes_diff: {
        ...(input.changesDiff || {}),
        actor_email: input.actorEmail,
        audit_seal: auditSeal,
      },
      ip_address: input.ipAddress || 'internal',
      user_agent: input.userAgent || 'server-api',
      created_at: timestamp,
    };

    // 1. Maintain in-memory ring buffer (most recent first)
    inMemoryAuditBuffer.unshift(logEntry);
    if (inMemoryAuditBuffer.length > MAX_BUFFER_SIZE) {
      inMemoryAuditBuffer.pop();
    }

    // 2. Persist to Supabase if client is available
    try {
      const admin = createAdminClient();
      if (admin) {
        const { data, error } = await admin
          .from('audit_logs')
          .insert({
            actor_id: input.actorId,
            action: input.action,
            resource_type: input.resourceType,
            resource_id: input.resourceId || 'global',
            changes_diff: logEntry.changes_diff,
            ip_address: input.ipAddress,
            user_agent: input.userAgent,
            created_at: timestamp,
          })
          .select('id')
          .single();

        if (!error && data?.id) {
          logEntry.id = data.id;
          return { success: true, logId: data.id, auditSeal };
        }
      }
    } catch (err: any) {
      console.warn('[AuditService] Supabase write failed, retained in memory buffer:', err?.message);
    }

    return { success: true, logId: fallbackId, auditSeal };
  }

  /**
   * Verifies the cryptographic integrity seal of an audit record.
   * Detects database tampering or retroactive log alterations.
   */
  static verifyAuditIntegrity(
    log: AuditLog,
    secretKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY || 'samyak_audit_master_seal'
  ): { valid: boolean; error?: string } {
    if (!log) return { valid: false, error: 'Empty audit log record' };
    const storedSeal = log.changes_diff?.audit_seal;
    if (!storedSeal) {
      return { valid: false, error: 'Audit record lacks cryptographic seal' };
    }

    const expectedSeal = computeAuditSeal({
      actorId: log.actor_id,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      timestamp: log.created_at,
      changesDiff: log.changes_diff,
    }, secretKey);

    const isMatch = storedSeal === expectedSeal;
    return {
      valid: isMatch,
      error: isMatch ? undefined : 'Audit log integrity check failed: record has been tampered with or modified',
    };
  }

  /**
   * Queries paginated audit logs with search filters.
   */
  static async queryAuditLogs(options: AuditQueryOptions = {}): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    try {
      const admin = createAdminClient();
      if (admin) {
        let query = admin
          .from('audit_logs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (options.actorId) query = query.eq('actor_id', options.actorId);
        if (options.action) query = query.eq('action', options.action);
        if (options.resourceType) query = query.eq('resource_type', options.resourceType);
        if (options.startDate) query = query.gte('created_at', options.startDate);
        if (options.endDate) query = query.lte('created_at', options.endDate);

        const { data, count, error } = await query.range(offset, offset + limit - 1);

        if (!error && data && data.length > 0) {
          return {
            logs: data as AuditLog[],
            total: count || data.length,
            page,
            limit,
          };
        }
      }
    } catch (err) {
      console.warn('[AuditService] Querying Supabase audit_logs failed, falling back to memory buffer');
    }

    // Fallback filter over in-memory buffer
    let filtered = [...inMemoryAuditBuffer];
    if (options.actorId) filtered = filtered.filter((l) => l.actor_id === options.actorId);
    if (options.action) filtered = filtered.filter((l) => l.action === options.action);
    if (options.resourceType) filtered = filtered.filter((l) => l.resource_type === options.resourceType);
    if (options.startDate) filtered = filtered.filter((l) => l.created_at >= (options.startDate as string));
    if (options.endDate) filtered = filtered.filter((l) => l.created_at <= (options.endDate as string));

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      logs: paginated,
      total,
      page,
      limit,
    };
  }

  /**
   * Helper for tests to clear the in-memory buffer.
   */
  static _clearMemoryBuffer(): void {
    inMemoryAuditBuffer.length = 0;
  }

  /**
   * Helper for tests to inspect in-memory buffer.
   */
  static _getMemoryBuffer(): AuditLog[] {
    return [...inMemoryAuditBuffer];
  }
}
