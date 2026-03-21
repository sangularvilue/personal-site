import Link from "next/link";
import { getAllPosts, getAllTags, Post } from "@/lib/posts";
import GlassCard from "../components/glass-card";
import AmbientImage from "../components/ambient-image";

export const dynamic = "force-dynamic";

function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

const SECTIONS = [
  { key: "favorites", label: "My Favorites" },
  { key: "poetry", label: "Poetry" },
  { key: "satire", label: "Satire" },
  { key: "opinion", label: "Opinion" },
  { key: "stories", label: "Stories" },
] as const;

function PostTile({ post }: { post: Post }) {
  return (
    <GlassCard href={`/arts/${post.slug}`} className="cursor-pointer group">
      <div className="p-4">
        {post.coverImage && (
          <div className="mb-3 overflow-hidden rounded-xl">
            <AmbientImage
              src={post.coverImage}
              className="w-full h-32 rounded-xl object-cover"
              spread={20}
              blur={32}
              intensity={0.5}
            />
          </div>
        )}
        <span className="text-[0.65rem] uppercase tracking-widest text-sand-dim font-semibold">
          {new Date(post.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <h3 className="font-serif text-base font-medium text-text mt-1 mb-1.5 group-hover:text-sand transition-colors leading-snug">
          {post.title}
        </h3>
        <p className="text-xs text-text-soft leading-relaxed font-serif italic line-clamp-2">
          {post.excerpt}
        </p>
        <div className="post-tile-preview mt-2 pt-2 border-t border-glass-border">
          <p className="text-[0.7rem] text-text-soft/70 leading-relaxed font-serif line-clamp-3">
            {post.content.replace(/[#*\[\]()>_~`]/g, "").slice(0, 200)}
          </p>
        </div>
        <span className="block text-[0.6rem] text-text-soft/50 font-mono mt-2 text-right">
          {readingTime(post.content)}
        </span>
      </div>
    </GlassCard>
  );
}

function PostRow({ post }: { post: Post }) {
  return (
    <Link
      href={`/arts/${post.slug}`}
      className="flex gap-4 py-5 border-b border-border/40 hover:pl-2 transition-all duration-200 group"
    >
      {post.coverImage && (
        <div className="flex-shrink-0 mt-1 overflow-hidden rounded-lg">
          <AmbientImage
            src={post.coverImage}
            className="w-20 h-20 rounded-lg object-cover"
            spread={12}
            blur={24}
            intensity={0.45}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
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
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[0.65rem] text-sand-dim tracking-wide"
              >
                #{tag}
              </span>
            ))}
          </div>
          <span className="text-[0.65rem] text-text-soft/50 font-mono">
            {readingTime(post.content)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function Arts({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>;
}) {
  const params = await searchParams;
  const allPosts = await getAllPosts();
  const tags = await getAllTags();
  const activeTag = params.tag;
  const query = params.q?.toLowerCase();

  const isFiltering = activeTag || query;

  let filteredPosts = activeTag
    ? allPosts.filter((p) => p.tags.includes(activeTag))
    : allPosts;

  if (query) {
    filteredPosts = filteredPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.excerpt.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  // Group posts by section (a post appears in the first matching section)
  const sections = SECTIONS.map(({ key, label }) => ({
    key,
    label,
    posts: allPosts.filter((p) => p.tags.includes(key)),
  })).filter((s) => s.posts.length > 0);

  // Posts that don't match any section
  const sectionKeys = new Set<string>(SECTIONS.map((s) => s.key));
  const uncategorized = allPosts.filter(
    (p) => !p.tags.some((t) => sectionKeys.has(t))
  );

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[1100px] mx-auto animate-rise">
      <header className="mb-12 pb-6 border-b border-glass-border">
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

      {/* Search */}
      <form action="/arts" method="GET" className="mb-6">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search posts..."
          className="w-full px-4 py-2.5 glass-input rounded-xl text-text text-sm font-serif focus:outline-none focus:border-sand/30 transition-all placeholder:text-text-soft/40"
        />
        {activeTag && <input type="hidden" name="tag" value={activeTag} />}
      </form>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/arts"
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              !activeTag
                ? "border-sand/30 text-sand bg-sand/10 backdrop-blur-sm"
                : "border-glass-border text-text-soft hover:border-sand/25 hover:text-sand backdrop-blur-sm"
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
                  ? "border-sand/30 text-sand bg-sand/10 backdrop-blur-sm"
                  : "border-glass-border text-text-soft hover:border-sand/25 hover:text-sand backdrop-blur-sm"
              }`}
            >
              {tag}
              <span className="ml-1 opacity-50">{count}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Content */}
      {isFiltering ? (
        // Flat list when filtering
        <div className="max-w-[720px]">
          {filteredPosts.length === 0 ? (
            <div className="py-8">
              <p className="text-text-soft font-serif italic">
                No posts found.
              </p>
            </div>
          ) : (
            <div>
              {filteredPosts.map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      ) : allPosts.length === 0 ? (
        <div className="py-8">
          <p className="text-text-soft font-serif italic">
            Nothing here yet. Check back soon.
          </p>
        </div>
      ) : (
        // Column layout — each section is a column with tiles
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {[...sections, ...(uncategorized.length > 0 ? [{ key: "other", label: "Other", posts: uncategorized }] : [])].map(
            ({ key, label, posts }) => (
              <div key={key}>
                <h3 className="font-serif text-sand text-base font-medium mb-4 pb-2 border-b border-glass-border">
                  {label}
                </h3>
                <div className="space-y-3">
                  {posts.map((post) => (
                    <PostTile key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* RSS link */}
      <div className="mt-12 pt-6 border-t border-glass-border">
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
