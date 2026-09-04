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
    url.pathname = '/login';
    // Preserve the intended destination so login returns the user here.
    url.search = `?redirect=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  // ── Admin Area Access Control ─────────────────────────────────────────────
  const adminKey = process.env.ADMIN_ACCESS_KEY;
  const secretEntrance = adminKey ? `/admin-${adminKey}` : null;
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');

  // 1) Secret entrance handling: sets unlock cookie for super admin
  if (secretEntrance && pathname === secretEntrance) {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/login?redirect=${encodeURIComponent(secretEntrance)}`, request.url)
      );
    }
    if (!isSuperAdmin(user.email)) {
      const url = request.nextUrl.clone();
      url.pathname = '/student-dashboard';
      url.search = '?error=unauthorized_admin';
      return NextResponse.redirect(url);
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

  // 2) Protected /admin area access control:
  //    - If not logged in -> redirect to login with redirect back to /admin
  //    - If logged in but not super admin -> redirect to student dashboard with error
  //    - If super admin -> allow access with noindex headers
  if (isAdminArea) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = `?redirect=${encodeURIComponent(pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }

    if (!isSuperAdmin(user.email)) {
      const url = request.nextUrl.clone();
      url.pathname = '/student-dashboard';
      url.search = '?error=unauthorized_admin';
      return NextResponse.redirect(url);
    }

    // Add security and noindex headers for admin area
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  // 3) Staff area (/staff and /staff/*) access control
  if (pathname === '/staff' || pathname.startsWith('/staff/')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = `?redirect=${encodeURIComponent(pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin && !isSuperAdmin(user.email)) {
      const url = request.nextUrl.clone();
      url.pathname = '/student-dashboard';
      url.search = '?error=staff_access_required';
      return NextResponse.redirect(url);
    }

    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
