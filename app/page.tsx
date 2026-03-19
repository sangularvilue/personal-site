import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="text-center animate-rise">
        <h1 className="font-sans text-[clamp(1.6rem,4vw,2.4rem)] font-semibold tracking-tight text-text mb-14">
          Will Grannis
        </h1>
        <nav className="flex items-center justify-center gap-6 max-sm:flex-col max-sm:gap-4">
          <Link
            href="/arts"
            className="group flex flex-col items-center gap-2 px-12 py-7 glass glass-shimmer transition-all duration-500 hover:bg-glass-hover hover:-translate-y-1.5 hover:shadow-[0_12px_48px_rgba(212,197,169,0.1),inset_0_1px_0_rgba(255,255,255,0.12)] relative"
          >
            <span className="font-serif text-sand text-2xl font-medium relative">
              Arts
            </span>
            <span className="text-xs text-text-soft relative">
              things I write
            </span>
          </Link>

          <span className="font-serif italic text-xl text-text-soft/20 select-none max-sm:hidden">
            &
          </span>

          <Link
            href="/crafts"
            className="group flex flex-col items-center gap-2 px-12 py-7 glass glass-shimmer transition-all duration-500 hover:bg-glass-hover hover:-translate-y-1.5 hover:shadow-[0_12px_48px_rgba(73,166,181,0.1),inset_0_1px_0_rgba(255,255,255,0.12)] relative"
          >
            <span className="font-mono text-teal text-lg font-medium relative">
              Crafts
            </span>
            <span className="text-xs text-text-soft relative">
              things I build
            </span>
          </Link>
        </nav>
      </div>
    </main>
  );
}
