"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BalladEditor from "../ballad-editor";

interface Ballad {
  id: string;
  title: string;
  content: string;
  currentId: string;
}

export default function EditBallad() {
  const params = useParams();
  const id = params.id as string;
  const [ballad, setBallad] = useState<Ballad | null>(null);

  useEffect(() => {
    fetch(`/api/fountain/ballads/${id}`)
      .then((r) => r.json())
      .then(setBallad);
  }, [id]);

  if (!ballad) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-text-soft font-mono text-sm">loading...</span>
      </main>
    );
  }

  return (
    <BalladEditor
      balladId={id}
      initial={{
        title: ballad.title,
        content: ballad.content || "",
        currentId: ballad.currentId,
      }}
    />
  );
}
