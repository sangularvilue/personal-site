"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CraftEditor from "../editor";

export default function EditCraft() {
  const { id } = useParams<{ id: string }>();
  const [craft, setCraft] = useState<{
    name: string;
    tag: string;
    desc: string;
    href: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/crafts/${id}`)
      .then((r) => r.json())
      .then(setCraft);
  }, [id]);

  if (!craft) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-text-soft font-mono text-sm">loading...</span>
      </main>
    );
  }

  return <CraftEditor initial={craft} craftId={id} />;
}
