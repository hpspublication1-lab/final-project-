import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/config/superAdmin';
import {
  checkLoginLockout,
  recordLoginFailure,
  recordLoginSuccess,
  sanitizeEmail,
  enforceAuthRateLimit,
  logSecurityEvent,
} from '@/lib/security/authSecurity';

/**
 * POST /api/auth/login
 * Secure server-side login endpoint with brute-force protection,
 * rate limiting, input validation, and security audit logging.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limit
    const rl = enforceAuthRateLimit(req);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait and try again.', retryAfter: rl.resetSeconds },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.resetSeconds),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // 2. Parse and validate body
    let body: { email?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const email = sanitizeEmail(body.email || '');
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    // 3. Brute Force Check
    const lockout = checkLoginLockout(email, ip);
    if (lockout.locked) {
      logSecurityEvent({
        type: 'login_locked',
        email,
        ip,
        userAgent,
        metadata: { remainingSeconds: lockout.remainingSeconds, totalFailures: lockout.failures },
      });
      return NextResponse.json(
        {
          error: `Account temporarily locked due to too many failed attempts. Try again in ${Math.ceil(lockout.remainingSeconds / 60)} minutes.`,
          lockedMinutes: Math.ceil(lockout.remainingSeconds / 60),
        },
        { status: 423 }
      );
    }

    // 4. Authenticate with Supabase (sets SSR auth cookies directly on response)
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      recordLoginFailure(email, ip);
      logSecurityEvent({
        type: 'login_failure',
        email,
        ip,
        userAgent,
        metadata: { reason: error.message, failureCount: lockout.failures + 1 },
      });

      // Generic error message to prevent email enumeration
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials and try again.' },
        { status: 401 }
      );
    }

    // 5. Success — resolve role immediately without extra round-trips
    recordLoginSuccess(email, ip);
    const superAdmin = isSuperAdmin(email);
    const meta = data.user?.user_metadata || {};
    const resolvedRole = superAdmin ? 'super_admin' : String(meta.role || 'student').toLowerCase();
    const onboardingCompleted = Boolean(
      superAdmin ||
      meta.onboarding_completed === true ||
      ['admin', 'super_admin', 'teacher', 'support_staff', 'payment_staff', 'content_manager'].includes(resolvedRole)
    );

    logSecurityEvent({
      type: 'login_success',
      email,
      ip,
      userAgent,
      metadata: { userId: data.user?.id, role: resolvedRole },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      role: resolvedRole,
      isSuperAdmin: superAdmin,
      onboardingCompleted,
    });
  } catch (err) {
    console.error('[auth/login] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
