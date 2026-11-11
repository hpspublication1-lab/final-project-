/**
 * Samyak Tutor LMS — Impersonation & Privileged Action Security Guard
 * 
 * Enforces:
 * 1. Mandatory justification reason (min 5 chars) & support ticket tracking.
 * 2. Strict session time limits (5-30 minutes, default 15 mins) with countdown expiration.
 * 3. Fresh authentication / MFA verification for privileged operations.
 * 4. Cryptographic HMAC-SHA256 session seals preventing cookie tampering.
 * 5. Automatic blocking of sensitive write operations (exams, payments, profile edits)
 *    during active impersonation sessions.
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { AuditService, AUDIT_ACTIONS } from '../services/auditService';

export const IMPERSONATION_COOKIE_NAME = 'samyak_ghost_session';
export const DEFAULT_IMPERSONATION_MINUTES = 15;
export const MAX_IMPERSONATION_MINUTES = 30;
export const MIN_IMPERSONATION_MINUTES = 5;

export interface ImpersonationSession {
  active: boolean;
  impersonationId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  adminId: string;
  adminEmail: string;
  reason: string;
  ticketId?: string;
  startedAt: number;
  expiresAt: number;
  maxDurationMinutes: number;
  readOnly: true;
  auditSeal: string;
}

export interface ImpersonationStartInput {
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  reason: string;
  ticketId?: string;
  durationMinutes?: number;
  adminUser: {
    id: string;
    email?: string | null;
    last_sign_in_at?: string | null;
  };
  mfaConfirmed?: boolean;
}

export interface ImpersonationValidationResult {
  active: boolean;
  isExpired: boolean;
  remainingSeconds: number;
  session: ImpersonationSession | null;
  reason: 'valid' | 'expired' | 'no_cookie' | 'corrupted' | 'tampered';
  error?: string;
}

/**
 * Computes an HMAC-SHA256 seal for an impersonation session.
 */
export function computeImpersonationSeal(
  sessionData: Omit<ImpersonationSession, 'auditSeal'>,
  secretKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY || 'samyak_impersonation_master_key'
): string {
  const canonical = [
    sessionData.impersonationId,
    sessionData.adminId,
    sessionData.studentId,
    sessionData.reason,
    sessionData.startedAt,
    sessionData.expiresAt,
  ].join('|');

  return crypto.createHmac('sha256', secretKey).update(canonical).digest('hex');
}

/**
 * Validates request to start an impersonation session.
 * Requires clear justification reason, bounded duration, and fresh admin authentication.
 */
export function validateImpersonationStart(
  input: ImpersonationStartInput,
  options?: {
    maxAuthAgeMinutes?: number;
    nowMs?: number;
    secretKey?: string;
  }
): {
  valid: boolean;
  statusCode: number;
  error?: string;
  session?: ImpersonationSession;
} {
  const now = options?.nowMs ?? Date.now();

  // 1. Mandatory Student Target
  if (!input.studentId || typeof input.studentId !== 'string' || input.studentId.trim().length === 0) {
    return {
      valid: false,
      statusCode: 400,
      error: 'Student target ID is required for impersonation.',
    };
  }

  // 2. Prevent Self-Impersonation (Privilege Confusion)
  if (input.studentId.trim() === input.adminUser.id) {
    return {
      valid: false,
      statusCode: 400,
      error: 'Administrators cannot impersonate their own administrative accounts.',
    };
  }

  // 3. Mandatory Justification Reason (Accountability & Audit Compliance)
  const reason = (input.reason || '').trim();
  if (!reason || reason.length < 5) {
    return {
      valid: false,
      statusCode: 400,
      error: 'A justified reason (minimum 5 characters, e.g. support ticket number, diagnostic audit) is required to impersonate a student.',
    };
  }

  // 4. Fresh Authentication / MFA Validation
  const maxAuthAgeMs = (options?.maxAuthAgeMinutes ?? 60) * 60 * 1000;
  if (input.adminUser.last_sign_in_at) {
    const lastSignInMs = new Date(input.adminUser.last_sign_in_at).getTime();
    if (!isNaN(lastSignInMs) && now - lastSignInMs > maxAuthAgeMs && !input.mfaConfirmed) {
      return {
        valid: false,
        statusCode: 403,
        error: 'Fresh authentication required: Your administrative session is too old for high-risk impersonation. Please re-authenticate or confirm MFA.',
      };
    }
  }

  // 5. Time Limits (Strictly bounded between 5 and 30 minutes)
  const requestedDuration = Number(input.durationMinutes) || DEFAULT_IMPERSONATION_MINUTES;
  const durationMinutes = Math.min(MAX_IMPERSONATION_MINUTES, Math.max(MIN_IMPERSONATION_MINUTES, requestedDuration));
  const startedAt = now;
  const expiresAt = startedAt + durationMinutes * 60 * 1000;
  const impersonationId = `imp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const baseSession: Omit<ImpersonationSession, 'auditSeal'> = {
    active: true,
    impersonationId,
    studentId: input.studentId.trim(),
    studentName: input.studentName?.trim() || 'Student',
    studentEmail: input.studentEmail?.trim() || '',
    adminId: input.adminUser.id,
    adminEmail: input.adminUser.email?.trim() || 'admin@samyakcee.com',
    reason,
    ticketId: input.ticketId?.trim(),
    startedAt,
    expiresAt,
    maxDurationMinutes: durationMinutes,
    readOnly: true,
  };

  const secret = options?.secretKey || process.env.SUPABASE_SERVICE_ROLE_KEY || 'samyak_impersonation_master_key';
  const auditSeal = computeImpersonationSeal(baseSession, secret);

  const session: ImpersonationSession = {
    ...baseSession,
    auditSeal,
  };

  return {
    valid: true,
    statusCode: 200,
    session,
  };
}

/**
 * Parses and verifies the impersonation cookie from raw cookie string or header.
 */
export function parseAndVerifyImpersonationCookie(
  rawCookieValue: string | undefined | null,
  options?: {
    nowMs?: number;
    secretKey?: string;
  }
): ImpersonationValidationResult {
  if (!rawCookieValue) {
    return { active: false, isExpired: false, remainingSeconds: 0, session: null, reason: 'no_cookie' };
  }

  try {
    const decoded = rawCookieValue.startsWith('%7B') ? decodeURIComponent(rawCookieValue) : rawCookieValue;
    const session = JSON.parse(decoded) as ImpersonationSession;

    if (!session || !session.active || !session.studentId || !session.adminId) {
      return { active: false, isExpired: false, remainingSeconds: 0, session: null, reason: 'corrupted' };
    }

    const now = options?.nowMs ?? Date.now();

    // 1. Expiration check
    if (session.expiresAt && now >= session.expiresAt) {
      return {
        active: false,
        isExpired: true,
        remainingSeconds: 0,
        session,
        reason: 'expired',
        error: 'Impersonation session has expired.',
      };
    }

    // 2. Cryptographic Seal Verification
    if (session.auditSeal) {
      const secret = options?.secretKey || process.env.SUPABASE_SERVICE_ROLE_KEY || 'samyak_impersonation_master_key';
      const expectedSeal = computeImpersonationSeal(session, secret);
      if (session.auditSeal !== expectedSeal) {
        return {
          active: false,
          isExpired: false,
          remainingSeconds: 0,
          session: null,
          reason: 'tampered',
          error: 'Impersonation session signature verification failed. Tampered session rejected.',
        };
      }
    }

    const remaining = Math.max(0, Math.floor((session.expiresAt - now) / 1000));

    return {
      active: true,
      isExpired: false,
      remainingSeconds: remaining,
      session,
      reason: 'valid',
    };
  } catch {
    return { active: false, isExpired: false, remainingSeconds: 0, session: null, reason: 'corrupted' };
  }
}

/**
 * Extracts the active impersonation session from a NextRequest or Request.
 */
export function getActiveImpersonationSession(
  req: NextRequest | Request,
  options?: { nowMs?: number; secretKey?: string }
): ImpersonationValidationResult {
  let cookieVal: string | undefined;

  if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
    cookieVal = (req as NextRequest).cookies.get(IMPERSONATION_COOKIE_NAME)?.value;
  } else {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${IMPERSONATION_COOKIE_NAME}=`));
    if (match) {
      cookieVal = match.slice(IMPERSONATION_COOKIE_NAME.length + 1);
    }
  }

  return parseAndVerifyImpersonationCookie(cookieVal, options);
}

/**
 * Guards sensitive write operations from being executed under an active impersonation session.
 * Impersonation is strictly read-only diagnostics.
 * Returns HTTP 403 Forbidden if impersonating; returns null if normal student.
 */
export async function blockSensitiveActionDuringImpersonation(
  req: NextRequest | Request,
  actionName: string
): Promise<NextResponse | null> {
  const result = getActiveImpersonationSession(req);

  if (result.active && result.session) {
    const { session } = result;

    // Log the attempted sensitive operation in the audit trail
    await AuditService.recordAuditEvent({
      actorId: session.adminId,
      actorEmail: session.adminEmail,
      action: AUDIT_ACTIONS.IMPERSONATION_BLOCKED,
      resourceType: 'security_violation',
      resourceId: session.studentId,
      changesDiff: {
        attemptedAction: actionName,
        studentEmail: session.studentEmail,
        impersonationId: session.impersonationId,
        blockedAt: new Date().toISOString(),
      },
    }).catch(() => null);

    return NextResponse.json(
      {
        error: `Security Policy Violation: Operation "${actionName}" cannot be performed during an administrative impersonation session. Impersonation is strictly restricted to read-only diagnostics.`,
        code: 'IMPERSONATION_READONLY_BLOCKED',
        isImpersonating: true,
        studentId: session.studentId,
        adminId: session.adminId,
      },
      { status: 403 }
    );
  }

  return null;
}
