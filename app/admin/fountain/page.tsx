import Link from "next/link";
import { getFountainTree } from "@/lib/fountain";
import { FountainAdminList } from "./fountain-admin-list";

export const dynamic = "force-dynamic";

export default async function FountainAdmin() {
  const tree = await getFountainTree();

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <Link
        href="/admin"
        className="text-sm text-text-soft hover:text-text transition-colors mb-6 inline-block"
      >
        &larr; admin
      </Link>

      <header className="flex items-center justify-between mb-8 pb-6 border-b border-glass-border">
        <div>
          <h1 className="font-mono text-teal text-2xl font-medium">the fountain</h1>
          <p className="text-xs text-text-soft mt-1">currents and ballads</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/fountain"
            className="text-xs text-text-soft hover:text-text transition-colors font-mono"
          >
            view &rarr;
          </Link>
          <Link
            href="/admin/fountain/currents/new"
            className="px-4 py-2 bg-sand/10 border border-sand/20 rounded-xl text-sand text-sm font-mono hover:bg-sand/20 transition-all backdrop-blur-sm"
          >
            + current
          </Link>
        </div>
      </header>

      <FountainAdminList tree={tree} />
    </main>
  );
}
