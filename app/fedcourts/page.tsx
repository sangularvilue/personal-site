import Link from "next/link";
import { currentUser } from "@/lib/fc-auth";

const games = [
  { href: "/drills", title: "Drills", desc: "Adaptive mixed-category MCQ. Adjusts to your level." },
  { href: "/speed", title: "Speed Drill", desc: "10 timed questions. Pick a category. Compete on the board." },
  { href: "/prong", title: "Which Prong?", desc: "Read a hypo, identify the failing element of the test." },
  { href: "/match", title: "Case Match", desc: "Concentration-style. Pair cases with their holdings." },
  { href: "/builder", title: "Rule Builder", desc: "Construct multi-prong tests from a tile bank." },
  { href: "/daily", title: "Daily Hypo", desc: "One hard hypo per day. Reveal at midnight EST." },
  { href: "/case-wordle", title: "Case Wordle", desc: "Guess the case in 5 tries from progressive clues." },
];

export default async function FCHome() {
  const user = await currentUser();
  return (
    <div>
      <h1 className="fc-h1">Federal Courts.</h1>
      <p className="fc-sub">
        {user
          ? `Welcome back, ${user.display_name}. Pick a game.`
          : "Drill federal courts skills. Sign up to save scores and climb the leaderboard."}
      </p>
      <div className="fc-grid">
        {games.map((g) => (
          <Link key={g.href} href={g.href} className="fc-card">
            <h3 className="fc-card-title">{g.title}</h3>
            <p className="fc-card-desc">{g.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
