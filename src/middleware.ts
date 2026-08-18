import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSuperAdmin } from '@/lib/config/superAdmin';

function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  return url.match(/https:\/\/([^.]+)\./)?.[1] ?? '';
}

function injectTokenFromHeader(request: NextRequest): void {
  const token = request.headers.get('x-sb-token');
  if (!token) return;
  const hasCookie = request.cookies.getAll().some((c) => c.name.includes('auth-token'));
  if (hasCookie) return;
  request.cookies.set(`sb-${getProjectRef()}-auth-token`, token);
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  injectTokenFromHeader(request);
  const supabaseResponse = NextResponse.next({ request });

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const sbAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(
    sbUrl,
    sbAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // `Secure` cookies are rejected over plain http (localhost), which
          // desyncs the session on token refresh and logs the user out. Only
          // force Secure in production; SameSite=Lax keeps the session on
          // same-origin navigations. Mirrors src/lib/supabase/server.ts.
          const isProd = process.env.NODE_ENV === 'production';
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, { ...options, sameSite: 'lax', secure: isProd });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthenticated = !!user;

  // Every route that serves student content or account actions requires login.
  // Public routes (marketing / auth / legal) are the explicit allowlist below.
  const protectedPaths = [
    '/student-dashboard',
    '/onboarding',
    '/dashboard',
    '/account',
    // Purchase / account flows — must be signed in:
    '/checkout',
    '/payment-success',
    '/activate-plan',
  ];
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!isAuthenticated && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-up-login-screen';
    // Preserve the intended destination so login returns the user here.
    url.search = `?redirect=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  // ── Hidden admin control panel ────────────────────────────────────────────
  // The panel is NOT linked anywhere and is unreachable at /admin directly.
  // It is unlocked ONLY by visiting the secret entrance  /admin-<ADMIN_ACCESS_KEY>
  // (the key lives in .env). That sets a short-lived httpOnly cookie, after which
  // /admin works IN THAT BROWSER — and still only for a super-admin account.
  const adminKey = process.env.ADMIN_ACCESS_KEY;
  const secretEntrance = adminKey ? `/admin-${adminKey}` : null;
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');

  // 1) Secret entrance. You must be signed in as a SUPER ADMIN to unlock.
  //    - not signed in       → send to login, then back to this secret URL
  //    - signed in, not super → home (wrong account)
  //    - super admin          → set the unlock cookie and open /admin
  if (secretEntrance && pathname === secretEntrance) {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/sign-up-login-screen?redirect=${encodeURIComponent(secretEntrance)}`, request.url)
      );
    }
    if (!isSuperAdmin(user.email)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    const res = NextResponse.redirect(new URL('/admin', request.url));
    res.cookies.set('sc_admin_unlock', adminKey!, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });
    return res;
  }

  // 2) The real /admin area: require the unlock cookie AND a super-admin session.
  //    Anything missing → bounce to the homepage so the panel stays invisible.
  if (isAdminArea) {
    const unlocked = !adminKey || request.cookies.get('sc_admin_unlock')?.value === adminKey;
    const allowed = !!user && isSuperAdmin(user.email) && unlocked;
    if (!allowed) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // /staff remains open to regular admins (user_profiles.is_admin).
  if (isAuthenticated && user && pathname.startsWith('/staff')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin && !isSuperAdmin(user.email)) {
      const url = request.nextUrl.clone();
      url.pathname = '/student-dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
