import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_20%_50%,rgba(73,166,181,0.04)_0%,transparent_60%),radial-gradient(ellipse_at_80%_50%,rgba(212,197,169,0.03)_0%,transparent_60%)]">
      <div className="text-center animate-rise">
        <h1 className="font-sans text-[clamp(1.6rem,4vw,2.4rem)] font-semibold tracking-tight text-text mb-14">
          Will Grannis
        </h1>
        <nav className="flex items-center justify-center gap-6 max-sm:flex-col max-sm:gap-4">
          <Link
            href="/arts"
            className="group flex flex-col items-center gap-1.5 px-11 py-6 border border-border rounded-2xl transition-all duration-300 hover:border-text-soft hover:-translate-y-0.5 relative overflow-hidden"
          >
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(ellipse_at_center,rgba(212,197,169,0.08),transparent_70%)]" />
            <span className="font-serif text-sand text-2xl font-medium relative">
              Arts
            </span>
            <span className="text-xs text-text-soft relative">
              things I write
            </span>
          </Link>

          <span className="font-serif italic text-xl text-text-soft opacity-50 select-none max-sm:hidden">
            &
          </span>

          <Link
            href="/crafts"
            className="group flex flex-col items-center gap-1.5 px-11 py-6 border border-border rounded-2xl transition-all duration-300 hover:border-text-soft hover:-translate-y-0.5 relative overflow-hidden"
          >
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(ellipse_at_center,rgba(73,166,181,0.08),transparent_70%)]" />
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
