import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/5 w-[500px] h-[500px] rounded-full bg-teal/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/5 w-[400px] h-[400px] rounded-full bg-sand/[0.03] blur-[100px] pointer-events-none" />

      <div className="text-center animate-rise">
        <h1 className="font-sans text-[clamp(1.6rem,4vw,2.4rem)] font-semibold tracking-tight text-text mb-14">
          Will Grannis
        </h1>
        <nav className="flex items-center justify-center gap-6 max-sm:flex-col max-sm:gap-4">
          <Link
            href="/arts"
            className="group flex flex-col items-center gap-2 px-12 py-7 glass transition-all duration-500 hover:bg-glass-hover hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(212,197,169,0.08)] relative overflow-hidden"
          >
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_center,rgba(212,197,169,0.06),transparent_70%)]" />
            <span className="font-serif text-sand text-2xl font-medium relative">
              Arts
            </span>
            <span className="text-xs text-text-soft relative">
              things I write
            </span>
          </Link>

          <span className="font-serif italic text-xl text-text-soft/30 select-none max-sm:hidden">
            &
          </span>

          <Link
            href="/crafts"
            className="group flex flex-col items-center gap-2 px-12 py-7 glass transition-all duration-500 hover:bg-glass-hover hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(73,166,181,0.08)] relative overflow-hidden"
          >
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_center,rgba(73,166,181,0.06),transparent_70%)]" />
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
