import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

/**
 * Only allow same-site absolute paths as a post-login redirect target.
 * Rejects absolute URLs ("https://evil.com"), protocol-relative ("//evil.com")
 * and backslash tricks ("/\\evil.com") to prevent open-redirect abuse.
 */
function safeNextPath(next: string | null): string {
  const fallback = '/student-dashboard';
  if (!next) return fallback;
  if (!next.startsWith('/')) return fallback;
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as any;
    const next = safeNextPath(searchParams.get('next'));
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth/Auth errors redirected from Supabase or Google
    if (error) {
      const redirectUrl = new URL('/login', origin);
      redirectUrl.searchParams.set('error', errorDescription || error);
      return NextResponse.redirect(redirectUrl.toString());
    }

    // 1. Handle OAuth PKCE Code Exchange (Google OAuth, etc.)
    if (code) {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.warn('OAuth code exchange failed:', exchangeError.message);
    }

    // 2. Handle Token Hash Verification (Magic Link / Email OTP / Password Reset)
    if (tokenHash && type) {
      const supabase = await createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (!verifyError) {
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
