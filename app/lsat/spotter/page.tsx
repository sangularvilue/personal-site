"use client";
import { useEffect, useRef, useState } from "react";
import {
  LSAT_SKILLS,
  LSAT_SKILL_LABELS,
  type LSATSectionType,
  type LSATSkill,
} from "@/lib/lsat-types";

type SQ = {
  id: string;
  pt: number;
  section_num: number;
  section_type: LSATSectionType;
  question_num: number;
  skill: LSATSkill;
  stem: string;
};

type Phase = "idle" | "playing" | "done";

const ROUND_SEC = 60;

export default function SpotterPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<SQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SEC);
  const [me, setMe] = useState<{ is_authed: boolean } | null>(null);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctN, setCorrectN] = useState(0);
  const [seenN, setSeenN] = useState(0);
  const [feedback, setFeedback] = useState<
    | { kind: "correct" | "wrong"; actual: LSATSkill }
    | null
  >(null);

  const sessionId = useRef<string>("");
  const startedAt = useRef<number>(0);
  const submitting = useRef(false);

  useEffect(() => {
    fetch("/api/lsat/me")
      .then((r) => r.json())
      .then((d) => setMe({ is_authed: !!d.user }));
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const i = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) {
          finish();
          return 0;
        }
        return t - 0.1;
      });
    }, 100);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Keyboard: 1-8 picks one of the 8 skills.
  useEffect(() => {
    if (phase !== "playing") return;
    function key(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const n = parseInt(e.key, 10);
      if (!Number.isFinite(n) || n < 1 || n > 8) return;
      pick(LSAT_SKILLS[n - 1]);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx]);

  async function start() {
    sessionId.current = crypto.randomUUID();
    setIdx(0);
    setScore(0);
    setStreak(0);
    setCorrectN(0);
    setSeenN(0);
    setFeedback(null);
    setTimeLeft(ROUND_SEC);
    startedAt.current = Date.now();
    // Pull a long stream so we don't run out.
    const r = await fetch("/api/lsat/questions?adaptive=1&n=50");
    const d = await r.json();
    if (!d.ok) {
      alert("Could not load questions.");
      return;
    }
    setQuestions(
      (d.questions as SQ[]).map((q) => ({
        id: q.id,
        pt: q.pt,
        section_num: q.section_num,
        section_type: q.section_type,
        question_num: q.question_num,
        skill: q.skill,
        stem: q.stem,
      })),
    );
    setPhase("playing");
  }

  async function pick(predicted: LSATSkill) {
    if (submitting.current) return;
    if (phase !== "playing") return;
    const q = questions[idx];
    if (!q) return;
    submitting.current = true;
    const ms = Date.now() - startedAt.current;
    let correct = predicted === q.skill;
    setSeenN((n) => n + 1);
    if (me?.is_authed) {
      try {
        const res = await fetch("/api/lsat/spotter/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: q.id,
            predicted,
            ms_to_answer: ms,
            session_id: sessionId.current,
          }),
        });
        const data = await res.json();
        if (data.ok) correct = !!data.correct;
      } catch {
        // network error — fall back to client-side check
      }
    }
    setFeedback({ kind: correct ? "correct" : "wrong", actual: q.skill });
    if (correct) {
      const ns = streak + 1;
      setStreak(ns);
      setCorrectN((n) => n + 1);
      // 100 base + streak bonus
      const points = 100 + (ns >= 8 ? 100 : ns >= 5 ? 50 : ns >= 3 ? 25 : 0);
      setScore((s) => s + points);
    } else {
      setStreak(0);
    }
    // Show feedback briefly, then advance.
    setTimeout(() => {
      setFeedback(null);
      submitting.current = false;
      setIdx((i) => {
        const next = i + 1;
        if (next >= questions.length) {
          finish();
        } else {
          startedAt.current = Date.now();
        }
        return next;
      });
    }, 700);
  }

  async function finish() {
    setPhase("done");
    if (me?.is_authed && score > 0) {
      try {
        await fetch("/api/lsat/spotter/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score }),
        });
      } catch {}
    }
  }

  if (phase === "idle") {
    return (
      <div>
        <h1 className="lsat-h1">
          Skill <em>Spotter</em>.
        </h1>
        <p className="lsat-sub">
          Read the question. Name the skill it tests. Sixty seconds. As many
          as you can.
        </p>
        <div className="lsat-fleuron" aria-hidden>
          <span>❦</span>
        </div>
        <p
          className="lsat-footnote"
          style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}
        >
          You'll see only the stem — never the choices. Tap a skill (or
          press 1–8) to commit. Get a streak bonus for chains.
        </p>
        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={start}
            className="lsat-drill-next"
            style={{ marginTop: "1rem" }}
          >
            Begin
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const accuracy = seenN > 0 ? Math.round((correctN / seenN) * 100) : 0;
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
          End of Round
        </p>
        <p className="lsat-results-score">{score.toLocaleString()}</p>
        <p className="lsat-results-detail">
          {correctN} of {seenN} ({accuracy}%)
        </p>
        <div className="lsat-results-actions">
          <a href="/" className="primary">
            Close the book
          </a>
          <button onClick={() => start()}>Begin again</button>
          <a href="/leaderboard">Leaderboard</a>
        </div>
      </div>
    );
  }

  // Playing
  const q = questions[idx];
  if (!q) return <div className="lsat-empty">Out of questions.</div>;

  return (
    <div className="lsat-drill">
      <div className="lsat-drill-header">
        <span className="lsat-drill-skill">Spotter</span>
        <span className="lsat-drill-progress">{seenN} answered</span>
        {streak >= 2 && (
          <span className="lsat-drill-streak">streak {streak}</span>
        )}
        <span
          style={{
            fontFamily: "var(--lsat-display)",
            fontVariantNumeric: "tabular-nums oldstyle-nums",
            fontSize: "1.1rem",
          }}
        >
          {score.toLocaleString()}
        </span>
      </div>
      <div className="lsat-timer-bar">
        <div
          className="lsat-timer-fill"
          style={{ width: `${(timeLeft / ROUND_SEC) * 100}%` }}
        />
      </div>
      <div className="lsat-q-meta">
        <span>
          PT&nbsp;{q.pt} · §{q.section_num} · Q&nbsp;{q.question_num} ({q.section_type})
        </span>
      </div>
      <p className="lsat-stem has-dropcap" style={{ minHeight: "8rem" }}>
        {q.stem}
      </p>
      {feedback ? (
        <div
          className="lsat-explanation"
          style={{
            borderLeftColor:
              feedback.kind === "correct"
                ? "var(--lsat-leaf, #4a6843)"
                : "var(--lsat-ribbon)",
            background:
              feedback.kind === "correct"
                ? "rgba(74, 104, 67, 0.10)"
                : "var(--lsat-ribbon-soft)",
          }}
        >
          <div
            className="lsat-explanation-head"
            style={{
              color:
                feedback.kind === "correct"
                  ? "var(--lsat-leaf, #4a6843)"
                  : "var(--lsat-ribbon-deep)",
            }}
          >
            {feedback.kind === "correct" ? "✓ correct" : "✗ wrong"} ·{" "}
            {LSAT_SKILL_LABELS[feedback.actual]}
          </div>
        </div>
      ) : (
        <div className="lsat-spotter-grid">
          {LSAT_SKILLS.map((s, i) => (
            <button
              key={s}
              type="button"
              className="lsat-spotter-btn"
              onClick={() => pick(s)}
            >
              <span className="lsat-spotter-num">{i + 1}</span>
              <span>{LSAT_SKILL_LABELS[s]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
