import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { logSecurityEvent } from '@/lib/security/authSecurity';
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

/**
 * Turns a code-exchange failure into a short reason the login page can explain.
 * The commonest one in practice: the sign-in started in a different browser
 * than it finished in (an in-app browser handing off to Chrome), so the PKCE
 * verifier cookie isn't here.
 */
function exchangeFailureCode(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('code verifier') || m.includes('flow state') || m.includes('pkce')) return 'oauth_browser_switched';
  if (m.includes('expired') || m.includes('already used') || m.includes('invalid grant')) return 'oauth_code_expired';
  return 'oauth_exchange_failed';
}

export async function GET(request: NextRequest) {
  try {
    // No IP rate limit here. This route only redeems a single-use, PKCE-bound
    // code, so a limit buys no security — and on Nepal's mobile networks many
    // students share one carrier IP, so 10/minute per IP was turning real
    // Google sign-ins away with "too many attempts" at busy times.

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
      const failed = new URL('/login', origin);
      failed.searchParams.set('error', exchangeFailureCode(exchangeError.message));
      return NextResponse.redirect(failed.toString());
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

