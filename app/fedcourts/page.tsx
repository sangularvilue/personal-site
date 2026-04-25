import Link from "next/link";
import { currentUser } from "@/lib/fc-auth";

const games = [
  { href: "/drills", title: "Adaptive Drills", meta: "rated · mixed categories" },
  { href: "/speed", title: "Speed Drill", meta: "ten timed · by category" },
  { href: "/prong", title: "Which Prong?", meta: "apply the test" },
  { href: "/match", title: "Case Match", meta: "concentration" },
  { href: "/builder", title: "Rule Builder", meta: "construct the test" },
  { href: "/daily", title: "Hypothetical of the Day", meta: "one shot · daily reset" },
  { href: "/case-wordle", title: "Case Wordle", meta: "five clues" },
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export default async function FCHome() {
  const user = await currentUser();
  const now = new Date();
  const year = now.toLocaleDateString("en-US", { year: "numeric" });
  const yearRoman = arabicToRoman(parseInt(year, 10));

  return (
    <>
      <div className="fc-edition">
        <span>Vol. I</span>
        <span>No. 1</span>
        <span>Anno {yearRoman}</span>
      </div>

      <h1 className="fc-h1">Federal Courts.</h1>

      <p className="fc-sub">
        {user ? (
          <>Welcome back, <em>{user.display_name}</em>. The bench is yours.</>
        ) : (
          <>A drilling-ground for the doctrines that decide who decides — standing, justiciability, jurisdiction, the works. Sign up to keep score.</>
        )}
      </p>

      <div className="fc-section-mark" aria-hidden>§</div>

      <h2 className="fc-h2">Table of Contents</h2>

      <ol className="fc-toc">
        {games.map((g, i) => (
          <li key={g.href}>
            <Link href={g.href} className="fc-toc-row">
              <span className="fc-toc-num">{ROMAN[i]}.</span>
              <span className="fc-toc-name">
                {g.title}
                <span className="fc-toc-leader" aria-hidden />
              </span>
              <span className="fc-toc-meta">{g.meta}</span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="fc-section-mark" aria-hidden>§</div>

      <p
        style={{
          fontFamily: "var(--fc-serif)",
          fontStyle: "italic",
          color: "var(--fc-ink-soft)",
          fontSize: "0.95rem",
          textAlign: "center",
          maxWidth: "32rem",
          margin: "0 auto",
        }}
      >
        Course outline: Prof. Kamin, Spring {year}.
        Daily edition published at midnight, Eastern Standard Time.
      </p>
    </>
  );
}

function arabicToRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  for (const [v, s] of map) {
    while (n >= v) {
      result += s;
      n -= v;
    }
  }
  return result;
}
