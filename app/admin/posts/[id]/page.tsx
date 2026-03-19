"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
}

export default function EditPost() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((r) => r.json())
      .then(setPost);
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        excerpt: form.get("excerpt"),
        content: form.get("content"),
        tags: (form.get("tags") as string)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        published: form.get("published") === "on",
      }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setSaving(false);
    }
  }

  if (!post) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-text-soft font-mono text-sm">loading...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <Link
        href="/admin"
        className="text-sm text-text-soft hover:text-text transition-colors mb-8 inline-block"
      >
        &larr; back
      </Link>
      <h1 className="font-serif text-sand text-2xl font-medium mb-8">
        Edit post
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          name="title"
          defaultValue={post.title}
          required
          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text font-serif text-lg focus:outline-none focus:border-sand/50 transition-colors"
        />
        <input
          name="excerpt"
          defaultValue={post.excerpt}
          placeholder="Short excerpt..."
          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text-soft text-sm focus:outline-none focus:border-sand/50 transition-colors font-serif italic"
        />
        <textarea
          name="content"
          defaultValue={post.content}
          rows={20}
          required
          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text font-mono text-sm focus:outline-none focus:border-sand/50 transition-colors resize-y leading-relaxed"
        />
        <input
          name="tags"
          defaultValue={post.tags.join(", ")}
          placeholder="Tags (comma-separated)"
          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text-soft text-sm font-mono focus:outline-none focus:border-sand/50 transition-colors"
        />
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 text-sm text-text-soft font-mono cursor-pointer">
            <input
              name="published"
              type="checkbox"
              defaultChecked={post.published}
              className="accent-sand"
            />
            published
          </label>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-sand/15 border border-sand/30 rounded-lg text-sand font-mono text-sm hover:bg-sand/25 transition-colors disabled:opacity-50"
          >
            {saving ? "saving..." : "save"}
          </button>
        </div>
      </form>
    </main>
  );
}
