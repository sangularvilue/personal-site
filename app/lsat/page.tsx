import Link from "next/link";
import { currentUser } from "@/lib/lsat-auth";

const modes = [
  {
    href: "/drill",
    eyebrow: "Adaptive",
    title: "Drill",
    desc: "Mixed questions targeted to your weakest skills. Every attempt updates your rating.",
  },
  {
    href: "/speed",
    eyebrow: "10 / Timed",
    title: "Speed Drill",
    desc: "Ten questions, sixty seconds each. Score combines accuracy, speed, and streak.",
  },
  {
    href: "/skill",
    eyebrow: "Focus",
    title: "Skill Focus",
    desc: "Pick one of the eight skills. Practice until your rating climbs.",
  },
  {
    href: "/section",
    eyebrow: "RC · LR · LG",
    title: "Section Focus",
    desc: "Practice questions of one section type only.",
  },
  {
    href: "/marathon",
    eyebrow: "Endurance",
    title: "Marathon",
    desc: "Twenty-five questions in a row. Built for stamina, not for points.",
  },
];

export default async function LSATHome() {
  const user = await currentUser();
  return (
    <>
      <h1 className="lsat-h1">LSAT Drill.</h1>
      <p className="lsat-sub">
        {user ? (
          <>
            Welcome back, <em>{user.display_name}</em>. Pick a mode and get to
            work.
          </>
        ) : (
          <>
            A practice ground for the LSAT, built on the official released
            tests. Each question is tagged with one of eight skills; your
            rating in each climbs (or sinks) with every answer. Sign up to
            keep score.
          </>
        )}
      </p>

      <h2 className="lsat-h2">Modes</h2>

      <div className="lsat-tile-grid">
        {modes.map((m) => (
          <Link key={m.href} href={m.href} className="lsat-tile">
            <div className="lsat-tile-eyebrow">{m.eyebrow}</div>
            <div className="lsat-tile-title">{m.title}</div>
            <div className="lsat-tile-desc">{m.desc}</div>
          </Link>
        ))}
      </div>

      <hr className="lsat-rule" />

      <p
        style={{
          color: "var(--lsat-ink-soft)",
          fontStyle: "italic",
          fontSize: "0.92rem",
          textAlign: "center",
          maxWidth: "32rem",
          margin: "0 auto",
        }}
      >
        Source: official LSAC released PrepTests, normalized + tagged.
        Logged in users have every attempt saved.
      </p>
    </>
  );
}
