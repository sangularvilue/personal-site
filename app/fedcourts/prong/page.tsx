"use client";
import { useEffect, useState } from "react";
import DrillEngine from "../components/DrillEngine";

type Q = Parameters<typeof DrillEngine>[0]["questions"][number];

const RULES = [
  { id: "standing-art3", name: "Article III Standing" },
  { id: "grable-fqj", name: "Grable Embedded FQJ" },
  { id: "bivens-extension", name: "Bivens Extension" },
  { id: "monell-mun", name: "Monell Municipal Liability" },
  { id: "harlow-qi", name: "Harlow Qualified Immunity" },
  { id: "seminole-abrog", name: "Seminole Abrogation" },
  { id: "aedpa-2254d", name: "AEDPA § 2254(d)" },
];

export default function ProngPage() {
  const [ruleId, setRuleId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Q[] | null>(null);

  useEffect(() => {
    if (!ruleId) return;
    fetch(`/api/fc/questions/by-rule?rule=${ruleId}&n=10`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions));
  }, [ruleId]);

  if (!ruleId) {
    return (
      <div>
        <h1 className="fc-h1">Which Prong?</h1>
        <p className="fc-sub">Read a hypo, identify the failing element of the test.</p>
        <div className="fc-grid">
          {RULES.map((r) => (
            <button
              key={r.id}
              className="fc-card"
              onClick={() => setRuleId(r.id)}
              style={{ cursor: "pointer", fontFamily: "inherit" }}
            >
              <h3 className="fc-card-title">{r.name}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!questions) return <div className="fc-empty">Loading…</div>;
  if (questions.length === 0)
    return <div className="fc-empty">No tagged questions for this rule yet.</div>;

  return (
    <DrillEngine
      gameMode="which-prong"
      category={ruleId}
      questions={questions}
      timeLimitSec={0}
    />
  );
}
