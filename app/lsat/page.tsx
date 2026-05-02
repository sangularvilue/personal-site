import Link from "next/link";
import { currentUser } from "@/lib/lsat-auth";
import { arabicToRoman } from "@/lib/lsat-types";

const chapters = [
  {
    href: "/drill",
    title: "Adaptive Drill",
    meta: "fifteen, mixed",
    sub: "Weighted to your weaker skills.",
  },
  {
    href: "/speed",
    title: "Speed Drill",
    meta: "ten, timed",
    sub: "Sixty seconds each. Score = accuracy × time × streak.",
  },
  {
    href: "/skill",
    title: "By Skill",
    meta: "fifteen of one kind",
    sub: "Choose one of the eight skills.",
  },
  {
    href: "/section",
    title: "By Section",
    meta: "RC · LR · LG",
    sub: "Practice questions of one section type only.",
  },
  {
    href: "/marathon",
    title: "Marathon",
    meta: "twenty-five, untimed",
    sub: "For stamina, not for points.",
  },
];

export default async function LSATHome() {
  const user = await currentUser();
  const now = new Date();
  const yearRoman = arabicToRoman(now.getFullYear());

  return (
    <>
      <div className="lsat-edition">
        <span>Vol. <em>I</em></span>
        <span>No. <em>I</em></span>
        <span>Anno {yearRoman}</span>
      </div>

      <h1 className="lsat-h1">
        A Practice <em>Book</em>.
      </h1>

      <p className="lsat-sub">
        {user ? (
          <>
            Welcome back, <em>{user.display_name}</em>. Take up the pen.
          </>
        ) : (
          <>
            A practice book for the LSAT, kept by every reader. Drill, by
            skill or section. Every answer keeps a ribbon. Sign up to keep
            score.
          </>
        )}
      </p>

      <div className="lsat-fleuron" aria-hidden>
        <span>❦</span><span>❧</span><span>❦</span>
      </div>

      <h2 className="lsat-h2">Table of Contents</h2>

      <ol className="lsat-toc">
        {chapters.map((c, i) => (
          <li key={c.href}>
            <Link href={c.href} className="lsat-toc-row">
              <span className="lsat-toc-num">{toRoman(i + 1)}.</span>
              <span className="lsat-toc-name">
                {c.title}
                <span className="lsat-toc-leader" aria-hidden />
              </span>
              <span className="lsat-toc-meta">{c.meta}</span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="lsat-fleuron" aria-hidden>
        <span>⁂</span>
      </div>

      <p className="lsat-footnote">
        Source: official LSAC released PrepTests, normalized & tagged.
        Each question carries one of eight skills. The signature ribbon
        falls from the page on every answer.
      </p>
    </>
  );
}

function toRoman(n: number): string {
  return arabicToRoman(n);
}
