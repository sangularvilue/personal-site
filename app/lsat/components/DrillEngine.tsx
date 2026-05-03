"use client";
import { useEffect, useRef, useState } from "react";
import {
  LSAT_LETTERS,
  LSAT_SKILL_LABELS,
  type LSATAnswerLetter,
  type LSATGameMode,
  type LSATQuestion,
  type LSATSectionType,
  type LSATSkill,
} from "@/lib/lsat-types";
import QuestionInfo from "./QuestionInfo";
import Ribbon from "./Ribbon";

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
  timeLimitSec?: number;
  isAdmin: boolean;
  isAuthed: boolean;
  // Streak mode: one wrong ends the run; show accumulated ribbons at top.
  streakMode?: boolean;
};

export default function DrillEngine({
  gameMode,
  skillFilter,
  questions: initialQuestions,
  timeLimitSec = 0,
  isAdmin,
  isAuthed,
  streakMode = false,
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

  useEffect(() => {
    function key(e: KeyboardEvent) {
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
    // Streak mode: a wrong (or unverified) answer ends the run.
    if (streakMode && result && !result.correct) {
      finish();
      return;
    }
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
    if (!isAuthed) return;
    if (streakMode) {
      // For streaks, the final "score" is the longest correct chain.
      try {
        await fetch("/api/lsat/streak/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ length: streak }),
        });
      } catch {}
      return;
    }
    if (score > 0) {
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
    setQuestions((qs) => {
      const out = [...qs];
      const cur = out[idx];
      const fields: ClientQuestion = {
        ...cur,
        skill: updated.skill,
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
    const finalLen = streakMode ? correctN : 0;
    if (streakMode) {
      return (
        <div className="lsat-results">
          <div className="lsat-fleuron" aria-hidden>
            <span>❦</span>
          </div>
          <p
            style={{
              fontFamily: "var(--lsat-display)",
              fontStyle: "italic",
              fontSize: "1.05rem",
              color: "var(--lsat-ink-soft)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "0.4rem",
            }}
          >
            The Run Ends
          </p>
          <p className="lsat-results-score">{finalLen}</p>
          <p className="lsat-results-detail">
            ribbon{finalLen === 1 ? "" : "s"} kept in a row
          </p>
          <div className="lsat-ribbon-stack" style={{ justifyContent: "center" }}>
            {answers.current
              .filter((a) => a.result.correct)
              .map((_, i) => (
                <Ribbon
                  key={i}
                  variant="correct"
                  width={14}
                  height={36}
                  className="lsat-ribbon-stack-item"
                  style={{ transform: `rotate(${(i % 5) - 2}deg)` }}
                />
              ))}
          </div>
          <div className="lsat-results-actions">
            <a href="/" className="primary">
              Close the book
            </a>
            <button onClick={() => window.location.reload()}>
              Begin again
            </button>
            <a href="/leaderboard">Leaderboard</a>
          </div>
        </div>
      );
    }
    return (
      <div className="lsat-results">
        <div className="lsat-fleuron" aria-hidden>
          <span>❦</span>
        </div>
        <p
          style={{
            fontFamily: "var(--lsat-display)",
            fontStyle: "italic",
            fontSize: "1.05rem",
            color: "var(--lsat-ink-soft)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "0.4rem",
          }}
        >
          End of Section
        </p>
        <p className="lsat-results-score">{score.toLocaleString()}</p>
        <p className="lsat-results-detail">
          {correctN} of {answers.current.length} correct
          {streak > 0 && ` · streak of ${streak}`}
        </p>
        <div className="lsat-results-actions">
          <a href="/" className="primary">
            Close the book
          </a>
          <button onClick={() => window.location.reload()}>Begin again</button>
          <a href="/leaderboard">Leaderboard</a>
        </div>
        <div className="lsat-fleuron" aria-hidden>
          <span>❧</span>
        </div>
        <h3
          className="lsat-h2"
          style={{ textAlign: "left", fontSize: "1.3rem" }}
        >
          Marginalia
        </h3>
        <div style={{ textAlign: "left" }}>
          {answers.current.map((a, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                marginBottom: "1.2rem",
                paddingLeft: "1.4rem",
                borderLeft: a.result.unauth
                  ? "2px solid var(--lsat-rule-soft)"
                  : a.result.correct
                    ? "2px solid #4a6843"
                    : "2px solid var(--lsat-ribbon)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--lsat-display)",
                  fontStyle: "italic",
                  fontSize: "0.88rem",
                  color: "var(--lsat-ink-soft)",
                  letterSpacing: "0.04em",
                  marginBottom: "0.3rem",
                }}
              >
                {LSAT_SKILL_LABELS[a.q.skill]} · PT {a.q.pt} S{a.q.section_num}{" "}
                Q{a.q.question_num}
              </div>
              <div
                style={{
                  fontSize: "0.95rem",
                  lineHeight: 1.55,
                  color: "var(--lsat-ink)",
                }}
              >
                {truncate(a.q.stem, 220)}
              </div>
              <div
                style={{
                  marginTop: "0.4rem",
                  fontSize: "0.85rem",
                  color: "var(--lsat-ink-soft)",
                  fontStyle: "italic",
                }}
              >
                Picked {a.selected?.toUpperCase() || "—"}
                {a.result.correct_answer
                  ? `; correct was ${a.result.correct_answer.toUpperCase()}`
                  : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!q) return <div className="lsat-empty">No questions available.</div>;

  // Decide whether to apply a drop cap. Drop cap requires the stem to begin
  // with a real letter; otherwise the ::first-letter falls awkwardly on
  // punctuation.
  const stemStartsWithLetter = /^[A-Za-z]/.test(q.stem.trim());

  // Choose a ribbon variant for the drop animation when an answer lands.
  const ribbonVariant: "correct" | "wrong" | "neutral" | null = result
    ? result.unauth
      ? "neutral"
      : result.correct
        ? "correct"
        : "wrong"
    : null;

  return (
    <div className="lsat-drill">
      <div className="lsat-drill-header">
        <span className="lsat-drill-skill">
          {LSAT_SKILL_LABELS[q.skill]}
        </span>
        <span className="lsat-drill-progress">
          {streakMode ? `Q ${idx + 1}` : `${idx + 1} / ${questions.length}`}
        </span>
        {streak >= 2 && (
          <span className="lsat-drill-streak">streak {streak}</span>
        )}
        {!streakMode && (
          <span
            style={{
              fontFamily: "var(--lsat-display)",
              fontVariantNumeric: "tabular-nums oldstyle-nums",
              fontSize: "1.1rem",
            }}
          >
            {score.toLocaleString()}
          </span>
        )}
      </div>
      {streakMode && streak > 0 && (
        <div
          className="lsat-ribbon-stack"
          style={{
            margin: "0.4rem 0 1rem",
            border: 0,
            padding: "0.4rem 0.4rem 0",
            justifyContent: "center",
          }}
          aria-label={`Streak of ${streak}`}
        >
          {Array.from({ length: streak }).map((_, i) => (
            <Ribbon
              key={i}
              variant="correct"
              width={12}
              height={30}
              className="lsat-ribbon-stack-item"
              style={{ transform: `rotate(${(i % 5) - 2}deg)` }}
            />
          ))}
        </div>
      )}
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
          PT&nbsp;{q.pt} · §{q.section_num} · Q&nbsp;{q.question_num}
          <span style={{ marginLeft: "0.6rem", color: "var(--lsat-ink-faint)" }}>
            ({q.section_type})
          </span>
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

      {/* The dropping ribbon — the signature mechanic */}
      {ribbonVariant && (
        <Ribbon
          variant={ribbonVariant}
          className={`lsat-ribbon lsat-ribbon--${ribbonVariant}`}
          ariaLabel={
            ribbonVariant === "correct"
              ? "Correct"
              : ribbonVariant === "wrong"
                ? "Incorrect"
                : "Answered"
          }
        />
      )}

      <p className={`lsat-stem${stemStartsWithLetter ? " has-dropcap" : ""}`}>
        {q.stem}
      </p>
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
                ? "Marked"
                : result.correct
                  ? "Correct"
                  : "Incorrect"}{" "}
              · {LSAT_SKILL_LABELS[result.skill]}
              {isAuthed &&
                !result.unauth &&
                ` · rating ${result.new_user_rating}`}
            </div>
            {!isAuthed && (
              <div>
                <a
                  href="/login"
                  style={{
                    color: "var(--lsat-ribbon-deep)",
                    fontStyle: "italic",
                  }}
                >
                  Sign in
                </a>{" "}
                to verify, set a rating, and keep this ribbon in your book.
              </div>
            )}
          </div>
          <button className="lsat-drill-next" onClick={next}>
            {streakMode && result && !result.correct
              ? "End the run"
              : idx < questions.length - 1
                ? "Turn the page"
                : "Close section"}
          </button>
          {streakMode && streak > 0 && result && result.correct && (
            <button
              className="lsat-drill-next"
              style={{
                marginLeft: "0.6rem",
                background: "transparent",
                color: "var(--lsat-ink)",
                borderColor: "var(--lsat-rule)",
              }}
              onClick={() => finish()}
            >
              Cash out at {streak}
            </button>
          )}
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
