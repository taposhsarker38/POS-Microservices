import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const PUBLIC_PAGES = ["/", "/login", "/login/forgot"];
export function middleware(req: NextRequest) {
  console.log("Middleware running for", req.nextUrl.pathname);
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api"))
    return NextResponse.next();
  const access = req.cookies.get("access")?.value;
  const refresh = req.cookies.get("refresh_token")?.value;
  const isAuthenticated = Boolean(access || refresh);
  const isPublic =
    PUBLIC_PAGES.includes(pathname) ||
    PUBLIC_PAGES.some((p) => pathname.startsWith(p + "/"));
  if (!isAuthenticated && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (isAuthenticated && (pathname === "/" || pathname === "/login")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
