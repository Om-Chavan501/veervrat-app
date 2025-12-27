import { NextRequest, NextResponse } from "next/server";

const sessionCookieName = "veervrat_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public auth routes (no protection needed)
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.next();
  }

  // All other routes require authentication
  const sessionCookie = request.cookies.get(sessionCookieName);

  if (!sessionCookie?.value) {
    // No session, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Session exists, allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
