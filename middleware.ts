import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // admin.grannis.xyz → rewrite to /admin routes
  if (hostname.startsWith("admin.")) {
    if (pathname === "/" || !pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Protect /admin routes (except login and API)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !(await verifyToken(token))) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  // willymarket.grannis.xyz → redirect to Genevieve Vercel app
  if (hostname.startsWith("willymarket.")) {
    return NextResponse.redirect("https://family-betting-market.vercel.app" + pathname, 307);
  }

  // connections.grannis.xyz → redirect to Connections Squared Vercel app
  if (hostname.startsWith("connections.")) {
    return NextResponse.redirect("https://connections-squared.vercel.app" + pathname, 307);
  }

  // rri.grannis.xyz → redirect to Railroad Ink host
  if (hostname.startsWith("rri.")) {
    const rriHost = process.env.RRI_HOST;
    if (rriHost) {
      return NextResponse.redirect(rriHost + pathname, 307);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
