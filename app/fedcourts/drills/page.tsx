"use client";
import { useEffect, useState } from "react";
import DrillEngine from "../components/DrillEngine";

type Q = Parameters<typeof DrillEngine>[0]["questions"][number];

export default function DrillsPage() {
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/fc/questions?adaptive=1&n=15`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !questions) return <div className="fc-empty">Loading…</div>;
  if (questions.length === 0) return <div className="fc-empty">No questions seeded yet.</div>;

  return (
    <div>
      <div className="fc-drill-header" style={{ marginBottom: 0 }}>
        <span className="fc-drill-cat">Adaptive · Mixed</span>
      </div>
      <DrillEngine
        gameMode="drills"
        category="all"
        questions={questions}
        timeLimitSec={0}
      />
    </div>
  );
}
