import { NextResponse } from 'next/server';
import { enforceRateLimit as enforceSharedRateLimit } from '@/lib/security/rateLimiter';
import { createClient } from '@/lib/supabase/server';

export interface AiQuotaOptions {
  freeLimit?: number;
  proLimit?: number;
}

/**
 * Enforces atomic sliding-window burst rate limit AND daily tier-based AI quota.
 * Fails closed on unauthenticated calls or database RPC errors.
 * Returns a NextResponse (401, 429, 503) if blocked, or null if allowed.
 */
export async function enforceAiRateLimitAndQuota(
  req: Request,
  opts: AiQuotaOptions = {}
): Promise<NextResponse | null> {
  const freeLimit = opts.freeLimit ?? 5;
  const proLimit = opts.proLimit ?? 75;

  // 1. Sliding-window burst rate limit (ai preset: 15 req / 60s)
  const rl = await enforceSharedRateLimit(req, 'ai');
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: 'Too many AI requests. Please wait a moment before sending more queries.',
        retryAfter: rl.resetSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.resetSeconds),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 2. Daily tier-based quota check
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', details: 'You must be signed in to use AI features.' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.rpc('check_and_increment_ai_usage', {
      p_free_limit: freeLimit,
      p_pro_limit: proLimit,
    });

    if (error) {
      console.error('AI rate-limit RPC check failed (failing closed):', error.message);
      return NextResponse.json(
        { error: 'AI quota verification failed. Please try again shortly.', details: error.message },
        { status: 503 }
      );
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.allowed === false) {
      return NextResponse.json(
        {
          error: 'Daily AI limit reached',
          details: `You've used all ${row.daily_limit} AI requests for today. Upgrade to CEE AI Pro for ${proLimit} requests/day, or try again tomorrow at midnight NPT.`,
          currentUsage: row.current_count,
          dailyLimit: row.daily_limit,
          tier: row.tier,
        },
        { status: 429 }
      );
    }

    return null;
  } catch (err: any) {
    console.error('AI rate-limit unexpected error (failing closed):', err);
    return NextResponse.json(
      { error: 'AI quota service error. Please try again.', details: err?.message },
      { status: 500 }
    );
  }
}
