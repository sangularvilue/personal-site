"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CurrentEditor from "../current-editor";

interface Current {
  id: string;
  name: string;
  openingVerse: string;
}

export default function EditCurrent() {
  const params = useParams();
  const id = params.id as string;
  const [current, setCurrent] = useState<Current | null>(null);

  useEffect(() => {
    fetch(`/api/fountain/currents/${id}`)
      .then((r) => r.json())
      .then(setCurrent);
  }, [id]);

  if (!current) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-text-soft font-mono text-sm">loading...</span>
      </main>
    );
  }

  return (
    <CurrentEditor
      currentId={id}
      initial={{
        name: current.name,
        openingVerse: current.openingVerse || "",
      }}
    />
  );
}
