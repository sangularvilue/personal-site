"use client";
import { useEffect, useState } from "react";
import DrillEngine from "./DrillEngine";
import type {
  LSATGameMode,
  LSATSectionType,
  LSATSkill,
} from "@/lib/lsat-types";

type Q = Parameters<typeof DrillEngine>[0]["questions"][number];

type Props = {
  gameMode: LSATGameMode;
  apiQuery: string; // already includes ? prefix; e.g. "?adaptive=1&n=15"
  skillFilter?: LSATSkill | "all";
  timeLimitSec?: number;
  heading: string;
  subheading?: string;
};

export default function DrillLoader(props: Props) {
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [me, setMe] = useState<{
    is_admin: boolean;
    is_authed: boolean;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/lsat/me").then((r) => r.json()),
      fetch(`/api/lsat/questions${props.apiQuery}`).then((r) => r.json()),
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
  }, [props.apiQuery]);

  if (error) return <div className="lsat-empty">{error}</div>;
  if (!questions || !me) return <div className="lsat-empty">Loading…</div>;
  if (questions.length === 0)
    return <div className="lsat-empty">No questions available.</div>;

  return (
    <div>
      <div style={{ marginBottom: "1.4rem" }}>
        <h1 className="lsat-h1" style={{ fontSize: "1.8rem" }}>
          {props.heading}
        </h1>
        {props.subheading && (
          <p className="lsat-sub" style={{ marginBottom: 0 }}>
            {props.subheading}
          </p>
        )}
      </div>
      <DrillEngine
        gameMode={props.gameMode}
        skillFilter={props.skillFilter}
        questions={questions}
        timeLimitSec={props.timeLimitSec ?? 0}
        isAdmin={me.is_admin}
        isAuthed={me.is_authed}
      />
    </div>
  );
}

export type { LSATSectionType };
