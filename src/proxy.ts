import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const GATE_COOKIE_NAME = "fc_gate";
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "photo-contest-gate-secret-key-2026"
);

export async function proxy(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;

  // If no site password is set, open access
  if (!sitePassword || sitePassword.trim().length === 0) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Whitelisted paths that do not require the gate password
  if (
    pathname.startsWith("/gate") ||
    pathname.startsWith("/api/gate") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/uploads")
  ) {
    return NextResponse.next();
  }

  const gateToken = request.cookies.get(GATE_COOKIE_NAME)?.value;

  if (gateToken) {
    try {
      const { payload } = await jwtVerify(gateToken, SECRET_KEY);
      if (payload && payload.gateAccess === true) {
        return NextResponse.next();
      }
    } catch {
      // Invalid token, fall through to redirect
    }
  }

  // Not authorized: redirect to gate
  const url = request.nextUrl.clone();
  url.pathname = "/gate";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image formats (.png, .jpg, .jpeg, .svg, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
