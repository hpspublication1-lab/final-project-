import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkLoginLockout,
  recordLoginFailure,
  recordLoginSuccess,
  sanitizeEmail,
  sanitizeDisplayName,
  sanitizePhone,
  validatePassword,
  clearAuthSecurityState,
} from '../authSecurity';

describe('Auth Security Engine', () => {
  beforeEach(() => {
    clearAuthSecurityState();
  });

  describe('Login Lockout (Brute Force Protection)', () => {
    it('should allow login when no previous failures exist', () => {
      const result = checkLoginLockout('test@example.com', '1.2.3.4');
      expect(result.locked).toBe(false);
      expect(result.failures).toBe(0);
    });

    it('should track failures without locking before threshold', () => {
      for (let i = 0; i < 4; i++) {
        recordLoginFailure('test@example.com', '1.2.3.4');
      }
      const result = checkLoginLockout('test@example.com', '1.2.3.4');
      expect(result.locked).toBe(false);
      expect(result.failures).toBe(4);
    });

    it('should lock account after 5 failed attempts', () => {
      for (let i = 0; i < 5; i++) {
        recordLoginFailure('lock@example.com', '1.2.3.4');
      }
      const result = checkLoginLockout('lock@example.com', '1.2.3.4');
      expect(result.locked).toBe(true);
      expect(result.remainingSeconds).toBeGreaterThan(0);
    });

    it('should clear lockout on successful login', () => {
      for (let i = 0; i < 5; i++) {
        recordLoginFailure('clear@example.com', '1.2.3.4');
      }
      recordLoginSuccess('clear@example.com', '1.2.3.4');
      const result = checkLoginLockout('clear@example.com', '1.2.3.4');
      expect(result.locked).toBe(false);
      expect(result.failures).toBe(0);
    });

    it('should isolate lockouts per email+IP pair', () => {
      for (let i = 0; i < 5; i++) {
        recordLoginFailure('user@example.com', '10.0.0.1');
      }
      const locked = checkLoginLockout('user@example.com', '10.0.0.1');
      const notLocked = checkLoginLockout('user@example.com', '10.0.0.2');
      expect(locked.locked).toBe(true);
      expect(notLocked.locked).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should lowercase and trim emails', () => {
      expect(sanitizeEmail('  Admin@SAMYAK.com  ')).toBe('admin@samyak.com');
    });

    it('should truncate excessively long emails', () => {
      const long = 'a'.repeat(300) + '@example.com';
      expect(sanitizeEmail(long).length).toBeLessThanOrEqual(254);
    });

    it('should strip HTML from display names', () => {
      expect(sanitizeDisplayName('<script>alert(1)</script>John')).toBe('alert(1)John');
    });

    it('should sanitize phone numbers', () => {
      expect(sanitizePhone('+977 98XXXXXXXX<script>')).toBe('+977 98');
    });
  });

  describe('Password Policy', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('Ab1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject passwords without uppercase', () => {
      const result = validatePassword('abcdefg123');
      expect(result.valid).toBe(false);
    });

    it('should reject common passwords', () => {
      const result = validatePassword('password');
      expect(result.valid).toBe(false);
    });

    it('should accept strong passwords', () => {
      const result = validatePassword('Samyak@Secure2026');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should rate strength correctly', () => {
      expect(validatePassword('abcdefgh').strength).toBe('weak');
      expect(validatePassword('Abcdefgh').strength).toBe('fair');
      expect(validatePassword('Abcdefg1').strength).toBe('good');
      expect(validatePassword('Abcdefg1!').strength).toBe('strong');
    });
  });
});
