import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


const PUBLIC_PAGES = ['/login','/forgot-password'];


export function middleware(req: NextRequest) {
const { pathname } = req.nextUrl;
if (pathname.startsWith('/_next') || pathname.startsWith('/api')) return NextResponse.next();


const access = req.cookies.get('access')?.value;
const isPublic = PUBLIC_PAGES.includes(pathname) || PUBLIC_PAGES.some((p) => pathname.startsWith(p + '/login'));


if (!access && !isPublic) {
const url = req.nextUrl.clone();
url.pathname = '/login';
url.searchParams.set('next', pathname);
return NextResponse.redirect(url);
}


if (access && (pathname === '/login' || pathname === '/login')) {
const url = req.nextUrl.clone();
url.pathname = '/dashboard';
return NextResponse.redirect(url);
}


return NextResponse.next();
}


export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };