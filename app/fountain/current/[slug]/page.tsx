import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllCurrents,
  getBalladsByCurrentId,
  getCurrentBySlug,
} from "@/lib/fountain";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export default async function CurrentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const current = await getCurrentBySlug(slug);
  if (!current) notFound();

  const ballads = await getBalladsByCurrentId(current.id);

  const balladHtml = await Promise.all(
    ballads.map(async (b) => ({
      ...b,
      html: await renderMarkdown(b.content),
    }))
  );

  const currents = await getAllCurrents();
  const idx = currents.findIndex((c) => c.id === current.id);
  const prev = idx > 0 ? currents[idx - 1] : null;
  const next = idx >= 0 && idx < currents.length - 1 ? currents[idx + 1] : null;

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <Link
        href="/fountain"
        className="text-sm text-text-soft hover:text-text transition-colors mb-8 inline-block"
      >
        &larr; the fountain
      </Link>

      <article>
        <header className="mb-10 pb-6 border-b border-glass-border">
          <span className="text-[0.72rem] uppercase tracking-widest text-sand-dim font-semibold">
            Current
          </span>
          <h1 className="font-serif text-sand text-[clamp(1.8rem,4vw,2.5rem)] font-medium mt-2 mb-3">
            The Current of {current.name}
          </h1>
          {current.openingVerse && (
            <blockquote className="border-l-2 border-sand/30 pl-4 mt-5 text-text-soft font-serif italic whitespace-pre-line leading-relaxed">
              {current.openingVerse}
            </blockquote>
          )}
        </header>

        {balladHtml.length === 0 ? (
          <p className="text-text-soft font-serif italic">
            No ballads have been written for this current yet.
          </p>
        ) : (
          <div className="space-y-16">
            {balladHtml.map((b) => (
              <section key={b.id} id={b.slug} className="scroll-mt-12">
                <header className="mb-6">
                  <Link
                    href={`/fountain/ballad/${b.slug}`}
                    className="font-serif text-sand text-2xl font-medium hover:text-text transition-colors"
                  >
                    The Ballad of {b.title}
                  </Link>
                </header>
                {b.content.trim() ? (
                  <div
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: b.html }}
                  />
                ) : (
                  <p className="text-text-soft/60 font-serif italic text-sm">
                    Not yet written.
                  </p>
                )}
              </section>
            ))}
          </div>
        )}

        <nav className="mt-20 pt-6 border-t border-glass-border flex justify-between gap-4 text-sm">
          {prev ? (
            <Link
              href={`/fountain/current/${prev.slug}`}
              className="text-text-soft hover:text-sand transition-colors font-serif"
            >
              &larr; The Current of {prev.name}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/fountain/current/${next.slug}`}
              className="text-text-soft hover:text-sand transition-colors font-serif text-right"
            >
              The Current of {next.name} &rarr;
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </main>
  );
}
