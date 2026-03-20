import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Whitelist /dashboard, /teacher, /student
  const protectedRoutes = ['/dashboard', '/teacher', '/student', '/attendance', '/classes', '/homework', '/payments', '/settings', '/students', '/teachers'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
