import Link from "next/link";
import { notFound } from "next/navigation";
import { getBalladBySlug, getBalladsByCurrentId } from "@/lib/fountain";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export default async function BalladPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await getBalladBySlug(slug);
  if (!found) notFound();
  const { ballad, current } = found;

  const html = await renderMarkdown(ballad.content);

  const siblings = await getBalladsByCurrentId(current.id);
  const idx = siblings.findIndex((b) => b.id === ballad.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <Link
        href="/fountain"
        className="text-sm text-text-soft hover:text-text transition-colors mb-8 inline-block"
      >
        &larr; the fountain
      </Link>

      <article>
        <header className="mb-8 pb-6 border-b border-glass-border">
          <Link
            href={`/fountain/current/${current.slug}`}
            className="text-[0.72rem] uppercase tracking-widest text-sand-dim font-semibold hover:text-sand transition-colors"
          >
            The Current of {current.name}
          </Link>
          <h1 className="font-serif text-sand text-[clamp(1.8rem,4vw,2.5rem)] font-medium mt-2 mb-1">
            The Ballad of {ballad.title}
          </h1>
        </header>

        {ballad.content.trim() ? (
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-text-soft font-serif italic">
            This ballad has yet to be written.
          </p>
        )}

        <nav className="mt-16 pt-6 border-t border-glass-border flex justify-between gap-4 text-sm">
          {prev ? (
            <Link
              href={`/fountain/ballad/${prev.slug}`}
              className="text-text-soft hover:text-sand transition-colors font-serif"
            >
              &larr; The Ballad of {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/fountain/ballad/${next.slug}`}
              className="text-text-soft hover:text-sand transition-colors font-serif text-right"
            >
              The Ballad of {next.title} &rarr;
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </main>
  );
}
