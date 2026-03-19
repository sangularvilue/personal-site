import Link from "next/link";
import { getAllPosts, getAllTags } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function Arts({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const params = await searchParams;
  const allPosts = await getAllPosts();
  const tags = await getAllTags();
  const activeTag = params.tag;

  const posts = activeTag
    ? allPosts.filter((p) => p.tags.includes(activeTag))
    : allPosts;

  const recents = allPosts.slice(0, 5);

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <header className="mb-12 pb-6 border-b border-border">
        <Link
          href="/"
          className="text-sm text-text-soft hover:text-text transition-colors mb-6 inline-block"
        >
          &larr; back
        </Link>
        <h2 className="font-serif text-sand text-[clamp(2rem,5vw,3rem)] font-medium mb-1">
          Arts
        </h2>
        <p className="text-sm text-text-soft tracking-wide">things I write</p>
      </header>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/arts"
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              !activeTag
                ? "border-sand/40 text-sand bg-sand/10"
                : "border-border text-text-soft hover:border-sand/30 hover:text-sand"
            }`}
          >
            all
          </Link>
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/arts?tag=${encodeURIComponent(tag)}`}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                activeTag === tag
                  ? "border-sand/40 text-sand bg-sand/10"
                  : "border-border text-text-soft hover:border-sand/30 hover:text-sand"
              }`}
            >
              {tag}
              <span className="ml-1 opacity-50">{count}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="py-8">
          <p className="text-text-soft font-serif italic">
            Nothing here yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/arts/${post.slug}`}
              className="block py-5 border-b border-border/40 hover:pl-2 transition-all duration-200 group"
            >
              <span className="text-[0.72rem] uppercase tracking-widest text-sand-dim font-semibold">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <h3 className="font-serif text-xl font-medium text-text mt-1 mb-2 group-hover:text-sand transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-text-soft leading-relaxed font-serif italic">
                {post.excerpt}
              </p>
              {post.tags.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[0.65rem] text-sand-dim tracking-wide"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Recent sidebar (shown inline on mobile, could be sidebar on desktop) */}
      {recents.length > 0 && activeTag && (
        <div className="mt-12 pt-8 border-t border-border">
          <h4 className="text-xs uppercase tracking-widest text-sand-dim font-semibold mb-4">
            Recent
          </h4>
          {recents.map((post) => (
            <Link
              key={post.id}
              href={`/arts/${post.slug}`}
              className="block py-2 text-sm text-text-soft hover:text-sand transition-colors font-serif"
            >
              {post.title}
            </Link>
          ))}
        </div>
      )}

      {/* RSS link */}
      <div className="mt-12 pt-6 border-t border-border">
        <a
          href="/rss.xml"
          className="text-xs text-text-soft hover:text-teal transition-colors font-mono"
        >
          rss feed &rarr;
        </a>
      </div>
    </main>
  );
}
