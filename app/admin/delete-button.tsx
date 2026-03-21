"use client";

import { useRouter } from "next/navigation";

export function DeleteButton({ id, type = "post" }: { id: string; type?: "post" | "craft" }) {
  const router = useRouter();
  const endpoint = type === "craft" ? `/api/crafts/${id}` : `/api/posts/${id}`;

  async function handleDelete() {
    if (!confirm(`Delete this ${type}?`)) return;
    await fetch(endpoint, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-text-soft hover:text-red-400 transition-colors font-mono"
    >
      delete
    </button>
  );
}
