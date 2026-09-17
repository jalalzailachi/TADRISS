import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest, response?: NextResponse) {
  const supabaseResponse = response || NextResponse.next({ request });

  // Ensure a default locale is set if missing
  if (!request.cookies.has('locale')) {
    supabaseResponse.cookies.set('locale', 'fr')
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  
  const matchesPath = (path: string) => 
    pathname === path || (path !== '/' && pathname.startsWith(`${path}/`));

  const isAuthPage = 
    matchesPath('/login') ||
    matchesPath('/signup') ||
    matchesPath('/reset-password') ||
    matchesPath('/auth');

  const isPublicPage = matchesPath('/');

  // Unauthenticated guests: securely redirect from protected routes to login
  if (!user && !isAuthPage && !isPublicPage) {
    const url = new URL('/login', request.url);
    const redirectResponse = NextResponse.redirect(url);
    // Copy cookies from supabaseResponse to ensure session markers are preserved
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // Resolve role once — used both for home redirect and per-route guard
  let role: string | null = null;
  if (user) {
    const profileRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      }
    );
    const profiles = await profileRes.json();
    role = profiles?.[0]?.role ?? null;
  }

  const roleHome: Record<string, string> = {
    institution_admin: '/dashboard',
    teacher: '/teacher',
    student: '/student',
    super_admin: '/super',
  };

  const redirectTo = (dest: string) => {
    const url = new URL(dest, request.url);
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };

  // Authenticated users: bypass auth/public pages into role-specific home
  if (user && (isAuthPage || isPublicPage)) {
    return redirectTo(roleHome[role ?? ''] ?? '/dashboard');
  }

  // Per-route role enforcement
  if (user && role) {
    const isDashboardRoute = matchesPath('/dashboard');
    const isTeacherRoute = matchesPath('/teacher');
    const isStudentRoute = matchesPath('/student');
    const isSuperRoute = matchesPath('/super');

    const allowed =
      (isDashboardRoute && (role === 'institution_admin' || role === 'super_admin')) ||
      (isTeacherRoute && role === 'teacher') ||
      (isStudentRoute && role === 'student') ||
      (isSuperRoute && role === 'super_admin') ||
      (!isDashboardRoute && !isTeacherRoute && !isStudentRoute && !isSuperRoute);

    if (!allowed) {
      return redirectTo(roleHome[role] ?? '/login');
    }
  }

  return supabaseResponse;
}
