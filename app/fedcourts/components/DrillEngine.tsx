"use client";
import { useEffect, useRef, useState } from "react";
import { FC_CATEGORY_SHORT, type FCCategory, type FCGameMode } from "@/lib/fc-types";

type Q = {
  id: string;
  category: FCCategory;
  difficulty: number;
  rating: number;
  stem: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  case_cited?: string;
};

type AnswerResult = {
  correct: boolean;
  correct_answer: "a" | "b" | "c" | "d";
  explanation: string;
  case_cited?: string;
  new_user_rating: number;
};

type Props = {
  gameMode: FCGameMode;
  category: string;
  questions: Q[];
  timeLimitSec?: number; // 15 for speed, 0 for untimed
  scoreToPost?: (state: SessionState) => number;
};

type SessionState = {
  questions: Q[];
  index: number;
  answers: Array<{ q: Q; result: AnswerResult; selected: "a" | "b" | "c" | "d" | null; ms: number }>;
  streak: number;
};

export default function DrillEngine({
  gameMode,
  category,
  questions,
  timeLimitSec = 15,
  scoreToPost,
}: Props) {
  const sessionId = useRef<string>("");
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<"a" | "b" | "c" | "d" | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimitSec);
  const [startMs, setStartMs] = useState<number>(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const answers = useRef<SessionState["answers"]>([]);

  useEffect(() => {
    sessionId.current = crypto.randomUUID();
    setStartMs(Date.now());
    setTimeLeft(timeLimitSec);
  }, [idx, timeLimitSec]);

  useEffect(() => {
    if (timeLimitSec === 0 || result || done) return;
    const i = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) {
          submit(null);
          return 0;
        }
        return t - 0.1;
      });
    }, 100);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, result, done]);

  // keyboard 1-4 / a-d
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (result) {
        if (e.key === "Enter" || e.key === " ") next();
        return;
      }
      const map: Record<string, "a" | "b" | "c" | "d"> = {
        "1": "a", "2": "b", "3": "c", "4": "d",
        a: "a", b: "b", c: "c", d: "d",
      };
      const v = map[e.key.toLowerCase()];
      if (v) submit(v);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, idx]);

  const q = questions[idx];

  async function submit(choice: "a" | "b" | "c" | "d" | null) {
    if (selected || result) return;
    setSelected(choice);
    const ms = Date.now() - startMs;
    const res = await fetch("/api/fc/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: q.id,
        game_mode: gameMode,
        session_id: sessionId.current,
        selected: choice,
        ms_to_answer: ms,
      }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string } & AnswerResult;
    if (!data.ok) {
      setResult({
        correct: choice === null ? false : false,
        correct_answer: "a",
        explanation: data.error || "Sign in to save your answers.",
        new_user_rating: 1000,
      });
      return;
    }
    setResult(data);
    answers.current.push({ q, result: data, selected: choice, ms });
    if (data.correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const timeBonus = Math.max(0, Math.floor(timeLeft) * 5);
      const streakMult = newStreak >= 8 ? 2 : newStreak >= 5 ? 1.5 : newStreak >= 3 ? 1.25 : 1;
      const points = Math.floor((100 + timeBonus) * streakMult);
      setScore((s) => s + points);
    } else {
      setStreak(0);
    }
  }

  function next() {
    if (idx >= questions.length - 1) {
      finish();
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setResult(null);
  }

  async function finish() {
    setDone(true);
    const final = scoreToPost
      ? scoreToPost({ questions, index: idx, answers: answers.current, streak })
      : score;
    if (final > 0) {
      await fetch("/api/fc/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: gameMode, category, score: final }),
      });
    }
  }

  if (done) {
    const correctN = answers.current.filter((a) => a.result.correct).length;
    return (
      <div className="fc-results">
        <p className="fc-results-score">{score.toLocaleString()}</p>
        <p className="fc-results-detail">
          {correctN} / {answers.current.length} correct
          {streak > 0 && ` · 🔥 ${streak} streak`}
        </p>
        <div className="fc-results-actions">
          <a href="/" className="primary">Back to games</a>
          <button onClick={() => window.location.reload()}>Play again</button>
          <a href="/leaderboard">Leaderboard</a>
        </div>
        <hr className="fc-hr" />
        <h3 className="fc-h2" style={{ textAlign: "left", fontSize: "1.2rem" }}>Review</h3>
        <div style={{ textAlign: "left" }}>
          {answers.current.map((a, i) => (
            <div key={i} className="fc-explanation" style={{ marginBottom: "0.6rem" }}>
              <div className="fc-explanation-case">
                {a.result.correct ? "✓ " : "✗ "}{a.q.case_cited || "—"}
              </div>
              <div style={{ marginTop: "0.3rem", fontSize: "0.85rem" }}>{a.q.stem}</div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", opacity: 0.75 }}>{a.result.explanation}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!q) return <div className="fc-empty">No questions available.</div>;

  return (
    <div className="fc-drill">
      <div className="fc-drill-header">
        <span className="fc-drill-cat">{FC_CATEGORY_SHORT[q.category] ?? "Mixed"} · {idx + 1}/{questions.length}</span>
        {streak >= 2 && <span className="fc-drill-streak">{streak}</span>}
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{score.toLocaleString()}</span>
      </div>
      {timeLimitSec > 0 && (
        <div className="fc-timer-bar">
          <div
            className="fc-timer-fill"
            style={{
              width: `${(timeLeft / timeLimitSec) * 100}%`,
              backgroundPosition: `${100 - (timeLeft / timeLimitSec) * 100}% 0%`,
            }}
          />
        </div>
      )}
      <p className="fc-stem">{q.stem}</p>
      <div className="fc-options">
        {(["a", "b", "c", "d"] as const).map((letter) => {
          const text = q[`opt_${letter}` as const];
          const cls =
            result && letter === result.correct_answer
              ? "fc-option fc-option-correct"
              : result && selected === letter
              ? "fc-option fc-option-wrong"
              : "fc-option";
          return (
            <button
              key={letter}
              className={cls}
              disabled={!!selected}
              onClick={() => submit(letter)}
            >
              <span className="fc-option-letter">{letter}</span>
              <span className="fc-option-text">{text}</span>
            </button>
          );
        })}
      </div>
      {result && (
        <>
          <div className="fc-explanation">
            {result.case_cited && <div className="fc-explanation-case">{result.case_cited}</div>}
            <div>{result.explanation}</div>
          </div>
          <button className="fc-drill-next" onClick={next}>
            {idx < questions.length - 1 ? "Next →" : "Finish"}
          </button>
        </>
      )}
    </div>
  );
}
