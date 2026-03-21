"use client";

import { useRouter } from "next/navigation";

export function ReorderButtons({
  id,
  isFirst,
  isLast,
}: {
  id: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();

  async function move(direction: "up" | "down") {
    await fetch(`/api/crafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => move("up")}
        disabled={isFirst}
        className="text-[0.6rem] text-text-soft hover:text-teal transition-colors font-mono disabled:opacity-20 disabled:cursor-default leading-none"
        aria-label="Move up"
      >
        &#9650;
      </button>
      <button
        onClick={() => move("down")}
        disabled={isLast}
        className="text-[0.6rem] text-text-soft hover:text-teal transition-colors font-mono disabled:opacity-20 disabled:cursor-default leading-none"
        aria-label="Move down"
      >
        &#9660;
      </button>
    </div>
  );
}
