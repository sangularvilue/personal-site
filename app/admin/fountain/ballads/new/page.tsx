"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import BalladEditor from "../ballad-editor";

function NewBalladInner() {
  const params = useSearchParams();
  const currentId = params.get("currentId") || undefined;
  return <BalladEditor defaultCurrentId={currentId} />;
}

export default function NewBallad() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <span className="text-text-soft font-mono text-sm">loading...</span>
        </main>
      }
    >
      <NewBalladInner />
    </Suspense>
  );
}
