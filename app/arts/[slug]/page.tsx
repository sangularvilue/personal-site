import Link from "next/link";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { marked } from "marked";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const html = await marked(post.content);

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <Link
        href="/arts"
        className="text-sm text-text-soft hover:text-text transition-colors mb-8 inline-block"
      >
        &larr; back to arts
      </Link>

      <article>
        <header className="mb-8 pb-6 border-b border-border">
          <span className="text-[0.72rem] uppercase tracking-widest text-sand-dim font-semibold">
            {new Date(post.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <h1 className="font-serif text-sand text-[clamp(1.8rem,4vw,2.5rem)] font-medium mt-2 mb-3">
            {post.title}
          </h1>
          {post.tags.length > 0 && (
            <div className="flex gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/arts?tag=${encodeURIComponent(tag)}`}
                  className="text-xs px-3 py-1 rounded-full border border-border text-text-soft hover:border-sand/30 hover:text-sand transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  );
}
