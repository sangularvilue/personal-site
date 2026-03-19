import Link from "next/link";

const projects = [
  {
    name: "ForkLift",
    tag: "ios · swift",
    desc: "Workout tracker for iOS. Log sets, reps, and weight with minimal taps. Tracks personal records, visualizes progress over time, and builds routines you can reuse.",
    href: "https://apps.apple.com/app/forklift-workout-tracker/id6504765752",
  },
  {
    name: "Willymarket",
    tag: "next.js · redis · vercel",
    desc: "Family prediction exchange. Three market types, real-time order matching, position tracking, and margin calculations.",
    href: "https://willymarket.grannis.xyz",
  },
  {
    name: "Even Apps",
    tag: "vite · smart glasses",
    desc: "Multi-app platform for Even G2 smart glasses. Chess, transit, weather, epub reader, and more — plus a custom launcher and dev environment.",
    href: "https://github.com/sangularvilue/even-apps",
  },
  {
    name: "Connections²",
    tag: "next.js · react 19",
    desc: "A new spin on the word puzzle format. In progress.",
    href: "https://connections.grannis.xyz",
  },
  {
    name: "Railroad Ink",
    tag: "python · fastapi · websockets",
    desc: "Online multiplayer Railroad Ink. Real-time tile placement, rotation, scoring, and an in-app rules reference.",
    href: "https://rri.grannis.xyz",
  },
];

export default function Crafts() {
  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <header className="mb-12 pb-6 border-b border-border">
        <Link
          href="/"
          className="text-sm text-text-soft hover:text-text transition-colors mb-6 inline-block"
        >
          &larr; back
        </Link>
        <h2 className="font-mono text-teal text-[clamp(2rem,5vw,3rem)] font-medium mb-1">
          Crafts
        </h2>
        <p className="text-sm text-text-soft tracking-wide">things I build</p>
      </header>

      <div className="space-y-3.5">
        {projects.map((p) => (
          <a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-5 border border-border rounded-xl transition-all duration-250 hover:border-teal/30 hover:bg-teal-dim hover:-translate-y-px"
          >
            <div className="flex items-baseline justify-between gap-4 mb-2 flex-wrap max-sm:flex-col max-sm:gap-0.5">
              <h3 className="font-mono text-base font-medium text-text">
                {p.name}
              </h3>
              <span className="text-[0.7rem] text-text-soft font-mono tracking-wide whitespace-nowrap">
                {p.tag}
              </span>
            </div>
            <p className="text-sm text-text-soft leading-relaxed">{p.desc}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
