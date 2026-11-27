import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSuperAdmin } from '@/lib/config/superAdmin';
import { normalizeRoleType, isStaffRole, isTeacher, isAdmin } from '@/lib/auth/rbac';

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

// Short-lived 30s role cache to avoid repetitive DB round-trips on rapid navigation
const roleCache = new Map<string, { is_banned?: boolean; is_admin?: boolean; role?: string; ts: number }>();
const ROLE_CACHE_TTL_MS = 30_000;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Classify route before doing any network I/O
  const protectedPaths = [
    '/student-dashboard',
    '/my-courses',
    '/onboarding',
    '/dashboard',
    '/profile',
    '/account',
    '/checkout',
    '/payment-success',
    '/activate-plan',
  ];
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isTeacherArea = pathname === '/teacher' || pathname.startsWith('/teacher/');
  const isStaffArea = pathname === '/staff' || pathname.startsWith('/staff/');
  const isAdminLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/');
  const isAdminArea = (pathname === '/admin' || pathname.startsWith('/admin/')) && !isAdminLogin;
  const adminKey = process.env.ADMIN_ACCESS_KEY;
  const secretEntrance = adminKey ? `/admin-${adminKey}` : null;
  const isSecretEntrance = Boolean(secretEntrance && pathname === secretEntrance);
  const isAuthPage = pathname === '/login' || pathname === '/signup' || isAdminLogin || pathname.startsWith('/auth/');

  const requiresAuthCheck = isProtected || isTeacherArea || isStaffArea || isAdminArea || isSecretEntrance;

  // FAST PATH 1: Public pages & login pages do NOT need remote Supabase round-trips in middleware
  if (!requiresAuthCheck) {
    const res = NextResponse.next({ request });
    if (isAuthPage) {
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.headers.set('Pragma', 'no-cache');
    }
    return res;
  }

  injectTokenFromHeader(request);

  // FAST PATH 2: If no Supabase auth cookie exists at all, redirect immediately in 0ms without network call
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-') || c.name.includes('auth-token'));
  if (!hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = isAdminArea || isSecretEntrance ? '/admin/login' : '/login';
    url.search = `?redirect=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

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

  const isAuthenticated = !!user;

  // 1. General Student Protected Routes
  if (!isAuthenticated && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?redirect=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  // FAST PATH 3: Super-Admin email allowlist short-circuit + 30s cached profile lookup
  let userProfile: { is_banned?: boolean; is_admin?: boolean; role_name?: string; role?: string } | null = null;
  const userIsSuperAdmin = isAuthenticated && user ? isSuperAdmin(user.email) : false;

  if (isAuthenticated && user && !userIsSuperAdmin) {
    const cached = roleCache.get(user.id);
    if (cached && Date.now() - cached.ts < ROLE_CACHE_TTL_MS) {
      userProfile = cached;
    } else {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      userProfile = profile as any;
      if (profile) {
        roleCache.set(user.id, {
          is_banned: profile.is_banned,
          is_admin: profile.is_admin,
          role: profile.role || profile.role_name,
          ts: Date.now(),
        });
      }
    }

    if (userProfile?.is_banned) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '?error=account_suspended';
      return NextResponse.redirect(url);
    }
  }

  const effectiveRole = isAuthenticated && user
    ? (userIsSuperAdmin
        ? 'super_admin'
        : normalizeRoleType(userProfile?.role || userProfile?.role_name, userProfile?.is_admin))
    : 'visitor';

  // 2. Teacher Area Access Control (/teacher and /teacher/*)
  if (isTeacherArea) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = `?redirect=${encodeURIComponent(pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }

    if (!isTeacher(effectiveRole)) {
      const url = request.nextUrl.clone();
      url.pathname = '/student-dashboard';
      url.search = '?error=teacher_required';
      return NextResponse.redirect(url);
    }

    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  // 3. Admin Area Access Control (/admin and /admin/*)
  // Secret entrance handling
  if (isSecretEntrance && secretEntrance) {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/admin/login?redirect=${encodeURIComponent(secretEntrance)}`, request.url)
      );
    }
    if (!isSuperAdmin(user.email)) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = '?error=unauthorized_admin&redirect=/admin/dashboard';
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
      url.pathname = '/admin/login';
      url.search = `?redirect=${encodeURIComponent(pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }

    const isFullAdmin = isAdmin(effectiveRole);
    const isPayStaff = effectiveRole === 'payment_staff';
    const isSupport = effectiveRole === 'support_staff';
    const isContentOrTeacher = effectiveRole === 'content_manager' || effectiveRole === 'teacher';

    if (!isFullAdmin && !isPayStaff && !isSupport && !isContentOrTeacher) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = `?redirect=${encodeURIComponent(pathname + request.nextUrl.search)}&reason=${encodeURIComponent('Please sign in with an Admin or Faculty account to access the Admin Portal.')}`;
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
        '/admin/prebookings',
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

    // Restrict support staff strictly to student support, doubts, leads, and announcements
    if (isSupport && !isFullAdmin) {
      const allowedSupportPaths = [
        '/admin/doubts',
        '/admin/leads',
        '/admin/users',
        '/admin/announcements',
      ];
      const isAllowed = allowedSupportPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
      if (!isAllowed) {
        const url = request.nextUrl.clone();
        url.pathname = '/staff';
        url.search = '?error=support_role_restricted';
        return NextResponse.redirect(url);
      }
    }

    // Restrict content managers & teachers to academic content modules within /admin
    if (isContentOrTeacher && !isFullAdmin) {
      const allowedContentPaths = [
        '/admin/doubts',
        '/admin/ai-review',
        '/admin/uploads',
        '/admin/questions',
        '/admin/lessons',
        '/admin/chapters',
        '/admin/subjects',
        '/admin/resources',
        '/admin/flashcards',
        '/admin/exams',
        // CEE visual CMS: these pages hold no data themselves; every read and
        // write goes through /api/v1/cee/admin, which requires a scoped CEE role.
        '/admin/cee-visual',
      ];
      const isAllowed = allowedContentPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
      if (!isAllowed) {
        const url = request.nextUrl.clone();
        url.pathname = effectiveRole === 'teacher' ? '/teacher' : '/staff';
        url.search = '?error=academic_role_restricted';
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

    if (!isStaffRole(effectiveRole)) {
      const url = request.nextUrl.clone();
      url.pathname = '/student-dashboard';
      url.search = '?error=staff_access_required';
      return NextResponse.redirect(url);
    }

    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  // 5. Auth Page Security Headers (prevent caching login pages)
  if (isAuthPage) {
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    supabaseResponse.headers.set('Pragma', 'no-cache');
  }

  // 6. Prevent cached views of protected pages (browser back-button after logout)
  if (isProtected || isAdminArea) {
    supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    supabaseResponse.headers.set('Pragma', 'no-cache');
    supabaseResponse.headers.set('Expires', '0');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
