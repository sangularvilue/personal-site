"use client";
import { useEffect, useState } from "react";

type Rule = {
  id: string;
  name: string;
  elements: string[];
  source_case?: string;
  when_applied?: string;
  common_distractors: string[];
};

function shuffle<T>(a: T[]): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

export default function BuilderPage() {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [active, setActive] = useState<Rule | null>(null);
  const [pool, setPool] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<{ correct: boolean; score: number } | null>(null);

  useEffect(() => {
    fetch("/api/fc/rules").then((r) => r.json()).then((d) => setRules(d.rules));
  }, []);

  function start(r: Rule) {
    setActive(r);
    const distractors = shuffle(r.common_distractors).slice(0, Math.max(2, 4));
    setPool(shuffle([...r.elements, ...distractors]));
    setSlots([]);
    setSubmitted(null);
  }

  function pick(tile: string) {
    if (submitted || !active) return;
    if (slots.length >= active.elements.length) return;
    setSlots([...slots, tile]);
    setPool(pool.filter((p) => p !== tile));
  }
  function unpick(i: number) {
    if (submitted) return;
    const t = slots[i];
    setSlots(slots.filter((_, j) => j !== i));
    setPool([...pool, t]);
  }

  function check() {
    if (!active) return;
    const correct =
      slots.length === active.elements.length &&
      slots.every((s, i) => s === active.elements[i]);
    const partialCorrect = slots.filter((s) => active.elements.includes(s)).length;
    const distractors = slots.filter((s) => !active.elements.includes(s)).length;
    const score = correct
      ? 200
      : Math.max(0, partialCorrect * 30 - distractors * 25);
    setSubmitted({ correct, score });
    fetch("/api/fc/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "rule-builder", category: active.id, score }),
    });
  }

  if (!rules) return <div className="fc-empty">Loading rules…</div>;

  if (!active) {
    return (
      <div>
        <h1 className="fc-h1">Rule Builder</h1>
        <p className="fc-sub">Pick a multi-prong test. Choose its elements in order.</p>
        <div className="fc-grid">
          {rules.map((r) => (
            <button key={r.id} className="fc-card" onClick={() => start(r)} style={{ cursor: "pointer", fontFamily: "inherit" }}>
              <h3 className="fc-card-title">{r.name}</h3>
              <p className="fc-card-desc">{r.when_applied || "—"}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="fc-tab" onClick={() => setActive(null)}>← back</button>
      <h1 className="fc-h1" style={{ marginTop: "0.5rem" }}>{active.name}</h1>
      <p className="fc-sub">Place {active.elements.length} elements in the correct order.</p>

      <h3 className="fc-h2" style={{ fontSize: "1rem" }}>Your answer</h3>
      <div className="fc-rule-slots">
        {Array.from({ length: active.elements.length }).map((_, i) =>
          slots[i] ? (
            <button key={i} className="fc-rule-tile" onClick={() => unpick(i)}>
              {i + 1}. {slots[i]}
            </button>
          ) : (
            <span key={i} className="fc-rule-slot-empty">{i + 1}. ___</span>
          ),
        )}
      </div>

      <h3 className="fc-h2" style={{ fontSize: "1rem" }}>Tile bank</h3>
      <div className="fc-rule-pool">
        {pool.map((p, i) => (
          <button key={i} className="fc-rule-tile" onClick={() => pick(p)}>
            {p}
          </button>
        ))}
      </div>

      {submitted ? (
        <div className="fc-explanation">
          <div className="fc-explanation-case">
            {submitted.correct ? "✓ Perfect" : "Partial"} · {submitted.score} pts
          </div>
          <div style={{ marginTop: "0.4rem", fontSize: "0.85rem" }}>
            <strong>Correct order:</strong> {active.elements.join(" → ")}
            {active.source_case && <> · from <em>{active.source_case}</em></>}
          </div>
          <button className="fc-drill-next" onClick={() => start(active)} style={{ marginTop: "1rem" }}>
            Try again
          </button>
        </div>
      ) : (
        <button
          className="fc-drill-next"
          onClick={check}
          disabled={slots.length !== active.elements.length}
          style={{ opacity: slots.length === active.elements.length ? 1 : 0.5 }}
        >
          Submit
        </button>
      )}
    </div>
  );
}
