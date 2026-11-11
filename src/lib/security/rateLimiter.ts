/**
 * Samyak CEE Mastery — Enterprise Distributed Rate Limiter
 * 
 * Provides shared, atomic sliding-window rate limiting backed by Redis (Upstash / Vercel KV)
 * with an automatic, zero-dependency in-memory sliding-window fallback.
 * 
 * Supports specialized limits for:
 *  - login (5 req / 60s)
 *  - otp (3 req / 60s)
 *  - ai (15 req / 60s)
 *  - payment / payments (15 req / 60s)
 *  - submission / submissions (20 req / 60s)
 *  - upload / uploads (10 req / 60s)
 *  - auth (10 req / 60s - backward compatibility)
 *  - general (120 req / 60s)
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  source?: 'redis' | 'memory';
}

export type RateLimitPreset =
  | 'login'
  | 'otp'
  | 'ai'
  | 'payment'
  | 'payments'
  | 'submission'
  | 'submissions'
  | 'upload'
  | 'uploads'
  | 'auth'
  | 'api'
  | 'general';

export const PRESET_CONFIGS: Record<RateLimitPreset, { limit: number; windowMs: number }> = {
  login: { limit: 5, windowMs: 60 * 1000 },          // 5 req / 60s (strict brute force mitigation)
  otp: { limit: 3, windowMs: 60 * 1000 },            // 3 req / 60s (SMS & email OTP drain prevention)
  ai: { limit: 15, windowMs: 60 * 1000 },            // 15 req / 60s (LLM / TTS / Vision burst limit)
  payment: { limit: 15, windowMs: 60 * 1000 },       // 15 req / 60s (Fonepay / eSewa / Khalti checkouts)
  payments: { limit: 15, windowMs: 60 * 1000 },      // alias for payment
  submission: { limit: 20, windowMs: 60 * 1000 },    // 20 req / 60s (exam submissions / doubt replies)
  submissions: { limit: 20, windowMs: 60 * 1000 },   // alias for submission
  upload: { limit: 10, windowMs: 60 * 1000 },        // 10 req / 60s (file / paper image uploads)
  uploads: { limit: 10, windowMs: 60 * 1000 },       // alias for upload
  auth: { limit: 10, windowMs: 60 * 1000 },          // 10 req / 60s (legacy backward compatibility)
  api: { limit: 60, windowMs: 60 * 1000 },           // 60 req / 60s (general API protection)
  general: { limit: 120, windowMs: 60 * 1000 },      // 120 req / 60s (general API protection)
};

/**
 * Normalizes preset string or aliases to canonical preset name.
 */
export function normalizePreset(preset: RateLimitPreset | string): RateLimitPreset {
  const p = preset.toLowerCase().trim();
  if (p === 'payments') return 'payment';
  if (p === 'submissions' || p === 'examination' || p === 'exam') return 'submission';
  if (p === 'uploads' || p === 'file' || p === 'files') return 'upload';
  if (p in PRESET_CONFIGS) return p as RateLimitPreset;
  return 'general';
}

/**
 * Atomic Redis Sliding Window Lua script.
 * 
 * Uses Redis Sorted Sets (ZSET):
 * 1. ZREMRANGEBYSCORE removes members older than (now - windowMs).
 * 2. ZCARD counts current active tokens in the window.
 * 3. If count < limit:
 *      ZADD adds current token.
 *      EXPIRE sets key TTL to window + 5s buffer.
 *      Returns [1, remaining, resetSec]
 * 4. If count >= limit:
 *      ZRANGE inspects oldest token to compute precise reset countdown.
 *      Returns [0, 0, resetSec]
 */
const REDIS_SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local clearBefore = now - windowMs

redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
local count = redis.call('ZCARD', key)

if count < limit then
  redis.call('ZADD', key, now, member)
  local ttlSec = math.ceil(windowMs / 1000) + 5
  redis.call('EXPIRE', key, ttlSec)
  local remaining = limit - count - 1
  local resetSec = math.ceil(windowMs / 1000)
  return {1, remaining, resetSec}
else
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local resetSec = math.ceil(windowMs / 1000)
  if oldest and #oldest >= 2 then
    local oldestTs = tonumber(oldest[2])
    resetSec = math.max(1, math.ceil((oldestTs + windowMs - now) / 1000))
  end
  return {0, 0, resetSec}
end
`;

// In-Memory store for offline, development, and fallback mode
interface MemoryRecord {
  timestamps: number[];
}
const rateLimitStore = new Map<string, MemoryRecord>();

// Custom Redis override hook (for testing and mocking)
type RedisChecker = (key: string, limit: number, windowMs: number) => Promise<RateLimitResult | null>;
let redisOverrideChecker: RedisChecker | null = null;

export function setRedisOverride(fn: RedisChecker | null): void {
  redisOverrideChecker = fn;
}

/**
 * Returns configured Upstash / Vercel KV REST endpoint & token, or null.
 */
export function getRedisConfig(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_REST_URL ||
    process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN;

  if (url && token) {
    return { url: url.replace(/\/+$/, ''), token };
  }
  return null;
}

export function isRedisConfigured(): boolean {
  return redisOverrideChecker !== null || getRedisConfig() !== null;
}

/**
 * Executes atomic sliding-window check via Upstash REST API or override.
 * Includes a strict 1500ms timeout so a network slow-down never blocks user requests.
 */
async function checkRedisSlidingWindow(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  if (redisOverrideChecker) {
    try {
      return await redisOverrideChecker(key, limit, windowMs);
    } catch (err: any) {
      console.warn('[RateLimiter] Redis override failed:', err?.message);
      return null;
    }
  }

  const config = getRedisConfig();
  if (!config) return null;

  const now = Date.now();
  const member = `${now}-${Math.random().toString(36).substring(2, 9)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        'EVAL',
        REDIS_SLIDING_WINDOW_LUA,
        '1',
        key,
        String(now),
        String(windowMs),
        String(limit),
        member,
      ]),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[RateLimiter] Redis HTTP error ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data.error) {
      console.warn('[RateLimiter] Redis command error:', data.error);
      return null;
    }

    const [allowedNum, remainingNum, resetSecNum] = Array.isArray(data.result)
      ? data.result
      : [1, limit - 1, Math.ceil(windowMs / 1000)];

    return {
      allowed: Number(allowedNum) === 1,
      remaining: Math.max(0, Number(remainingNum)),
      resetSeconds: Math.max(1, Number(resetSecNum)),
      source: 'redis',
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name !== 'AbortError') {
      console.warn('[RateLimiter] Redis connection failed, falling back to memory:', err?.message);
    }
    return null;
  }
}

/**
 * Fast synchronous in-memory sliding window check.
 */
function checkMemorySlidingWindow(
  key: string,
  limit: number,
  windowMs: number
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
      source: 'memory',
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
    source: 'memory',
  };
}

/**
 * Hybrid result that works seamlessly both synchronously (tests, offline dev)
 * and asynchronously via `await` (distributed atomic Redis in production).
 */
export class ThenableRateLimitResult implements RateLimitResult, PromiseLike<RateLimitResult> {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  source: 'redis' | 'memory';
  private asyncPromise?: Promise<RateLimitResult>;

  constructor(syncResult: RateLimitResult, asyncPromise?: Promise<RateLimitResult>) {
    this.allowed = syncResult.allowed;
    this.remaining = syncResult.remaining;
    this.resetSeconds = syncResult.resetSeconds;
    this.source = syncResult.source || 'memory';
    this.asyncPromise = asyncPromise;
  }

  private toPlain(): RateLimitResult {
    return {
      allowed: this.allowed,
      remaining: this.remaining,
      resetSeconds: this.resetSeconds,
      source: this.source,
    };
  }

  then<TResult1 = RateLimitResult, TResult2 = never>(
    onfulfilled?: ((value: RateLimitResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const target = this.asyncPromise || Promise.resolve(this.toPlain());
    return target.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<RateLimitResult | TResult> {
    const target = this.asyncPromise || Promise.resolve(this.toPlain());
    return target.catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<RateLimitResult> {
    const target = this.asyncPromise || Promise.resolve(this.toPlain());
    return target.finally(onfinally);
  }
}

export type RateLimitResponse = ThenableRateLimitResult;

/**
 * Primary sliding-window rate limit checker.
 * 
 * Works synchronously when Redis is absent (in-memory mode) and executes
 * atomic Redis sliding-window Lua script when Redis is configured and awaited.
 */
export function checkRateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60000
): RateLimitResponse {
  const syncMemoryResult = checkMemorySlidingWindow(key, limit, windowMs);

  if (!isRedisConfigured()) {
    return new ThenableRateLimitResult(syncMemoryResult);
  }

  // Redis is configured: initiate async sliding window
  const asyncPromise = (async () => {
    const redisResult = await checkRedisSlidingWindow(key, limit, windowMs);
    if (redisResult) {
      return redisResult;
    }
    // Fallback to in-memory result if Redis was unreachable
    return syncMemoryResult;
  })();

  return new ThenableRateLimitResult(syncMemoryResult, asyncPromise);
}

/**
 * Explicit asynchronous rate limiter for distributed serverless endpoints.
 */
export async function checkRateLimitAsync(
  key: string,
  limit: number = 60,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const res = checkRateLimit(key, limit, windowMs);
  return await res;
}

/**
 * Enforces preset rate limiting from an incoming HTTP / Next.js Request.
 * 
 * IP address is extracted with priority:
 * 1. x-forwarded-for (first hop)
 * 2. x-real-ip
 * 3. cf-connecting-ip
 * 4. 127.0.0.1
 */
export function enforceRateLimit(
  req: Request,
  preset: RateLimitPreset = 'general',
  customKeySuffix?: string
): RateLimitResponse {
  const normalized = normalizePreset(preset);
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    '127.0.0.1';

  const key = `rl:${normalized}:${ip}${customKeySuffix ? `:${customKeySuffix}` : ''}`;
  const config = PRESET_CONFIGS[normalized] || PRESET_CONFIGS.general;

  return checkRateLimit(key, config.limit, config.windowMs);
}

/**
 * Explicit async variant of enforceRateLimit.
 */
export async function enforceRateLimitAsync(
  req: Request,
  preset: RateLimitPreset = 'general',
  customKeySuffix?: string
): Promise<RateLimitResult> {
  const res = enforceRateLimit(req, preset, customKeySuffix);
  return await res;
}

/**
 * Clears in-memory rate limit records (primarily for test environments).
 */
export function clearRateLimits(): void {
  rateLimitStore.clear();
}
