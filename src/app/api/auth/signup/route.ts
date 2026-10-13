import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sanitizeEmail,
  sanitizeDisplayName,
  sanitizePhone,
  validatePassword,
  enforceAuthRateLimit,
  logSecurityEvent,
} from '@/lib/security/authSecurity';

/**
 * POST /api/auth/signup
 * Secure server-side signup with input sanitization, password policy,
 * rate limiting, and audit logging.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limit
    const rl = enforceAuthRateLimit(req);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please wait and try again.', retryAfter: rl.resetSeconds },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // 2. Parse body
    let body: { email?: string; password?: string; fullName?: string; phone?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const email = sanitizeEmail(body.email || '');
    const password = body.password || '';
    const fullName = sanitizeDisplayName(body.fullName || '');
    const phone = sanitizePhone(body.phone || '');

    // 3. Validate inputs
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: 'Full name is required (minimum 2 characters).' }, { status: 400 });
    }

    // 4. Password policy
    const pwValidation = validatePassword(password);
    if (!pwValidation.valid) {
      return NextResponse.json(
        { error: pwValidation.errors[0], passwordErrors: pwValidation.errors },
        { status: 400 }
      );
    }

    // 5. Create account
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          role: 'student',
          consent_accepted_at: new Date().toISOString(),
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`,
      },
    });

    if (error) {
      logSecurityEvent({
        type: 'signup',
        email,
        ip,
        userAgent,
        metadata: { success: false, reason: error.message },
      });
      // Generic message to prevent email enumeration
      return NextResponse.json(
        { error: 'Could not create account. The email may already be registered. Try signing in instead.' },
        { status: 400 }
      );
    }

    logSecurityEvent({
      type: 'signup',
      email,
      ip,
      userAgent,
      metadata: { success: true, userId: data.user?.id },
    });

    return NextResponse.json({
      success: true,
      user: { id: data.user?.id, email: data.user?.email },
    });
  } catch (err) {
    console.error('[auth/signup] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
