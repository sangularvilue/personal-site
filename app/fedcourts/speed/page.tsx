"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DrillEngine from "../components/DrillEngine";
import { FC_CATEGORIES, FC_CATEGORY_LABELS, type FCCategory } from "@/lib/fc-types";

type Q = Parameters<typeof DrillEngine>[0]["questions"][number];

export default function SpeedDrillPage() {
  const sp = useSearchParams();
  const initialCat = (sp.get("cat") || "") as FCCategory | "";
  const [cat, setCat] = useState<FCCategory | "">(initialCat);
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cat) return;
    setLoading(true);
    fetch(`/api/fc/questions?category=${cat}&n=10`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions))
      .finally(() => setLoading(false));
  }, [cat]);

  if (!cat) {
    return (
      <div>
        <h1 className="fc-h1">Speed Drill</h1>
        <p className="fc-sub">10 timed questions. 15 seconds each. Pick a category.</p>
        <div className="fc-grid">
          {FC_CATEGORIES.map((c) => (
            <button
              key={c}
              className="fc-card"
              onClick={() => setCat(c)}
              style={{ cursor: "pointer", fontFamily: "inherit" }}
            >
              <h3 className="fc-card-title">{FC_CATEGORY_LABELS[c]}</h3>
              <p className="fc-card-desc">~50 questions in this bank</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading || !questions) {
    return <div className="fc-empty">Loading…</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="fc-empty">
        No questions yet for this category. Run the seed script.
      </div>
    );
  }

  return (
    <DrillEngine
      gameMode="speed-drill"
      category={cat}
      questions={questions}
      timeLimitSec={15}
    />
  );
}
