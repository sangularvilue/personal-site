"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  currentId?: string;
  initial?: {
    name: string;
    openingVerse: string;
  };
}

export default function CurrentEditor({ currentId, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name || "");
  const [openingVerse, setOpeningVerse] = useState(initial?.openingVerse || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = currentId
      ? `/api/fountain/currents/${currentId}`
      : "/api/fountain/currents";
    const method = currentId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, openingVerse }),
    });
    if (res.ok) {
      router.push("/admin/fountain");
      router.refresh();
    } else {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <Link
        href="/admin/fountain"
        className="text-sm text-text-soft hover:text-text transition-colors mb-8 inline-block"
      >
        &larr; back
      </Link>
      <h1 className="font-serif text-sand text-2xl font-medium mb-2">
        {currentId ? "Edit current" : "New current"}
      </h1>
      <p className="text-xs text-text-soft font-mono mb-8">
        named after a noun — e.g. <span className="text-sand">Arrival</span>{" "}
        becomes <span className="text-sand">The Current of Arrival</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-mono text-text-soft mb-2">
            name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Arrival"
            required
            className="w-full px-4 py-3 glass-input rounded-xl text-text font-serif text-lg focus:outline-none focus:border-sand/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-text-soft mb-2">
            opening verse <span className="text-text-soft/60">(optional)</span>
          </label>
          <textarea
            value={openingVerse}
            onChange={(e) => setOpeningVerse(e.target.value)}
            placeholder="A short verse — not attached to any ballad."
            rows={8}
            className="w-full px-4 py-3 glass-input rounded-xl text-text font-serif italic text-sm focus:outline-none focus:border-sand/30 transition-all resize-y leading-relaxed"
          />
        </div>

        <div className="flex justify-end pt-2">
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
