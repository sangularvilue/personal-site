import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // rrt.grannis.xyz → redirect to Railroad Tiles on Render
  if (hostname.startsWith("rrt.")) {
    return NextResponse.redirect("https://railroad-ink.onrender.com" + pathname);
  }

  // admin.grannis.xyz → rewrite to /admin routes (with auth)
  if (hostname.startsWith("admin.")) {
    // Map subdomain paths to /admin/* paths
    // If already prefixed with /admin (e.g. after redirect), don't double-prefix
    const adminPath = pathname.startsWith("/admin")
      ? pathname
      : pathname === "/"
        ? "/admin"
        : `/admin${pathname}`;

    // Let /api/* routes pass through without rewrite or auth
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    const isLoginPage = adminPath === "/admin/login";

    if (!isLoginPage) {
      const token = request.cookies.get("admin_token")?.value;
      if (!token || !(await verifyToken(token))) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/admin/login";
        return NextResponse.redirect(loginUrl);
      }
    }

    // Rewrite to the /admin path if not already there
    if (!pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = adminPath;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
