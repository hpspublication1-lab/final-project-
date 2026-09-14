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

  // 1. General Student Protected Routes
  const protectedPaths = [
    '/student-dashboard',
    '/my-courses',
    '/onboarding',
    '/dashboard',
    '/account',
    '/checkout',
    '/payment-success',
    '/activate-plan',
  ];
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!isAuthenticated && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?redirect=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  // If logged in, verify account is not suspended and fetch role
  let userProfile: { is_banned?: boolean; is_admin?: boolean; role_name?: string; role?: string } | null = null;
  if (isAuthenticated && user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_banned, is_admin, role_name, role')
      .eq('id', user.id)
      .maybeSingle();

    userProfile = profile;

    if (profile?.is_banned) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '?error=account_suspended';
      return NextResponse.redirect(url);
    }

    // 2. Teacher Area Access Control (/teacher and /teacher/*)
    if (pathname === '/teacher' || pathname.startsWith('/teacher/')) {
      const role = (profile?.role_name || profile?.role || '').toLowerCase();
      const isAuthorizedTeacher = role === 'teacher' || profile?.is_admin || isSuperAdmin(user.email);
      if (!isAuthorizedTeacher) {
        const url = request.nextUrl.clone();
        url.pathname = '/student-dashboard';
        url.search = '?error=teacher_required';
        return NextResponse.redirect(url);
      }
    }
  }

  // 3. Admin Area Access Control (/admin and /admin/*)
  const adminKey = process.env.ADMIN_ACCESS_KEY;
  const secretEntrance = adminKey ? `/admin-${adminKey}` : null;
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');

  // Secret entrance handling
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

  if (isAdminArea) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = `?redirect=${encodeURIComponent(pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }

    const role = (userProfile?.role_name || userProfile?.role || '').toLowerCase();
    const isFullAdmin = isSuperAdmin(user.email) || !!userProfile?.is_admin || role === 'admin' || role === 'super_admin';
    const isPayStaff = role === 'payment_staff';

    if (!isFullAdmin && !isPayStaff) {
      const url = request.nextUrl.clone();
      url.pathname = '/student-dashboard';
      url.search = '?error=unauthorized_admin';
      return NextResponse.redirect(url);
    }

    // Restrict payment staff strictly to allowed finance paths
    if (isPayStaff && !isFullAdmin) {
      const allowedFinancePaths = [
        '/admin',
        '/admin/orders',
        '/admin/enrollments',
        '/admin/coupons',
        '/admin/activation-codes',
        '/admin/users',
      ];
      const isAllowed = allowedFinancePaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
      if (!isAllowed) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        url.search = '?error=finance_role_restricted';
        return NextResponse.redirect(url);
      }
    }

    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  // 4. Staff Area (/staff and /staff/*)
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
