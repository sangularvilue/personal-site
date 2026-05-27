"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function FountainBackup() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (
      !confirm(
        `Restore from "${file.name}"? This REPLACES all currents and ballads — current data will be lost.`
      )
    )
      return;

    setBusy(true);
    setError("");
    try {
      const text = await file.text();
      const body = JSON.parse(text);
      const res = await fetch("/api/fountain/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(
        `Restore failed: ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      <a
        href="/api/fountain/backup"
        className="text-text-soft hover:text-teal transition-colors"
      >
        ↓ download
      </a>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="text-text-soft hover:text-teal transition-colors disabled:opacity-50"
      >
        {busy ? "restoring..." : "↑ upload"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={handleUpload}
        className="hidden"
      />
      {error && <span className="text-red-400">{error}</span>}
    </div>
  );
}
