import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { enforceAuthRateLimit, logSecurityEvent } from '@/lib/security/authSecurity';
import type { EmailOtpType } from '@supabase/supabase-js';

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

/**
 * Only allow same-site relative paths as a post-login redirect target.
 * Rejects absolute URLs ("https://evil.com"), protocol-relative ("//evil.com"),
 * backslash tricks ("/\\evil.com"), and URL-encoded variants ("/%2f", "/%5c").
 */
function safeNextPath(next: string | null): string {
  const fallback = '/student-dashboard';
  if (!next) return fallback;
  let decoded = next;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return fallback;
  }
  const clean = decoded.trim();
  if (!clean.startsWith('/')) return fallback;
  if (clean.startsWith('//') || clean.startsWith('/\\')) return fallback;
  if (/[\x00-\x1F\x7F]/.test(clean) || /^\/+https?:/i.test(clean) || clean.toLowerCase().includes('javascript:')) {
    return fallback;
  }
  return clean;
}

export async function GET(request: NextRequest) {
  try {
    const rl = enforceAuthRateLimit(request);
    if (!rl.allowed) {
      return NextResponse.redirect(new URL('/login?error=rate_limited', request.url).toString());
    }

    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash');
    const rawType = (searchParams.get('type') || '').toLowerCase() as EmailOtpType;
    const next = safeNextPath(searchParams.get('next'));
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Handle OAuth/Auth errors redirected from Supabase or Google
    if (error) {
      const redirectUrl = new URL('/login', origin);
      const safeErrorMsg = (errorDescription || error).slice(0, 160).replace(/[<>]/g, '');
      redirectUrl.searchParams.set('error', safeErrorMsg);
      return NextResponse.redirect(redirectUrl.toString());
    }

    // 1. Handle OAuth PKCE Code Exchange (Google OAuth, etc.)
    if (code) {
      const supabase = await createClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) {
        logSecurityEvent({
          type: 'login_success',
          email: data.user?.email,
          ip,
          userAgent,
          metadata: { method: 'oauth_pkce', userId: data.user?.id },
        });
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.warn('OAuth code exchange failed:', exchangeError.message);
    }

    // 2. Handle Token Hash Verification (Magic Link / Email OTP / Password Reset)
    if (tokenHash && ALLOWED_OTP_TYPES.has(rawType)) {
      const supabase = await createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: rawType,
      });
      if (!verifyError) {
        logSecurityEvent({
          type: 'login_success',
          email: data.user?.email,
          ip,
          userAgent,
          metadata: { method: `otp_${rawType}`, userId: data.user?.id },
        });
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.warn('Token hash verification failed:', verifyError.message);
    }

    return NextResponse.redirect(`${origin}/login?error=AuthenticationFailed`);
  } catch (err: any) {
    console.error('Auth callback exception:', err);
    return NextResponse.redirect(new URL('/login?error=SessionExchangeError', request.url).toString());
  }
}

