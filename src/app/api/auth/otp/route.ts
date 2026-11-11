import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sanitizeEmail,
  sanitizePhone,
  enforceOtpRateLimit,
  logSecurityEvent,
} from '@/lib/security/authSecurity';

/**
 * POST /api/auth/otp
 * 
 * Secure server-side OTP dispatch and verification endpoint.
 * Protected by distributed atomic rate limiting (otp preset: max 3 requests / 60s per IP/target).
 * 
 * Body:
 *  - action: 'send' | 'verify'
 *  - email?: string
 *  - phone?: string
 *  - token?: string (required for verify)
 */
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    let body: { action?: string; email?: string; phone?: string; token?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const action = body.action || 'send';
    const rawEmail = body.email ? sanitizeEmail(body.email) : '';
    const rawPhone = body.phone ? sanitizePhone(body.phone) : '';
    const identifier = rawEmail || rawPhone;

    if (!identifier) {
      return NextResponse.json(
        { error: 'Email or phone number is required.' },
        { status: 400 }
      );
    }

    // 1. Enforce atomic OTP rate limit (3 req / 60s)
    const rl = await enforceOtpRateLimit(req, identifier);
    if (!rl.allowed) {
      logSecurityEvent({
        type: 'suspicious_activity',
        email: rawEmail || undefined,
        ip,
        userAgent,
        metadata: { reason: 'otp_rate_limit_exceeded', retryAfter: rl.resetSeconds },
      });
      return NextResponse.json(
        {
          error: `Too many OTP requests. Please wait ${rl.resetSeconds} seconds before requesting a new code.`,
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

    const supabase = await createClient();

    // ── Action: Send OTP ─────────────────────────────────────────────
    if (action === 'send') {
      if (rawEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
          return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
        }

        const { error } = await supabase.auth.signInWithOtp({
          email: rawEmail,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`,
          },
        });

        if (error) {
          logSecurityEvent({
            type: 'login_failure',
            email: rawEmail,
            ip,
            userAgent,
            metadata: { context: 'otp_send_failed', reason: error.message },
          });
          return NextResponse.json(
            { error: 'Failed to send OTP code. Please try again shortly.' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'OTP verification code sent successfully to email.',
          remainingAttempts: rl.remaining,
        });
      }

      if (rawPhone) {
        const { error } = await supabase.auth.signInWithOtp({
          phone: rawPhone,
        });

        if (error) {
          return NextResponse.json(
            { error: 'Failed to send SMS OTP code. Please verify the phone number.' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'OTP code sent via SMS.',
          remainingAttempts: rl.remaining,
        });
      }
    }

    // ── Action: Verify OTP ───────────────────────────────────────────
    if (action === 'verify') {
      const token = (body.token || '').trim();
      if (!token || token.length < 6) {
        return NextResponse.json(
          { error: 'Valid 6-digit verification code is required.' },
          { status: 400 }
        );
      }

      if (rawEmail) {
        const { data, error } = await supabase.auth.verifyOtp({
          email: rawEmail,
          token,
          type: 'email',
        });

        if (error || !data.user) {
          logSecurityEvent({
            type: 'login_failure',
            email: rawEmail,
            ip,
            userAgent,
            metadata: { context: 'otp_verify_failed', reason: error?.message },
          });
          return NextResponse.json(
            { error: 'Invalid or expired OTP code. Please try again or request a new one.' },
            { status: 401 }
          );
        }

        logSecurityEvent({
          type: 'login_success',
          email: rawEmail,
          ip,
          userAgent,
          metadata: { context: 'otp_verified', userId: data.user.id },
        });

        return NextResponse.json({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        });
      }

      if (rawPhone) {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: rawPhone,
          token,
          type: 'sms',
        });

        if (error || !data.user) {
          return NextResponse.json(
            { error: 'Invalid or expired SMS OTP code.' },
            { status: 401 }
          );
        }

        return NextResponse.json({
          success: true,
          user: {
            id: data.user.id,
            phone: data.user.phone,
          },
        });
      }
    }

    return NextResponse.json({ error: 'Unsupported action. Use "send" or "verify".' }, { status: 400 });
  } catch (err: any) {
    console.error('[auth/otp] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred while processing OTP.' }, { status: 500 });
  }
}
