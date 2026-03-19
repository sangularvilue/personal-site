import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // admin.grannis.xyz → rewrite to /admin routes (with auth)
  if (hostname.startsWith("admin.")) {
    const adminPath = pathname === "/" ? "/admin" : `/admin${pathname}`;
    const isLoginPage = adminPath === "/admin/login";

    if (!isLoginPage) {
      const token = request.cookies.get("admin_token")?.value;
      if (!token || !(await verifyToken(token))) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/admin/login";
        return NextResponse.redirect(loginUrl);
      }
    }

    if (pathname === "/" || !pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = adminPath;
      return NextResponse.rewrite(url);
    }
  }

  // Protect /admin routes accessed directly (not via subdomain)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !(await verifyToken(token))) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  // These subdomains are handled by their own Vercel projects directly:
  // - willymarket.grannis.xyz → family-betting-market project
  // - connections.grannis.xyz → connections-squared project
  // - rri.grannis.xyz → railroad-ink (once deployed)

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
