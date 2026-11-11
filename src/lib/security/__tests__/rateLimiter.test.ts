import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkRateLimit,
  checkRateLimitAsync,
  enforceRateLimit,
  enforceRateLimitAsync,
  clearRateLimits,
  setRedisOverride,
  normalizePreset,
  PRESET_CONFIGS,
  type RateLimitResult,
} from '../rateLimiter';

describe('Distributed Rate Limiter Engine', () => {
  beforeEach(() => {
    clearRateLimits();
    setRedisOverride(null);
    vi.restoreAllMocks();
  });

  describe('1. Preset Configurations and Aliases', () => {
    it('defines exact limits for login, otp, ai, payment, submission, and upload', () => {
      expect(PRESET_CONFIGS.login.limit).toBe(5);
      expect(PRESET_CONFIGS.otp.limit).toBe(3);
      expect(PRESET_CONFIGS.ai.limit).toBe(15);
      expect(PRESET_CONFIGS.payment.limit).toBe(15);
      expect(PRESET_CONFIGS.submission.limit).toBe(20);
      expect(PRESET_CONFIGS.upload.limit).toBe(10);
      expect(PRESET_CONFIGS.auth.limit).toBe(10);
      expect(PRESET_CONFIGS.general.limit).toBe(120);
    });

    it('correctly normalizes plural and alias preset names', () => {
      expect(normalizePreset('payments')).toBe('payment');
      expect(normalizePreset('submissions')).toBe('submission');
      expect(normalizePreset('examination')).toBe('submission');
      expect(normalizePreset('exam')).toBe('submission');
      expect(normalizePreset('uploads')).toBe('upload');
      expect(normalizePreset('files')).toBe('upload');
      expect(normalizePreset('unknown_preset')).toBe('general');
    });
  });

  describe('2. Specific Preset Rate Limit Enforcement (In-Memory Fallback)', () => {
    it('enforces login preset (max 5 requests / 60s)', () => {
      const req = new Request('https://samyaktutor.com/api/auth/login', {
        headers: { 'x-forwarded-for': '192.168.1.10' },
      });

      for (let i = 0; i < 5; i++) {
        const res = enforceRateLimit(req, 'login');
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(5 - i - 1);
      }

      const blocked = enforceRateLimit(req, 'login');
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.resetSeconds).toBeGreaterThan(0);
    });

    it('enforces OTP preset strictly (max 3 requests / 60s)', () => {
      const req = new Request('https://samyaktutor.com/api/auth/otp', {
        headers: { 'x-forwarded-for': '192.168.1.11' },
      });

      for (let i = 0; i < 3; i++) {
        const res = enforceRateLimit(req, 'otp');
        expect(res.allowed).toBe(true);
      }

      const blocked = enforceRateLimit(req, 'otp');
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('enforces AI burst limit (max 15 requests / 60s per user/IP)', () => {
      const req = new Request('https://samyaktutor.com/api/ai/chat-completion', {
        headers: { 'x-forwarded-for': '192.168.1.12' },
      });

      for (let i = 0; i < 15; i++) {
        const res = enforceRateLimit(req, 'ai', 'user_123');
        expect(res.allowed).toBe(true);
      }

      const blocked = enforceRateLimit(req, 'ai', 'user_123');
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('enforces examination submission limit (max 20 requests / 60s)', () => {
      const req = new Request('https://samyaktutor.com/api/exams/submit', {
        headers: { 'x-forwarded-for': '192.168.1.13' },
      });

      for (let i = 0; i < 20; i++) {
        const res = enforceRateLimit(req, 'submission');
        expect(res.allowed).toBe(true);
      }

      const blocked = enforceRateLimit(req, 'submission');
      expect(blocked.allowed).toBe(false);
    });

    it('enforces file upload limit (max 10 requests / 60s)', () => {
      const req = new Request('https://samyaktutor.com/api/ai/vision-marker', {
        headers: { 'x-forwarded-for': '192.168.1.14' },
      });

      for (let i = 0; i < 10; i++) {
        const res = enforceRateLimit(req, 'upload');
        expect(res.allowed).toBe(true);
      }

      const blocked = enforceRateLimit(req, 'upload');
      expect(blocked.allowed).toBe(false);
    });
  });

  describe('3. Shared Atomic Redis Integration & Overrides', () => {
    it('executes atomic Redis checks when Redis provider is active', async () => {
      let redisCalls = 0;
      setRedisOverride(async (key, limit, windowMs) => {
        redisCalls++;
        return {
          allowed: true,
          remaining: limit - redisCalls,
          resetSeconds: 60,
          source: 'redis',
        };
      });

      const res = await checkRateLimitAsync('test-redis-key', 10, 60000);
      expect(redisCalls).toBe(1);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(9);
      expect(res.source).toBe('redis');
    });

    it('falls back seamlessly to in-memory store when Redis throws or is unreachable', async () => {
      setRedisOverride(async () => {
        throw new Error('Connection refused to redis cluster');
      });

      const req = new Request('https://samyaktutor.com/api/payments/initiate', {
        headers: { 'x-forwarded-for': '10.0.0.5' },
      });

      // Should not throw, should fall back to memory
      const res = await enforceRateLimitAsync(req, 'payment');
      expect(res.allowed).toBe(true);
      expect(res.source).toBe('memory');
    });

    it('supports thenable awaiting seamlessly for Next.js async handlers', async () => {
      const req = new Request('https://samyaktutor.com/api/auth/login', {
        headers: { 'x-forwarded-for': '10.0.0.6' },
      });

      const awaited = await enforceRateLimit(req, 'login');
      expect(awaited.allowed).toBe(true);
      expect(awaited.remaining).toBe(4);
    });
  });

  describe('4. Custom Key Suffix and Header Priority', () => {
    it('isolates limits when customKeySuffix is provided (e.g. user ID or action)', () => {
      const req = new Request('https://samyaktutor.com/api/ai/tts', {
        headers: { 'x-forwarded-for': '8.8.8.8' },
      });

      const resUser1 = enforceRateLimit(req, 'ai', 'user-1');
      const resUser2 = enforceRateLimit(req, 'ai', 'user-2');

      expect(resUser1.remaining).toBe(14);
      expect(resUser2.remaining).toBe(14); // independent bucket from user-1
    });

    it('extracts IP from cloudflare or x-real-ip headers when x-forwarded-for is missing', () => {
      const reqCf = new Request('https://samyaktutor.com/api/general', {
        headers: { 'cf-connecting-ip': '103.21.244.2' },
      });
      const resCf = enforceRateLimit(reqCf, 'general');
      expect(resCf.allowed).toBe(true);

      const reqReal = new Request('https://samyaktutor.com/api/general', {
        headers: { 'x-real-ip': '103.21.244.3' },
      });
      const resReal = enforceRateLimit(reqReal, 'general');
      expect(resReal.allowed).toBe(true);
    });
  });
});
