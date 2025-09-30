// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/register', '/forgot-password'];
const authRoutes = ['/login', '/register'];
const apiAuthRoutes = ['/api/auth/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  // API route protection
  if (pathname.startsWith('/api/') && !apiAuthRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Redirect authenticated users from auth routes
  if (token && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users from protected routes
  if (!token && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};