import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { DeleteButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const posts = await getAllPosts(true);

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="font-mono text-teal text-2xl font-medium">admin</h1>
          <p className="text-xs text-text-soft mt-1">manage your writing</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="text-xs text-text-soft hover:text-text transition-colors font-mono"
          >
            view site &rarr;
          </Link>
          <Link
            href="/admin/posts/new"
            className="px-4 py-2 bg-sand/15 border border-sand/30 rounded-lg text-sand text-sm font-mono hover:bg-sand/25 transition-colors"
          >
            + new post
          </Link>
        </div>
      </header>

      {posts.length === 0 ? (
        <p className="text-text-soft font-serif italic py-8">
          No posts yet. Write something.
        </p>
      ) : (
        <div className="space-y-0">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between py-4 border-b border-border/40 group"
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
                    <span className="text-[0.6rem] px-2 py-0.5 rounded-full border border-border text-text-soft">
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
    </main>
  );
}
