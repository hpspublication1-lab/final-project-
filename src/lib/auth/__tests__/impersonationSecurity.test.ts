import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  computeImpersonationSeal,
  validateImpersonationStart,
  parseAndVerifyImpersonationCookie,
  getActiveImpersonationSession,
  blockSensitiveActionDuringImpersonation,
  IMPERSONATION_COOKIE_NAME,
  DEFAULT_IMPERSONATION_MINUTES,
  MAX_IMPERSONATION_MINUTES,
  MIN_IMPERSONATION_MINUTES,
  ImpersonationSession,
} from '../impersonationGuard';
import {
  AuditService,
  AUDIT_ACTIONS,
  computeAuditSeal,
} from '@/lib/services/auditService';

describe('Admin Impersonation and Privileged Operations Security', () => {
  const secretKey = 'test_secret_key_for_impersonation_audit_123';
  const adminUser = {
    id: 'admin_usr_001',
    email: 'secops@samyakcee.com',
    last_sign_in_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago (fresh)
  };

  describe('1. Justification Reason & Parameter Validation', () => {
    it('should reject impersonation when studentId is missing or empty', () => {
      const res = validateImpersonationStart({
        studentId: '',
        reason: 'Investigating exam grading discrepancy reported via ticket',
        adminUser,
      });

      expect(res.valid).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.error).toMatch(/Student target ID is required/i);
    });

    it('should reject self-impersonation to prevent privilege confusion', () => {
      const res = validateImpersonationStart({
        studentId: 'admin_usr_001', // Same as admin ID
        reason: 'Testing admin permissions',
        adminUser,
      });

      expect(res.valid).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.error).toMatch(/cannot impersonate their own administrative accounts/i);
    });

    it('should reject impersonation without a justified reason', () => {
      const res = validateImpersonationStart({
        studentId: 'student_usr_999',
        reason: '',
        adminUser,
      });

      expect(res.valid).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.error).toMatch(/justified reason/i);
    });

    it('should reject justification reasons shorter than 5 characters', () => {
      const res = validateImpersonationStart({
        studentId: 'student_usr_999',
        reason: 'test',
        adminUser,
      });

      expect(res.valid).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.error).toMatch(/minimum 5 characters/i);
    });

    it('should accept valid impersonation start with reason and support ticket ID', () => {
      const res = validateImpersonationStart(
        {
          studentId: 'student_usr_999',
          studentName: 'Aarav Sharma',
          studentEmail: 'aarav@gmail.com',
          reason: 'Diagnosing exam question loading failure on CEE Mock 4',
          ticketId: 'SUP-4921',
          adminUser,
        },
        { secretKey }
      );

      expect(res.valid).toBe(true);
      expect(res.statusCode).toBe(200);
      expect(res.session).toBeDefined();
      expect(res.session?.studentId).toBe('student_usr_999');
      expect(res.session?.adminId).toBe('admin_usr_001');
      expect(res.session?.reason).toBe('Diagnosing exam question loading failure on CEE Mock 4');
      expect(res.session?.ticketId).toBe('SUP-4921');
      expect(res.session?.readOnly).toBe(true);
      expect(res.session?.auditSeal).toBeDefined();
    });
  });

  describe('2. Strict Time Limits & Expiration Bounding', () => {
    it('should default to 15 minutes when duration is omitted', () => {
      const now = 1700000000000;
      const res = validateImpersonationStart(
        {
          studentId: 'student_usr_999',
          reason: 'Troubleshooting offline cache sync issue',
          adminUser,
        },
        { nowMs: now, secretKey }
      );

      expect(res.valid).toBe(true);
      expect(res.session?.maxDurationMinutes).toBe(DEFAULT_IMPERSONATION_MINUTES);
      expect(res.session?.startedAt).toBe(now);
      expect(res.session?.expiresAt).toBe(now + 15 * 60 * 1000);
    });

    it('should clamp duration to minimum 5 minutes if smaller duration is requested', () => {
      const now = 1700000000000;
      const res = validateImpersonationStart(
        {
          studentId: 'student_usr_999',
          reason: 'Quick diagnostic check',
          durationMinutes: 1, // < MIN (5)
          adminUser,
        },
        { nowMs: now, secretKey }
      );

      expect(res.valid).toBe(true);
      expect(res.session?.maxDurationMinutes).toBe(MIN_IMPERSONATION_MINUTES);
      expect(res.session?.expiresAt).toBe(now + 5 * 60 * 1000);
    });

    it('should clamp duration to maximum 30 minutes if excessive duration is requested', () => {
      const now = 1700000000000;
      const res = validateImpersonationStart(
        {
          studentId: 'student_usr_999',
          reason: 'Extended investigation of payment logs and mock exam results',
          durationMinutes: 120, // > MAX (30)
          adminUser,
        },
        { nowMs: now, secretKey }
      );

      expect(res.valid).toBe(true);
      expect(res.session?.maxDurationMinutes).toBe(MAX_IMPERSONATION_MINUTES);
      expect(res.session?.expiresAt).toBe(now + 30 * 60 * 1000);
    });
  });

  describe('3. Fresh Authentication & MFA Enforcement', () => {
    it('should reject impersonation when admin session is stale (> 60 mins) and MFA is not confirmed', () => {
      const staleAdmin = {
        id: 'admin_usr_001',
        email: 'secops@samyakcee.com',
        last_sign_in_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 90 mins ago
      };

      const res = validateImpersonationStart({
        studentId: 'student_usr_999',
        reason: 'Investigating billing transaction discrepancy',
        adminUser: staleAdmin,
        mfaConfirmed: false,
      });

      expect(res.valid).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(res.error).toMatch(/Fresh authentication required/i);
    });

    it('should allow impersonation with stale session when MFA is confirmed', () => {
      const staleAdmin = {
        id: 'admin_usr_001',
        email: 'secops@samyakcee.com',
        last_sign_in_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      };

      const res = validateImpersonationStart(
        {
          studentId: 'student_usr_999',
          reason: 'Investigating billing transaction discrepancy',
          adminUser: staleAdmin,
          mfaConfirmed: true, // MFA confirmed
        },
        { secretKey }
      );

      expect(res.valid).toBe(true);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('4. Cryptographic HMAC-SHA256 Cookie Seals & Tamper Resistance', () => {
    it('should verify a valid cryptographically sealed cookie', () => {
      const now = Date.now();
      const sessionData: Omit<ImpersonationSession, 'auditSeal'> = {
        active: true,
        impersonationId: 'imp_1700000_abcd',
        studentId: 'student_123',
        studentName: 'Suman Shrestha',
        studentEmail: 'suman@example.com',
        adminId: 'admin_usr_001',
        adminEmail: 'secops@samyakcee.com',
        reason: 'Verifying course access unlock',
        startedAt: now,
        expiresAt: now + 15 * 60 * 1000,
        maxDurationMinutes: 15,
        readOnly: true,
      };

      const auditSeal = computeImpersonationSeal(sessionData, secretKey);
      const fullSession: ImpersonationSession = { ...sessionData, auditSeal };

      const cookieVal = JSON.stringify(fullSession);
      const parsed = parseAndVerifyImpersonationCookie(cookieVal, { secretKey, nowMs: now });

      expect(parsed.active).toBe(true);
      expect(parsed.reason).toBe('valid');
      expect(parsed.session?.studentId).toBe('student_123');
      expect(parsed.remainingSeconds).toBeGreaterThan(0);
    });

    it('should detect and reject tampered studentId in impersonation cookie', () => {
      const now = Date.now();
      const sessionData: Omit<ImpersonationSession, 'auditSeal'> = {
        active: true,
        impersonationId: 'imp_1700000_abcd',
        studentId: 'student_123',
        studentName: 'Suman Shrestha',
        studentEmail: 'suman@example.com',
        adminId: 'admin_usr_001',
        adminEmail: 'secops@samyakcee.com',
        reason: 'Verifying course access unlock',
        startedAt: now,
        expiresAt: now + 15 * 60 * 1000,
        maxDurationMinutes: 15,
        readOnly: true,
      };

      const auditSeal = computeImpersonationSeal(sessionData, secretKey);
      // Attacker tampers studentId from 'student_123' to 'target_victim_456'
      const tamperedSession = {
        ...sessionData,
        studentId: 'target_victim_456',
        auditSeal,
      };

      const cookieVal = JSON.stringify(tamperedSession);
      const parsed = parseAndVerifyImpersonationCookie(cookieVal, { secretKey, nowMs: now });

      expect(parsed.active).toBe(false);
      expect(parsed.reason).toBe('tampered');
      expect(parsed.error).toMatch(/signature verification failed/i);
    });

    it('should detect and reject session that has passed expiresAt', () => {
      const startedAt = 1700000000000;
      const expiresAt = startedAt + 15 * 60 * 1000;
      const sessionData: Omit<ImpersonationSession, 'auditSeal'> = {
        active: true,
        impersonationId: 'imp_1700000_abcd',
        studentId: 'student_123',
        studentName: 'Suman',
        studentEmail: 'suman@example.com',
        adminId: 'admin_usr_001',
        adminEmail: 'secops@samyakcee.com',
        reason: 'Exam inspection',
        startedAt,
        expiresAt,
        maxDurationMinutes: 15,
        readOnly: true,
      };

      const auditSeal = computeImpersonationSeal(sessionData, secretKey);
      const fullSession: ImpersonationSession = { ...sessionData, auditSeal };

      const cookieVal = JSON.stringify(fullSession);
      // Simulate verification 1 minute after expiry
      const parsed = parseAndVerifyImpersonationCookie(cookieVal, {
        secretKey,
        nowMs: expiresAt + 60 * 1000,
      });

      expect(parsed.active).toBe(false);
      expect(parsed.isExpired).toBe(true);
      expect(parsed.reason).toBe('expired');
    });

    it('should handle corrupted or non-JSON cookie gracefully', () => {
      const parsed = parseAndVerifyImpersonationCookie('invalid-not-json-cookie', { secretKey });
      expect(parsed.active).toBe(false);
      expect(parsed.reason).toBe('corrupted');
    });

    it('should handle empty or missing cookie gracefully', () => {
      const parsed = parseAndVerifyImpersonationCookie(null, { secretKey });
      expect(parsed.active).toBe(false);
      expect(parsed.reason).toBe('no_cookie');
    });
  });

  describe('5. Read-Only Enforcement & Sensitive Operation Blocking', () => {
    function makeMockRequestWithCookie(cookieJson: string | null): NextRequest {
      const req = new NextRequest('http://localhost:3000/api/exams/submit', {
        method: 'POST',
        headers: cookieJson
          ? { cookie: `${IMPERSONATION_COOKIE_NAME}=${encodeURIComponent(cookieJson)}` }
          : {},
      });
      return req;
    }

    it('should allow operations when no impersonation session exists', async () => {
      const req = makeMockRequestWithCookie(null);
      const blocked = await blockSensitiveActionDuringImpersonation(req, 'submit_examination');
      expect(blocked).toBeNull();
    });

    it('should block exam submission during active impersonation with HTTP 403', async () => {
      const now = Date.now();
      const sessionData = {
        active: true,
        impersonationId: 'imp_test_submit',
        studentId: 'student_victim',
        studentName: 'Target Student',
        studentEmail: 'target@example.com',
        adminId: 'admin_usr_001',
        adminEmail: 'secops@samyakcee.com',
        reason: 'Investigating student report of frozen exam screen',
        startedAt: now,
        expiresAt: now + 15 * 60 * 1000,
        maxDurationMinutes: 15,
        readOnly: true as const,
      };
      const auditSeal = computeImpersonationSeal(sessionData);
      const session: ImpersonationSession = { ...sessionData, auditSeal };

      const req = makeMockRequestWithCookie(JSON.stringify(session));
      const res = await blockSensitiveActionDuringImpersonation(req, 'submit_examination');

      expect(res).not.toBeNull();
      expect(res?.status).toBe(403);
      const data = await res?.json();
      expect(data.code).toBe('IMPERSONATION_READONLY_BLOCKED');
      expect(data.isImpersonating).toBe(true);
      expect(data.error).toMatch(/submit_examination.*strictly restricted to read-only diagnostics/i);
    });

    it('should block exam answer synchronization during active impersonation', async () => {
      const now = Date.now();
      const sessionData = {
        active: true,
        impersonationId: 'imp_test_sync',
        studentId: 'student_victim',
        studentName: 'Target Student',
        studentEmail: 'target@example.com',
        adminId: 'admin_usr_001',
        adminEmail: 'secops@samyakcee.com',
        reason: 'Verifying sync state',
        startedAt: now,
        expiresAt: now + 15 * 60 * 1000,
        maxDurationMinutes: 15,
        readOnly: true as const,
      };
      const auditSeal = computeImpersonationSeal(sessionData);
      const session: ImpersonationSession = { ...sessionData, auditSeal };

      const req = makeMockRequestWithCookie(JSON.stringify(session));
      const res = await blockSensitiveActionDuringImpersonation(req, 'sync_examination_answers');

      expect(res).not.toBeNull();
      expect(res?.status).toBe(403);
      const data = await res?.json();
      expect(data.code).toBe('IMPERSONATION_READONLY_BLOCKED');
    });

    it('should block payment initiation during active impersonation', async () => {
      const now = Date.now();
      const sessionData = {
        active: true,
        impersonationId: 'imp_test_payment',
        studentId: 'student_victim',
        studentName: 'Target Student',
        studentEmail: 'target@example.com',
        adminId: 'admin_usr_001',
        adminEmail: 'secops@samyakcee.com',
        reason: 'Inspecting billing checkout issue',
        startedAt: now,
        expiresAt: now + 15 * 60 * 1000,
        maxDurationMinutes: 15,
        readOnly: true as const,
      };
      const auditSeal = computeImpersonationSeal(sessionData);
      const session: ImpersonationSession = { ...sessionData, auditSeal };

      const req = makeMockRequestWithCookie(JSON.stringify(session));
      const res = await blockSensitiveActionDuringImpersonation(req, 'initiate_payment');

      expect(res).not.toBeNull();
      expect(res?.status).toBe(403);
      const data = await res?.json();
      expect(data.code).toBe('IMPERSONATION_READONLY_BLOCKED');
    });
  });

  describe('6. Tamper-Resistant Cryptographic Audit Trail', () => {
    it('should automatically compute and attach an HMAC-SHA256 audit seal to changes_diff', async () => {
      const record = await AuditService.recordAuditEvent({
        actorId: 'admin_usr_001',
        actorEmail: 'secops@samyakcee.com',
        action: AUDIT_ACTIONS.IMPERSONATION_START,
        resourceType: 'user_profiles',
        resourceId: 'student_usr_999',
        changesDiff: {
          impersonationId: 'imp_101',
          reason: 'Diagnosing SEE test result discrepancies',
          ticketId: 'SUP-9812',
        },
      });

      expect(record.success).toBe(true);
      expect(record.auditSeal).toBeDefined();
      expect(record.auditSeal?.length).toBe(64); // 64 hex characters for SHA-256
    });

    it('should verify integrity of an untampered audit log record', () => {
      const timestamp = new Date().toISOString();
      const cleanDiff = {
        reason: 'Routine security audit',
        actor_email: 'secops@samyakcee.com',
      };
      const seal = computeAuditSeal(
        {
          actorId: 'admin_usr_001',
          action: AUDIT_ACTIONS.IMPERSONATION_START,
          resourceType: 'user_profiles',
          resourceId: 'student_usr_999',
          timestamp,
          changesDiff: cleanDiff,
        },
        secretKey
      );

      const log = {
        id: 'audit_log_1',
        actor_id: 'admin_usr_001',
        action: AUDIT_ACTIONS.IMPERSONATION_START,
        resource_type: 'user_profiles',
        resource_id: 'student_usr_999',
        changes_diff: {
          ...cleanDiff,
          audit_seal: seal,
        },
        created_at: timestamp,
      };

      const verification = AuditService.verifyAuditIntegrity(log, secretKey);
      expect(verification.valid).toBe(true);
    });

    it('should detect post-facto tampering of audit log changes_diff', () => {
      const timestamp = new Date().toISOString();
      const cleanDiff = {
        reason: 'Authorized security inspection',
        actor_email: 'secops@samyakcee.com',
      };
      const seal = computeAuditSeal(
        {
          actorId: 'admin_usr_001',
          action: AUDIT_ACTIONS.IMPERSONATION_START,
          resourceType: 'user_profiles',
          resourceId: 'student_usr_999',
          timestamp,
          changesDiff: cleanDiff,
        },
        secretKey
      );

      // Malicious actor modifies reason in database without knowing secret key
      const tamperedLog = {
        id: 'audit_log_1',
        actor_id: 'admin_usr_001',
        action: AUDIT_ACTIONS.IMPERSONATION_START,
        resource_type: 'user_profiles',
        resource_id: 'student_usr_999',
        changes_diff: {
          reason: 'Tampered fake reason that was not originally signed',
          actor_email: 'secops@samyakcee.com',
          audit_seal: seal,
        },
        created_at: timestamp,
      };

      const verification = AuditService.verifyAuditIntegrity(tamperedLog, secretKey);
      expect(verification.valid).toBe(false);
      expect(verification.error).toMatch(/tampered with or modified/i);
    });

    it('should detect post-facto tampering of actor_id or resource_id', () => {
      const timestamp = new Date().toISOString();
      const cleanDiff = { reason: 'Audit check', actor_email: 'admin@samyak.com' };
      const seal = computeAuditSeal(
        {
          actorId: 'admin_usr_001',
          action: AUDIT_ACTIONS.IMPERSONATION_START,
          resourceType: 'user_profiles',
          resourceId: 'student_usr_999',
          timestamp,
          changesDiff: cleanDiff,
        },
        secretKey
      );

      // Altered actor_id to blame another admin
      const alteredActorLog = {
        id: 'audit_log_1',
        actor_id: 'rogue_admin_666',
        action: AUDIT_ACTIONS.IMPERSONATION_START,
        resource_type: 'user_profiles',
        resource_id: 'student_usr_999',
        changes_diff: {
          ...cleanDiff,
          audit_seal: seal,
        },
        created_at: timestamp,
      };

      const verification = AuditService.verifyAuditIntegrity(alteredActorLog, secretKey);
      expect(verification.valid).toBe(false);
      expect(verification.error).toMatch(/tampered with or modified/i);
    });

    it('should reject audit records missing a cryptographic seal', () => {
      const log = {
        id: 'audit_log_legacy',
        actor_id: 'admin_usr_001',
        action: AUDIT_ACTIONS.IMPERSONATION_START,
        resource_type: 'user_profiles',
        resource_id: 'student_usr_999',
        changes_diff: { reason: 'Legacy log without seal' },
        created_at: new Date().toISOString(),
      };

      const verification = AuditService.verifyAuditIntegrity(log, secretKey);
      expect(verification.valid).toBe(false);
      expect(verification.error).toMatch(/lacks cryptographic seal/i);
    });
  });
});
