"use client";
import { useEffect, useRef, useState } from "react";
import {
  LSAT_LETTERS,
  LSAT_SKILL_SHORT,
  type LSATAnswerLetter,
  type LSATGameMode,
  type LSATQuestion,
  type LSATSectionType,
  type LSATSkill,
} from "@/lib/lsat-types";
import QuestionInfo from "./QuestionInfo";

type ClientQuestion = {
  id: string;
  pt: number;
  section_num: number;
  section_type: LSATSectionType;
  question_num: number;
  passage_id?: string;
  skill: LSATSkill;
  rating: number;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  choice_e: string;
  shuffle_key: string;
};

type AnswerResult = {
  correct: boolean;
  correct_answer: LSATAnswerLetter | null;
  correct_canonical: LSATAnswerLetter | null;
  skill: LSATSkill;
  new_user_rating: number;
  new_q_rating: number;
  unauth?: boolean;
};

type AnswerRecord = {
  q: ClientQuestion;
  result: AnswerResult;
  selected: LSATAnswerLetter | null;
  ms: number;
};

type Props = {
  gameMode: LSATGameMode;
  skillFilter?: LSATSkill | "all";
  questions: ClientQuestion[];
  timeLimitSec?: number; // 0 for untimed
  isAdmin: boolean;
  isAuthed: boolean;
};

export default function DrillEngine({
  gameMode,
  skillFilter,
  questions: initialQuestions,
  timeLimitSec = 0,
  isAdmin,
  isAuthed,
}: Props) {
  const sessionId = useRef<string>("");
  const [questions, setQuestions] = useState<ClientQuestion[]>(initialQuestions);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<LSATAnswerLetter | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimitSec);
  const [startMs, setStartMs] = useState<number>(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const answers = useRef<AnswerRecord[]>([]);

  useEffect(() => {
    if (!sessionId.current) sessionId.current = crypto.randomUUID();
  }, []);

  useEffect(() => {
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

  // Keyboard 1-5 / a-e / Enter to advance.
  useEffect(() => {
    function key(e: KeyboardEvent) {
      // Don't hijack typing inside the admin modal.
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (showInfo) return;
      if (result) {
        if (e.key === "Enter" || e.key === " ") next();
        return;
      }
      const map: Record<string, LSATAnswerLetter> = {
        "1": "a",
        "2": "b",
        "3": "c",
        "4": "d",
        "5": "e",
        a: "a",
        b: "b",
        c: "c",
        d: "d",
        e: "e",
      };
      const v = map[e.key.toLowerCase()];
      if (v) submit(v);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, idx, showInfo]);

  const q = questions[idx];

  async function submit(choice: LSATAnswerLetter | null) {
    if (selected || result || submitting) return;
    setSubmitting(true);
    setSelected(choice);
    const ms = Date.now() - startMs;
    if (!isAuthed) {
      // We don't expose the correct answer to unauthenticated clients.
      // Show the answer choice the user picked, but leave correctness blank
      // and ask them to sign in to verify and record their answer.
      const placeholder: AnswerResult = {
        correct: false,
        correct_answer: null,
        correct_canonical: null,
        skill: q.skill,
        new_user_rating: 1000,
        new_q_rating: 1000,
        unauth: true,
      };
      setResult(placeholder);
      answers.current.push({ q, result: placeholder, selected: choice, ms });
      setSubmitting(false);
      return;
    }
    const res = await fetch("/api/lsat/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: q.id,
        game_mode: gameMode,
        session_id: sessionId.current,
        selected: choice,
        shuffle_key: q.shuffle_key,
        ms_to_answer: ms,
      }),
    });
    const data = (await res.json()) as
      | ({ ok: true } & AnswerResult)
      | { ok: false; error: string };
    setSubmitting(false);
    if (!("ok" in data) || !data.ok) {
      setResult({
        correct: false,
        correct_answer: null,
        correct_canonical: null,
        skill: q.skill,
        new_user_rating: 1000,
        new_q_rating: 1000,
        unauth: true,
      });
      return;
    }
    setResult(data);
    answers.current.push({ q, result: data, selected: choice, ms });
    if (data.correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const timeBonus =
        timeLimitSec > 0 ? Math.max(0, Math.floor(timeLeft) * 5) : 0;
      const streakMult =
        newStreak >= 8 ? 2 : newStreak >= 5 ? 1.5 : newStreak >= 3 ? 1.25 : 1;
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
    if (isAuthed && score > 0) {
      await fetch("/api/lsat/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: gameMode,
          skill: skillFilter || "all",
          score,
        }),
      });
    }
  }

  function onAdminUpdated(updated: LSATQuestion) {
    // Rewrite the in-memory question to reflect the edit. Keep the same
    // shuffle_key but re-shuffle display indices using new content.
    setQuestions((qs) => {
      const out = [...qs];
      const cur = out[idx];
      const fields: ClientQuestion = {
        ...cur,
        skill: updated.skill,
        // The shuffle_key tells us which canonical letter sits in each
        // display position. We pick fresh content by remapping.
        choice_a: pickByKey(updated, cur.shuffle_key, 0),
        choice_b: pickByKey(updated, cur.shuffle_key, 1),
        choice_c: pickByKey(updated, cur.shuffle_key, 2),
        choice_d: pickByKey(updated, cur.shuffle_key, 3),
        choice_e: pickByKey(updated, cur.shuffle_key, 4),
        stem: updated.stem,
      };
      out[idx] = fields;
      return out;
    });
  }

  if (done) {
    const correctN = answers.current.filter((a) => a.result.correct).length;
    return (
      <div className="lsat-results">
        <p className="lsat-results-score">{score.toLocaleString()}</p>
        <p className="lsat-results-detail">
          {correctN} / {answers.current.length} correct
          {streak > 0 && ` · 🔥 ${streak} streak`}
        </p>
        <div className="lsat-results-actions">
          <a href="/" className="primary">
            Back home
          </a>
          <button onClick={() => window.location.reload()}>Play again</button>
          <a href="/leaderboard">Leaderboard</a>
        </div>
        <hr className="lsat-rule" />
        <h3
          className="lsat-h2"
          style={{ textAlign: "left", fontSize: "1.1rem" }}
        >
          Review
        </h3>
        <div style={{ textAlign: "left" }}>
          {answers.current.map((a, i) => (
            <div
              key={i}
              className="lsat-explanation"
              style={{ marginBottom: "0.6rem" }}
            >
              <div className="lsat-explanation-head">
                {a.result.unauth
                  ? "· not verified"
                  : a.result.correct
                    ? "✓ correct"
                    : "✗ wrong"}{" "}
                · {LSAT_SKILL_SHORT[a.q.skill]} · PT {a.q.pt} Q{" "}
                {a.q.question_num}
              </div>
              <div style={{ marginTop: "0.3rem", fontSize: "0.92rem" }}>
                {truncate(a.q.stem, 240)}
              </div>
              <div
                style={{
                  marginTop: "0.4rem",
                  fontSize: "0.85rem",
                  color: "var(--lsat-ink-soft)",
                }}
              >
                Your answer: {a.selected?.toUpperCase() || "—"}
                {a.result.correct_answer
                  ? ` · Correct: ${a.result.correct_answer.toUpperCase()}`
                  : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!q) return <div className="lsat-empty">No questions available.</div>;

  return (
    <div className="lsat-drill">
      <div className="lsat-drill-header">
        <span className="lsat-drill-skill">
          {LSAT_SKILL_SHORT[q.skill]} · {q.section_type}
        </span>
        <span className="lsat-drill-progress">
          {idx + 1} / {questions.length}
        </span>
        {streak >= 2 && <span className="lsat-drill-streak">{streak}🔥</span>}
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {score.toLocaleString()}
        </span>
      </div>
      {timeLimitSec > 0 && (
        <div className="lsat-timer-bar">
          <div
            className="lsat-timer-fill"
            style={{ width: `${(timeLeft / timeLimitSec) * 100}%` }}
          />
        </div>
      )}
      <div className="lsat-q-meta">
        <span>
          PT {q.pt} · S{q.section_num} · Q{q.question_num}
        </span>
        <button
          type="button"
          className="lsat-info-btn"
          aria-label="Question info"
          title={isAdmin ? "Edit question" : "Question info"}
          onClick={() => setShowInfo(true)}
        >
          i
        </button>
      </div>
      <p className="lsat-stem">{q.stem}</p>
      <div className="lsat-options">
        {LSAT_LETTERS.map((letter) => {
          const text = q[`choice_${letter}` as const];
          if (!text) return null;
          let cls = "lsat-option";
          if (result) {
            if (letter === result.correct_answer) {
              cls = "lsat-option lsat-option-correct";
            } else if (selected === letter) {
              cls = "lsat-option lsat-option-wrong";
            }
          }
          return (
            <button
              key={letter}
              className={cls}
              disabled={!!selected}
              onClick={() => submit(letter)}
            >
              <span className="lsat-option-letter">{letter}</span>
              <span className="lsat-option-text">{text}</span>
            </button>
          );
        })}
      </div>
      {result && (
        <>
          <div className="lsat-explanation">
            <div className="lsat-explanation-head">
              {result.unauth
                ? "Not verified"
                : result.correct
                  ? "✓ correct"
                  : "✗ wrong"}{" "}
              · {LSAT_SKILL_SHORT[result.skill]}
              {isAuthed &&
                !result.unauth &&
                ` · rating ${result.new_user_rating}`}
            </div>
            {!isAuthed && (
              <div>
                <a href="/login" style={{ color: "var(--lsat-accent)" }}>
                  Sign in
                </a>{" "}
                to verify this answer, see your rating change, and have it
                saved to your profile.
              </div>
            )}
          </div>
          <button className="lsat-drill-next" onClick={next}>
            {idx < questions.length - 1 ? "Next →" : "Finish"}
          </button>
        </>
      )}
      {showInfo && (
        <QuestionInfo
          questionId={q.id}
          publicSkill={q.skill}
          isAdmin={isAdmin}
          onClose={() => setShowInfo(false)}
          onUpdated={onAdminUpdated}
        />
      )}
    </div>
  );
}

function pickByKey(
  q: LSATQuestion,
  shuffleKey: string,
  pos: number,
): string {
  const canonical = shuffleKey[pos] as LSATAnswerLetter;
  return q[`choice_${canonical}` as const];
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}
