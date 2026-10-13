/**
 * Samyak Tutor — Authentication Security Engine
 * Centralized security utilities for login hardening, session protection,
 * brute-force prevention, input sanitization, and audit logging.
 */

import { enforceRateLimit, type RateLimitResult } from './rateLimiter';

// ── 1. Login Attempt Tracker (Brute Force Protection) ──────────────────
// Track failed login attempts per email+IP. After 5 failures in 15 minutes,
// lock out for 15 minutes. After 10 failures, lock for 1 hour.
interface LoginAttemptRecord {
  failures: number;
  lastFailure: number;
  lockedUntil: number;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();

export function checkLoginLockout(email: string, ip: string): { locked: boolean; remainingSeconds: number; failures: number } {
  const key = `login:${email.toLowerCase().trim()}:${ip}`;
  const record = loginAttempts.get(key);
  if (!record) return { locked: false, remainingSeconds: 0, failures: 0 };
  
  const now = Date.now();
  if (record.lockedUntil > now) {
    return {
      locked: true,
      remainingSeconds: Math.ceil((record.lockedUntil - now) / 1000),
      failures: record.failures,
    };
  }
  
  // Reset if the lockout has expired
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    loginAttempts.delete(key);
    return { locked: false, remainingSeconds: 0, failures: 0 };
  }
  
  return { locked: false, remainingSeconds: 0, failures: record.failures };
}

export function recordLoginFailure(email: string, ip: string): void {
  const key = `login:${email.toLowerCase().trim()}:${ip}`;
  const now = Date.now();
  const record = loginAttempts.get(key) || { failures: 0, lastFailure: 0, lockedUntil: 0 };
  
  // Reset if last failure was more than 15 minutes ago
  if (now - record.lastFailure > 15 * 60 * 1000) {
    record.failures = 0;
  }
  
  record.failures++;
  record.lastFailure = now;
  
  // Progressive lockout
  if (record.failures >= 10) {
    record.lockedUntil = now + 60 * 60 * 1000; // 1 hour
  } else if (record.failures >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 minutes
  }
  
  loginAttempts.set(key, record);
  
  // Evict stale entries
  if (loginAttempts.size > 5000) {
    const cutoff = now - 2 * 60 * 60 * 1000;
    for (const [k, v] of loginAttempts.entries()) {
      if (v.lastFailure < cutoff) loginAttempts.delete(k);
    }
  }
}

export function recordLoginSuccess(email: string, ip: string): void {
  const key = `login:${email.toLowerCase().trim()}:${ip}`;
  loginAttempts.delete(key);
}

// ── 2. Input Sanitization ──────────────────────────────────────────────
export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase().slice(0, 254);
}

export function sanitizeDisplayName(input: string): string {
  // Strip HTML tags and limit length
  return input.replace(/<[^>]*>/g, '').trim().slice(0, 100);
}

export function sanitizePhone(input: string): string {
  // Allow only digits, +, -, spaces, parentheses
  return input.replace(/[^\d+\-()\s]/g, '').trim().slice(0, 20);
}

// ── 3. Password Policy Validation ──────────────────────────────────────
export interface PasswordValidation {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (password.length > 128) errors.push('Password must be less than 128 characters');
  if (!/[A-Z]/.test(password)) errors.push('Include at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Include at least one lowercase letter');
  if (!/\d/.test(password)) errors.push('Include at least one number');
  
  // Common password check
  const common = ['password', '12345678', 'qwerty123', 'password1', 'samyak123', 'admin123'];
  if (common.includes(password.toLowerCase())) {
    errors.push('This password is too common. Choose a unique password.');
  }
  
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  ].filter(Boolean).length;
  
  const strength = score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'good' : 'strong';
  
  return { valid: errors.length === 0, errors, strength };
}

// ── 4. Session Fingerprint ─────────────────────────────────────────────
// Lightweight session binding check (not a full fingerprint, just basic anomaly detection)
export function generateSessionFingerprint(userAgent: string, ip: string): string {
  // Use a simple hash of UA family + IP prefix for basic session binding
  const uaFamily = userAgent.includes('Mobile') ? 'mobile' : 'desktop';
  const ipPrefix = ip.split('.').slice(0, 3).join('.');
  return `${uaFamily}:${ipPrefix}`;
}

// ── 5. Security Event Logger ───────────────────────────────────────────
export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'login_locked'
  | 'signup'
  | 'password_reset_request'
  | 'role_elevation'
  | 'admin_access'
  | 'suspicious_activity';

export interface SecurityEvent {
  type: SecurityEventType;
  email?: string;
  ip: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// In-memory buffer that flushes to console.warn (structured JSON).
// In production, this would be replaced with a proper audit log sink.
const eventBuffer: SecurityEvent[] = [];

export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const entry: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };
  
  // Always log security events server-side
  if (event.type === 'login_failure' || event.type === 'login_locked' || event.type === 'suspicious_activity') {
    console.warn('[SECURITY]', JSON.stringify(entry));
  } else {
    console.info('[SECURITY]', JSON.stringify(entry));
  }
  
  eventBuffer.push(entry);
  if (eventBuffer.length > 1000) eventBuffer.splice(0, 500);
}

// ── 6. Auth Rate Limit Helper ──────────────────────────────────────────
export function enforceAuthRateLimit(req: Request): RateLimitResult {
  return enforceRateLimit(req, 'auth');
}

// ── 7. Secure Cookie Defaults ──────────────────────────────────────────
export function getSecureCookieOptions(isProd: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/',
  };
}

// ── 8. Clear stale data (for tests) ───────────────────────────────────
export function clearAuthSecurityState(): void {
  loginAttempts.clear();
  eventBuffer.length = 0;
}
