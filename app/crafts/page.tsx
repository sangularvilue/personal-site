import Link from "next/link";

const projects = [
  {
    name: "ForkLift",
    tag: "ios · swift",
    desc: "Workout tracker for iOS. Log sets, reps, and weight with minimal taps. Tracks personal records, visualizes progress over time, and builds routines you can reuse.",
    href: "https://apps.apple.com/us/app/forklift-workout-tracker/id6760603494",
  },
  {
    name: "Connections²",
    tag: "next.js · react 19",
    desc: "A new spin on the word puzzle format. In progress.",
    href: "https://connections.grannis.xyz",
  },
  {
    name: "Willymarket",
    tag: "next.js · redis · vercel",
    desc: "Family prediction exchange. Three market types, real-time order matching, position tracking, and margin calculations.",
    href: "https://willymarket.grannis.xyz",
  },
  {
    name: "Railroad Ink",
    tag: "python · fastapi · websockets",
    desc: "Online multiplayer Railroad Ink. Real-time tile placement, rotation, scoring, and an in-app rules reference.",
    href: "https://rri.grannis.xyz",
  },
  {
    name: "Even Backgammon",
    tag: "vite · even g2 smart glasses",
    desc: "Backgammon for the Even G2 smart glasses. Full game logic with AI opponent, rendered on a waveguide display.",
    href: "https://github.com/sangularvilue/Even-Backgammon",
  },
  {
    name: "Waveguide World",
    tag: "vite · even g2 smart glasses",
    desc: "Platformer game built for the Even G2 waveguide display. Pixel art, physics, and level design on a heads-up screen.",
    href: "https://github.com/sangularvilue/Waveguide-World",
  },
  {
    name: "Even LotH",
    tag: "express · even g2 smart glasses",
    desc: "Liturgy of the Hours on Even G2 smart glasses. Scrapes daily prayers and displays them on the waveguide.",
    href: "https://github.com/sangularvilue/Even-LotH",
  },
  {
    name: "Battleship",
    tag: "vite · even g2 smart glasses",
    desc: "Classic Battleship for the Even G2 smart glasses.",
    href: "https://github.com/sangularvilue/Battleship",
  },
];

export default function Crafts() {
  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <header className="mb-12 pb-6 border-b border-glass-border">
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

      <div className="space-y-3">
        {projects.map((p) => (
          <a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-5 glass transition-all duration-300 hover:bg-glass-hover hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(73,166,181,0.06)] group"
          >
            <div className="flex items-baseline justify-between gap-4 mb-2 flex-wrap max-sm:flex-col max-sm:gap-0.5">
              <h3 className="font-mono text-base font-medium text-text group-hover:text-teal transition-colors">
                {p.name}
              </h3>
              <span className="text-[0.7rem] text-text-soft/60 font-mono tracking-wide whitespace-nowrap">
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
