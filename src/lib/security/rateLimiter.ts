/**
 * High-performance sliding-window in-memory rate limiter.
 * Protects auth, payments, exam submissions, and general API endpoints from abuse.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export type RateLimitPreset = 'auth' | 'submission' | 'payment' | 'general';

const PRESET_CONFIGS: Record<RateLimitPreset, { limit: number; windowMs: number }> = {
  auth: { limit: 10, windowMs: 60 * 1000 },       // 10 requests per minute
  submission: { limit: 30, windowMs: 60 * 1000 }, // 30 submissions per minute
  payment: { limit: 15, windowMs: 60 * 1000 },    // 15 payment requests per minute
  general: { limit: 120, windowMs: 60 * 1000 },   // 120 requests per minute
};

/**
 * Checks if a given key has exceeded the specified rate limit.
 */
export function checkRateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps outside the sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    };
  }

  record.timestamps.push(now);

  // Periodic eviction of stale keys
  if (rateLimitStore.size > 2000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.timestamps.length === 0 || v.timestamps[v.timestamps.length - 1] < windowStart) {
        rateLimitStore.delete(k);
      }
    }
  }

  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    resetSeconds: Math.ceil(windowMs / 1000),
  };
}

/**
 * Helper to enforce a preset rule from a Next.js / Fetch Request.
 */
export function enforceRateLimit(
  req: Request,
  preset: RateLimitPreset = 'general',
  customKeySuffix?: string
): RateLimitResult {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const key = `${preset}:${ip}${customKeySuffix ? `:${customKeySuffix}` : ''}`;
  const config = PRESET_CONFIGS[preset] || PRESET_CONFIGS.general;

  return checkRateLimit(key, config.limit, config.windowMs);
}

/**
 * Clears in-memory store (primarily for unit tests).
 */
export function clearRateLimits(): void {
  rateLimitStore.clear();
}
