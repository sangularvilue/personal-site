import type { ReactNode } from "react";
import Link from "next/link";
import { currentUser } from "@/lib/fc-auth";
import "./fedcourts.css";

export const metadata = {
  title: "Fed Courts — A drilling-ground for the doctrines",
  description: "Drill federal courts skills. Adaptive ratings, daily hypotheticals, leaderboard.",
};

export default async function FCLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  return (
    <div className="fc-root">
      <nav className="fc-nav">
        <Link href="/" className="fc-brand">
          Fed<span className="fc-brand-dot">·</span>Courts
        </Link>
        <div className="fc-nav-right">
          <Link href="/leaderboard">Leaderboard</Link>
          {user ? (
            <>
              <Link href="/me">{user.display_name}</Link>
              <form action="/api/fc/logout" method="post">
                <button className="fc-btn-link" type="submit">log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup" className="fc-btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </nav>
      <main className="fc-main">{children}</main>
    </div>
  );
}
