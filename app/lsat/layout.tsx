import type { ReactNode } from "react";
import Link from "next/link";
import { currentUser, isAdminUser } from "@/lib/lsat-auth";
import "./lsat.css";

export const metadata = {
  title: "A Practice Book — LSAT",
  description:
    "A practice book for the LSAT. Drill, by skill or section, in a private commonplace book. Every answer keeps a ribbon.",
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
          A&nbsp;Practice<span className="lsat-brand-dot">·</span>Book
        </Link>
        <div className="lsat-nav-right">
          <Link href="/leaderboard">Leaderboard</Link>
          {user ? (
            <>
              <Link href="/me">{user.display_name}</Link>
              {admin && <span className="lsat-admin-pill">Editor</span>}
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
