import Link from "next/link";
import GlassCard from "../components/glass-card";
import { seedCraftsIfEmpty } from "@/lib/crafts";

export const dynamic = "force-dynamic";

export default async function Crafts() {
  const projects = await seedCraftsIfEmpty();

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[1100px] mx-auto animate-rise">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {projects.map((p) => (
          <GlassCard
            key={p.id}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer group h-full"
          >
            <div className="p-5 flex flex-col h-full">
              <h3 className="font-mono text-base font-medium text-text group-hover:text-teal transition-colors mb-1">
                {p.name}
              </h3>
              <span className="text-[0.65rem] text-text-soft/60 font-mono tracking-wide mb-3">
                {p.tag}
              </span>
              <p className="text-sm text-text-soft leading-relaxed">{p.desc}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </main>
  );
}
