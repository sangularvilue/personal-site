"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CraftEditorProps {
  initial?: {
    name: string;
    tag: string;
    desc: string;
    href: string;
  };
  craftId?: string;
}

export default function CraftEditor({ initial, craftId }: CraftEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    const url = craftId ? `/api/crafts/${craftId}` : "/api/crafts";
    const method = craftId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        tag: form.get("tag"),
        desc: form.get("desc"),
        href: form.get("href"),
      }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <Link
        href="/admin"
        className="text-sm text-text-soft hover:text-text transition-colors mb-8 inline-block"
      >
        &larr; back
      </Link>
      <h1 className="font-mono text-teal text-2xl font-medium mb-8">
        {craftId ? "Edit craft" : "New craft"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          name="name"
          defaultValue={initial?.name}
          placeholder="Project name"
          required
          className="w-full px-4 py-3 glass-input rounded-xl text-text font-mono text-lg focus:outline-none focus:border-teal/30 transition-all"
        />
        <input
          name="tag"
          defaultValue={initial?.tag}
          placeholder="Tech stack (e.g. next.js · react 19)"
          className="w-full px-4 py-3 glass-input rounded-xl text-text-soft text-sm font-mono focus:outline-none focus:border-teal/30 transition-all"
        />
        <textarea
          name="desc"
          defaultValue={initial?.desc}
          placeholder="Short description..."
          rows={4}
          required
          className="w-full px-4 py-3 glass-input rounded-xl text-text text-sm font-mono focus:outline-none focus:border-teal/30 transition-all resize-y leading-relaxed"
        />
        <input
          name="href"
          defaultValue={initial?.href}
          placeholder="Link URL"
          required
          className="w-full px-4 py-3 glass-input rounded-xl text-text-soft text-sm font-mono focus:outline-none focus:border-teal/30 transition-all"
        />
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-teal/15 border border-teal/30 rounded-lg text-teal font-mono text-sm hover:bg-teal/25 transition-colors disabled:opacity-50"
          >
            {saving ? "saving..." : "save"}
          </button>
        </div>
      </form>
    </main>
  );
}
