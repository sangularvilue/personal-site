import GlassCard from "./components/glass-card";

export default function Landing() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="text-center animate-rise">
        <h1 className="font-sans text-[clamp(1.6rem,4vw,2.4rem)] font-semibold tracking-tight text-text mb-14">
          Will Grannis
        </h1>
        <nav className="flex items-center justify-center gap-6 max-sm:flex-col max-sm:gap-4">
          <GlassCard href="/arts" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2 px-12 py-7">
              <span className="font-serif text-sand text-2xl font-medium">
                Arts
              </span>
              <span className="text-xs text-text-soft">things I write</span>
            </div>
          </GlassCard>

          <span className="font-serif italic text-xl text-text-soft/20 select-none max-sm:hidden">
            &
          </span>

          <GlassCard href="/crafts" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2 px-12 py-7">
              <span className="font-mono text-teal text-lg font-medium">
                Crafts
              </span>
              <span className="text-xs text-text-soft">things I build</span>
            </div>
          </GlassCard>
        </nav>
      </div>
    </main>
  );
}
