"use client";
import { useEffect, useState } from "react";

type Q = {
  id: string;
  stem: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  case_cited?: string;
  explanation: string;
  correct: "a" | "b" | "c" | "d";
  shuffle_key?: string;
};

type Props = {
  date: string;
  question: Q;
  alreadyAnswered: { selected: string; correct: boolean; submitted_at: number } | null;
};

function nextResetCountdown(): string {
  // next 00:00 EST
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric", minute: "numeric", second: "numeric", hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hh = parseInt(parts.find((p) => p.type === "hour")!.value);
  const mm = parseInt(parts.find((p) => p.type === "minute")!.value);
  const ss = parseInt(parts.find((p) => p.type === "second")!.value);
  let h = 23 - hh;
  let m = 59 - mm;
  let s = 59 - ss;
  if (s === 60) { s = 0; m++; }
  if (m === 60) { m = 0; h++; }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DailyHypoClient({ date, question, alreadyAnswered }: Props) {
  const [selected, setSelected] = useState<"a" | "b" | "c" | "d" | null>(null);
  const [submitted, setSubmitted] = useState<{ selected: string; correct: boolean } | null>(
    alreadyAnswered ? { selected: alreadyAnswered.selected, correct: alreadyAnswered.correct } : null,
  );
  const [confirming, setConfirming] = useState(false);
  const [countdown, setCountdown] = useState(nextResetCountdown());

  useEffect(() => {
    const i = setInterval(() => setCountdown(nextResetCountdown()), 1000);
    return () => clearInterval(i);
  }, []);

  async function submit() {
    if (!selected) return;
    setConfirming(false);
    const res = await fetch("/api/fc/daily/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, game: "daily-hypo", question_id: question.id, selected, shuffle_key: question.shuffle_key }),
    });
    const data = await res.json();
    if (data.ok) setSubmitted({ selected, correct: data.correct });
  }

  return (
    <div className="fc-daily-card">
      <h1 className="fc-h1">Daily Hypo</h1>
      <p className="fc-countdown">resets in {countdown} EST · {date}</p>

      <p className="fc-stem">{question.stem}</p>
      <div className="fc-options">
        {(["a", "b", "c", "d"] as const).map((letter) => {
          const text = question[`opt_${letter}` as const];
          let cls = "fc-option";
          if (submitted) {
            if (letter === question.correct) cls = "fc-option fc-option-correct";
            else if (letter === submitted.selected) cls = "fc-option fc-option-wrong";
          } else if (selected === letter) {
            cls = "fc-option";
            // visual: highlight via inline border
          }
          return (
            <button
              key={letter}
              className={cls}
              disabled={!!submitted}
              onClick={() => setSelected(letter)}
              style={
                !submitted && selected === letter
                  ? { borderColor: "var(--fc-accent)", background: "var(--fc-accent-soft)" }
                  : {}
              }
            >
              <span className="fc-option-letter">{letter}</span>
              <span className="fc-option-text">{text}</span>
            </button>
          );
        })}
      </div>

      {submitted ? (
        <div className="fc-explanation" style={{ marginTop: "1.5rem" }}>
          <div className="fc-explanation-case">
            {submitted.correct ? "✓ Correct" : "✗ Not quite"} · {question.case_cited || "—"}
          </div>
          <div style={{ marginTop: "0.4rem" }}>{question.explanation}</div>
        </div>
      ) : !selected ? (
        <p style={{ marginTop: "1rem", color: "var(--fc-text-soft)", fontSize: "0.9rem" }}>
          Pick an answer. You only get one shot.
        </p>
      ) : confirming ? (
        <div className="fc-locked">
          Lock in <strong>{selected.toUpperCase()}</strong> as your final answer?
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.7rem" }}>
            <button onClick={submit} className="fc-drill-next" style={{ marginTop: 0 }}>
              Yes, lock it in
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="fc-drill-next"
              style={{ marginTop: 0, background: "var(--fc-surface)", color: "inherit" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="fc-drill-next" onClick={() => setConfirming(true)}>
          Submit answer
        </button>
      )}
    </div>
  );
}
