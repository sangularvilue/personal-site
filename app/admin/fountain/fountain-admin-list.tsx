"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Ballad, Current } from "@/lib/fountain";

type Tree = Array<Current & { ballads: Ballad[] }>;

export function FountainAdminList({ tree }: { tree: Tree }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function moveCurrent(id: string, direction: "up" | "down") {
    setBusy(`current:${id}`);
    await fetch(`/api/fountain/currents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ move: direction }),
    });
    setBusy(null);
    router.refresh();
  }

  async function deleteCurrent(id: string, name: string) {
    if (
      !confirm(
        `Delete current "${name}" and all of its ballads? This cannot be undone.`
      )
    )
      return;
    setBusy(`current:${id}`);
    await fetch(`/api/fountain/currents/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  async function moveBallad(id: string, direction: "up" | "down") {
    setBusy(`ballad:${id}`);
    await fetch(`/api/fountain/ballads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ move: direction }),
    });
    setBusy(null);
    router.refresh();
  }

  async function deleteBallad(id: string, title: string) {
    if (!confirm(`Delete "The Ballad of ${title}"?`)) return;
    setBusy(`ballad:${id}`);
    await fetch(`/api/fountain/ballads/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  if (tree.length === 0) {
    return (
      <p className="text-text-soft font-serif italic py-8">
        No currents yet. Add the first one.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {tree.map((current, ci) => (
        <section key={current.id}>
          <div className="flex items-baseline justify-between border-b border-glass-border pb-3 mb-3">
            <div className="flex-1 min-w-0">
              <span className="text-[0.6rem] uppercase tracking-widest text-sand-dim font-semibold">
                Current
              </span>
              <h2 className="font-serif text-sand text-lg font-medium truncate">
                {current.name}
              </h2>
            </div>
            <div className="flex items-center gap-3 ml-4 text-xs font-mono">
              <button
                onClick={() => moveCurrent(current.id, "up")}
                disabled={ci === 0 || busy !== null}
                className="text-text-soft hover:text-teal disabled:opacity-25 transition-colors"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => moveCurrent(current.id, "down")}
                disabled={ci === tree.length - 1 || busy !== null}
                className="text-text-soft hover:text-teal disabled:opacity-25 transition-colors"
                aria-label="Move down"
              >
                ↓
              </button>
              <Link
                href={`/admin/fountain/currents/${current.id}`}
                className="text-text-soft hover:text-teal transition-colors"
              >
                edit
              </Link>
              <button
                onClick={() => deleteCurrent(current.id, current.name)}
                disabled={busy !== null}
                className="text-text-soft hover:text-red-400 transition-colors disabled:opacity-50"
              >
                delete
              </button>
            </div>
          </div>

          <div className="pl-4 border-l border-glass-border space-y-0">
            {current.ballads.length === 0 ? (
              <p className="text-text-soft/60 font-serif italic text-sm py-2">
                No ballads yet.
              </p>
            ) : (
              current.ballads.map((ballad, bi) => (
                <div
                  key={ballad.id}
                  className="flex items-center justify-between py-2.5 border-b border-border/30 group"
                >
                  <Link
                    href={`/admin/fountain/ballads/${ballad.id}`}
                    className="font-serif text-text text-sm group-hover:text-sand transition-colors truncate flex-1 min-w-0"
                  >
                    The Ballad of {ballad.title}
                  </Link>
                  <div className="flex items-center gap-3 ml-4 text-xs font-mono">
                    <button
                      onClick={() => moveBallad(ballad.id, "up")}
                      disabled={bi === 0 || busy !== null}
                      className="text-text-soft hover:text-teal disabled:opacity-25 transition-colors"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveBallad(ballad.id, "down")}
                      disabled={
                        bi === current.ballads.length - 1 || busy !== null
                      }
                      className="text-text-soft hover:text-teal disabled:opacity-25 transition-colors"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <Link
                      href={`/admin/fountain/ballads/${ballad.id}`}
                      className="text-text-soft hover:text-teal transition-colors"
                    >
                      edit
                    </Link>
                    <button
                      onClick={() => deleteBallad(ballad.id, ballad.title)}
                      disabled={busy !== null}
                      className="text-text-soft hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      delete
                    </button>
                  </div>
                </div>
              ))
            )}
            <div className="pt-3">
              <Link
                href={`/admin/fountain/ballads/new?currentId=${current.id}`}
                className="text-xs font-mono text-teal hover:text-sand transition-colors"
              >
                + add ballad
              </Link>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
