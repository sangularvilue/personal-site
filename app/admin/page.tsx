import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { getAllCrafts } from "@/lib/crafts";
import { DeleteButton } from "./delete-button";
import { ReorderButtons } from "./reorder-buttons";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const posts = await getAllPosts(true);
  const crafts = await getAllCrafts();

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-glass-border">
        <div>
          <h1 className="font-mono text-teal text-2xl font-medium">admin</h1>
          <p className="text-xs text-text-soft mt-1">manage your site</p>
        </div>
        <Link
          href="/"
          className="text-xs text-text-soft hover:text-text transition-colors font-mono"
        >
          view site &rarr;
        </Link>
      </header>

      {/* Posts section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-sand text-lg font-medium">Posts</h2>
          <Link
            href="/admin/posts/new"
            className="px-4 py-2 bg-sand/10 border border-sand/20 rounded-xl text-sand text-sm font-mono hover:bg-sand/20 transition-all backdrop-blur-sm"
          >
            + new post
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="text-text-soft font-serif italic py-4">
            No posts yet. Write something.
          </p>
        ) : (
          <div className="space-y-0">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between py-4 border-b border-glass-border group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="font-serif text-text group-hover:text-sand transition-colors truncate"
                    >
                      {post.title}
                    </Link>
                    {!post.published && (
                      <span className="text-[0.6rem] px-2 py-0.5 rounded-full border border-glass-border text-text-soft">
                        draft
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[0.65rem] text-text-soft">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[0.6rem] text-sand-dim"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="text-xs text-text-soft hover:text-teal transition-colors font-mono"
                  >
                    edit
                  </Link>
                  <DeleteButton id={post.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Crafts section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-teal text-lg font-medium">Crafts</h2>
          <Link
            href="/admin/crafts/new"
            className="px-4 py-2 bg-teal/10 border border-teal/20 rounded-xl text-teal text-sm font-mono hover:bg-teal/20 transition-all backdrop-blur-sm"
          >
            + new craft
          </Link>
        </div>

        {crafts.length === 0 ? (
          <p className="text-text-soft font-serif italic py-4">
            No crafts yet. Build something.
          </p>
        ) : (
          <div className="space-y-0">
            {crafts.map((craft, i) => (
              <div
                key={craft.id}
                className="flex items-center justify-between py-4 border-b border-glass-border group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ReorderButtons
                    id={craft.id}
                    isFirst={i === 0}
                    isLast={i === crafts.length - 1}
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/admin/crafts/${craft.id}`}
                      className="font-mono text-text group-hover:text-teal transition-colors truncate block"
                    >
                      {craft.name}
                    </Link>
                    <span className="text-[0.6rem] text-text-soft/60 font-mono mt-0.5 block">
                      {craft.tag}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    href={`/admin/crafts/${craft.id}`}
                    className="text-xs text-text-soft hover:text-teal transition-colors font-mono"
                  >
                    edit
                  </Link>
                  <DeleteButton id={craft.id} type="craft" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
