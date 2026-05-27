import Link from "next/link";
import { getFountainTree } from "@/lib/fountain";

export const dynamic = "force-dynamic";

export default async function FountainTOC() {
  const tree = await getFountainTree();

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <Link
        href="/arts"
        className="text-sm text-text-soft hover:text-text transition-colors mb-8 inline-block"
      >
        &larr; back to arts
      </Link>

      <article>
        <header className="mb-12 pb-6 border-b border-glass-border">
          <h1 className="font-serif text-sand text-[clamp(2rem,5vw,3rem)] font-medium">
            The Fountain
          </h1>
        </header>

        {tree.length === 0 ? (
          <p className="text-text-soft font-serif italic py-8">
            The fountain has not begun to flow.
          </p>
        ) : (
          <div className="space-y-14">
            {tree.map((current) => (
              <section key={current.id}>
                <Link
                  href={`/fountain/current/${current.slug}`}
                  className="group block mb-2"
                >
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-sand-dim font-semibold">
                    Current
                  </span>
                  <h2 className="font-serif text-sand text-2xl font-medium mt-1 group-hover:text-text transition-colors">
                    The Current of {current.name}
                  </h2>
                </Link>

                {current.ballads.length === 0 ? (
                  <p className="text-text-soft/60 font-serif italic text-sm mt-3">
                    No ballads yet.
                  </p>
                ) : (
                  <ol className="mt-4 space-y-0">
                    {current.ballads.map((ballad, i) => (
                      <li key={ballad.id}>
                        <Link
                          href={`/fountain/ballad/${ballad.slug}`}
                          className="flex items-baseline gap-4 py-3 border-b border-border/40 hover:pl-2 transition-all group"
                        >
                          <span className="font-mono text-xs text-sand-dim w-6 tabular-nums">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="flex-1 font-serif text-text text-base group-hover:text-sand transition-colors">
                            The Ballad of {ballad.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ))}
          </div>
        )}
      </article>
    </main>
  );
}
