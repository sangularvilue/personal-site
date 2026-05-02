import type { ReactNode } from "react";
import Link from "next/link";
import { currentUser, isAdminUser } from "@/lib/lsat-auth";
import "./lsat.css";

export const metadata = {
  title: "LSAT Drill — A practice ground for the real test",
  description:
    "Drill official LSAT questions by skill. Adaptive ratings, live leaderboard, every attempt logged.",
};

export default async function LSATLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  const admin = isAdminUser(user);
  return (
    <div className="lsat-root" data-admin={admin ? "1" : "0"}>
      <nav className="lsat-nav">
        <Link href="/" className="lsat-brand">
          LSAT<span className="lsat-brand-dot">·</span>Drill
        </Link>
        <div className="lsat-nav-right">
          <Link href="/leaderboard">Leaderboard</Link>
          {user ? (
            <>
              <Link href="/me">{user.display_name}</Link>
              {admin && (
                <span className="lsat-admin-pill" title="Admin">
                  admin
                </span>
              )}
              <form action="/api/lsat/logout" method="post">
                <button className="lsat-btn-link" type="submit">
                  log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup" className="lsat-btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
      <main className="lsat-main">{children}</main>
    </div>
  );
}
