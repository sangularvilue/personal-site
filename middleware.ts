import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // rrt.grannis.xyz → proxy Railroad Tiles from Render
  if (hostname.startsWith("rrt.")) {
    return NextResponse.rewrite(
      new URL("https://railroad-ink.onrender.com" + pathname),
    );
  }

  // tictactoe.grannis.xyz → proxy Hyper Tic Tac Toe from Firebase
  if (hostname.startsWith("tictactoe.")) {
    return NextResponse.rewrite(
      new URL("https://hypertictactoe-60d85.web.app" + pathname),
    );
  }

  // fedcourts.grannis.xyz → rewrite to /fedcourts routes
  if (hostname.startsWith("fedcourts.")) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    if (!pathname.startsWith("/fedcourts")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/fedcourts" : `/fedcourts${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // lsat.grannis.xyz → rewrite to /lsat routes
  if (hostname.startsWith("lsat.")) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    if (!pathname.startsWith("/lsat")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/lsat" : `/lsat${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // thenthere.grannis.xyz → rewrite to the daily history game
  if (hostname.startsWith("thenthere.")) {
    // The game gets a small, authenticated control room on the same host so
    // preview cookies stay scoped to this subdomain.
    if (pathname.startsWith("/admin")) {
      // On the game host, the useful control-room landing page is the deck
      // launcher rather than the general site CMS dashboard.
      if (pathname === "/admin") {
        const launcherUrl = request.nextUrl.clone();
        launcherUrl.pathname = "/admin/thenthere";
        return NextResponse.redirect(launcherUrl);
      }
      if (pathname !== "/admin/login") {
        const token = request.cookies.get("admin_token")?.value;
        if (!token || !(await verifyToken(token))) {
          const loginUrl = request.nextUrl.clone();
          loginUrl.pathname = "/admin/login";
          return NextResponse.redirect(loginUrl);
        }
      }
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/") || pathname.startsWith("/thenthere/"))
      return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/thenthere" : `/thenthere${pathname}`;
    return NextResponse.rewrite(url);
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
