"use client";
import { useEffect, useRef, useState } from "react";
import {
  LSAT_LETTERS,
  LSAT_SKILL_LABELS,
  type LSATAnswerLetter,
  type LSATSectionType,
  type LSATSkill,
} from "@/lib/lsat-types";
import Ribbon from "../components/Ribbon";

type DQ = {
  id: string;
  pt: number;
  section_num: number;
  section_type: LSATSectionType;
  question_num: number;
  skill: LSATSkill;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  choice_e: string;
  shuffle_key: string;
};

type Pick = { selected: LSATAnswerLetter | null; ms: number };

type Submission = {
  date: string;
  picks: Record<string, LSATAnswerLetter | null>;
  correct_count: number;
  score: number;
  submitted_at: number;
};

export default function DailyPage() {
  const [questions, setQuestions] = useState<DQ[] | null>(null);
  const [date, setDate] = useState<string>("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [me, setMe] = useState<{ is_authed: boolean } | null>(null);
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startMs = useRef(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/lsat/me").then((r) => r.json()),
      fetch("/api/lsat/daily").then((r) => r.json()),
    ])
      .then(([meData, dailyData]) => {
        setMe({ is_authed: !!meData.user });
        if (!dailyData.ok) {
          setError(dailyData.error || "Failed to load");
          return;
        }
        setQuestions(dailyData.questions);
        setDate(dailyData.date);
        setSubmission(dailyData.submission || null);
      })
      .catch(() => setError("Failed to load"));
  }, []);

  useEffect(() => {
    startMs.current = Date.now();
  }, [idx]);

  function pick(letter: LSATAnswerLetter) {
    if (!questions) return;
    const q = questions[idx];
    if (!q) return;
    setPicks((p) => ({
      ...p,
      [q.id]: {
        selected: letter,
        ms: Date.now() - startMs.current,
      },
    }));
  }

  async function next() {
    if (!questions) return;
    if (idx < questions.length - 1) {
      setIdx((i) => i + 1);
      return;
    }
    // Submit.
    if (!me?.is_authed) {
      setError("Sign in to record the daily.");
      return;
    }
    setSubmitting(true);
    const body = {
      picks: Object.fromEntries(
        questions.map((q) => {
          const p = picks[q.id];
          return [
            q.id,
            {
              selected: p?.selected ?? null,
              shuffle_key: q.shuffle_key,
              ms: p?.ms ?? 0,
            },
          ];
        }),
      ),
    };
    try {
      const res = await fetch("/api/lsat/daily/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) setSubmission(data.submission);
      else setError(data.error || "Submission failed");
    } catch {
      setError("Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <div className="lsat-empty">{error}</div>;
  if (!questions || !me) return <div className="lsat-empty">Loading…</div>;
  if (questions.length === 0)
    return <div className="lsat-empty">No daily set today.</div>;

  // Already submitted today: show result + the ribbon set.
  if (submission) {
    return (
      <div>
        <div className="lsat-edition">
          <span>Vol. <em>I</em></span>
          <span>The Daily</span>
          <span>{date}</span>
        </div>
        <h1 className="lsat-h1">
          Today's <em>Edition</em>.
        </h1>
        <p className="lsat-sub">
          Already entered. Come back tomorrow for the next edition.
        </p>
        <div className="lsat-fleuron" aria-hidden>
          <span>❦</span>
        </div>
        <div className="lsat-results">
          <p className="lsat-results-score">{submission.score.toLocaleString()}</p>
          <p className="lsat-results-detail">
            {submission.correct_count} of {questions.length} correct
          </p>
          <div
            className="lsat-ribbon-stack"
            style={{ justifyContent: "center", border: 0 }}
            aria-label="Today's ribbons"
          >
            {questions.map((q, i) => {
              const sel = submission.picks[q.id];
              // Server-side correctness: re-derive using shuffle_key (we
              // only know if it was correct via correct_count, so we need
              // a per-Q correct flag from the backend — for now, we don't
              // have that, so just render all neutral. Tweak later if we
              // expose per-Q outcomes.)
              void sel;
              return (
                <Ribbon
                  key={q.id}
                  variant="neutral"
                  width={18}
                  height={48}
                  className="lsat-ribbon-stack-item"
                  style={{ transform: `rotate(${(i % 5) - 2}deg)` }}
                />
              );
            })}
          </div>
          <div className="lsat-results-actions" style={{ marginTop: "1.4rem" }}>
            <a href="/" className="primary">
              Close the book
            </a>
            <a href="/leaderboard?game=daily">Daily Roll</a>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const cur = picks[q.id];
  const isLast = idx === questions.length - 1;
  const allAnswered = questions.every((qq) => picks[qq.id]?.selected != null);

  return (
    <div>
      <div className="lsat-edition">
        <span>Vol. <em>I</em></span>
        <span>The Daily</span>
        <span>{date}</span>
      </div>
      <h1
        className="lsat-h1"
        style={{ fontSize: "2.4rem", marginBottom: "0.4rem" }}
      >
        Today's Edition
      </h1>
      <p
        className="lsat-sub"
        style={{ marginBottom: "0.4rem", fontSize: "1rem" }}
      >
        Five questions. Same for everyone, today only. One pass.
      </p>
      <div className="lsat-fleuron" aria-hidden style={{ margin: "0.6rem 0" }}>
        <span>❦</span>
      </div>
      <div className="lsat-drill">
        <div className="lsat-drill-header">
          <span className="lsat-drill-skill">{LSAT_SKILL_LABELS[q.skill]}</span>
          <span className="lsat-drill-progress">
            {idx + 1} / {questions.length}
          </span>
        </div>
        <div className="lsat-q-meta">
          <span>
            PT&nbsp;{q.pt} · §{q.section_num} · Q&nbsp;{q.question_num} ({q.section_type})
          </span>
        </div>
        <p className="lsat-stem has-dropcap">{q.stem}</p>
        <div className="lsat-options">
          {LSAT_LETTERS.map((letter) => {
            const text = q[`choice_${letter}` as const];
            if (!text) return null;
            const isSelected = cur?.selected === letter;
            return (
              <button
                key={letter}
                className={`lsat-option${isSelected ? " lsat-option-correct" : ""}`}
                onClick={() => pick(letter)}
              >
                <span className="lsat-option-letter">{letter}</span>
                <span className="lsat-option-text">{text}</span>
              </button>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.6rem",
            marginTop: "1.5rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            className="lsat-drill-next"
            disabled={!cur?.selected}
            onClick={next}
            style={{
              opacity: cur?.selected ? 1 : 0.4,
              cursor: cur?.selected ? "pointer" : "not-allowed",
              flex: "1 1 auto",
              minWidth: "12rem",
            }}
          >
            {isLast
              ? submitting
                ? "Submitting…"
                : allAnswered
                  ? "Submit edition"
                  : "Submit edition"
              : "Turn the page"}
          </button>
          {idx > 0 && (
            <button
              type="button"
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              style={{
                fontFamily: "var(--lsat-display)",
                fontStyle: "italic",
                background: "transparent",
                border: 0,
                color: "var(--lsat-ink-soft)",
                cursor: "pointer",
                padding: "0.6rem 0.4rem",
                flex: "0 0 auto",
              }}
            >
              ← back
            </button>
          )}
        </div>
        <p
          className="lsat-footnote"
          style={{ textAlign: "left", marginTop: "1rem", fontSize: "0.85rem" }}
        >
          Answers stay until you submit. You can revise.
        </p>
      </div>
    </div>
  );
}
