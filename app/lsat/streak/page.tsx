"use client";
import { useEffect, useState } from "react";
import DrillEngine from "../components/DrillEngine";

type Q = Parameters<typeof DrillEngine>[0]["questions"][number];

export default function StreakPage() {
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [me, setMe] = useState<{
    is_admin: boolean;
    is_authed: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/lsat/me").then((r) => r.json()),
      fetch("/api/lsat/questions?adaptive=1&n=50").then((r) => r.json()),
    ])
      .then(([meData, qData]) => {
        setMe({
          is_admin: !!meData.is_admin,
          is_authed: !!meData.user,
        });
        if (qData.ok) setQuestions(qData.questions);
        else setError(qData.error || "Failed to load");
      })
      .catch(() => setError("Failed to load"));
  }, []);

  if (error) return <div className="lsat-empty">{error}</div>;
  if (!questions || !me) return <div className="lsat-empty">Loading…</div>;
  if (questions.length === 0)
    return <div className="lsat-empty">No questions available.</div>;

  if (!started) {
    return (
      <div>
        <h1 className="lsat-h1">
          The <em>Streak</em>.
        </h1>
        <p className="lsat-sub">
          Answer correctly to add a ribbon. One wrong ends the run. The
          longer you go, the more you have to lose.
        </p>
        <div className="lsat-fleuron" aria-hidden>
          <span>❦</span>
        </div>
        <p
          className="lsat-footnote"
          style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}
        >
          You may cash out after any correct answer to bank the streak as
          your score. Untimed.
        </p>
        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="lsat-drill-next"
            style={{ marginTop: "1rem" }}
          >
            Begin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "1.6rem", textAlign: "center" }}>
        <h1
          className="lsat-h1"
          style={{ fontSize: "2.4rem", marginBottom: "0.4rem" }}
        >
          The Streak
        </h1>
        <p
          className="lsat-sub"
          style={{ marginBottom: "0.4rem", fontSize: "1rem" }}
        >
          One wrong ends the run.
        </p>
        <div className="lsat-fleuron" aria-hidden style={{ margin: "0.6rem 0" }}>
          <span>❦</span>
        </div>
      </div>
      <DrillEngine
        gameMode="streak"
        skillFilter="all"
        questions={questions}
        timeLimitSec={0}
        isAdmin={me.is_admin}
        isAuthed={me.is_authed}
        streakMode
      />
    </div>
  );
}
