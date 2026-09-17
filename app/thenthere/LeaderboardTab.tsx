"use client";

import { useId, useRef, useState } from "react";

type BoardRow = { name: string; score: number };

export default function LeaderboardTab() {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [scores, setScores] = useState<BoardRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  async function open() {
    dialog.current?.showModal();
    setStatus("loading");
    try {
      const response = await fetch("/api/thenthere/leaderboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Leaderboard unavailable");
      const data = await response.json();
      setScores(data.scores);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button className="tt-leaderboard-tab" onClick={open} aria-haspopup="dialog">
        leaderboard
      </button>
      <dialog ref={dialog} className="tt-leaderboard-dialog" aria-labelledby={titleId}>
        <div className="tt-leader">
          <h2 id={titleId}>Today’s leaders</h2>
          {status === "loading" && <p className="tt-empty-board" role="status">Loading today’s leaders…</p>}
          {status === "error" && <p className="tt-empty-board" role="alert">The leaderboard couldn’t load. Close and reopen it to try again.</p>}
          {status === "ready" && (scores.length ? (
            <ol>
              {scores.map((row, i) => (
                <li key={`${row.name}-${i}`}>
                  <span>{i + 1}</span><b>{row.name}</b><strong>{row.score.toLocaleString()}</strong>
                </li>
              ))}
            </ol>
          ) : <p className="tt-empty-board">Be the first verified expedition today.</p>)}
          <button onClick={() => dialog.current?.close()} autoFocus>Back to game</button>
        </div>
      </dialog>
    </>
  );
}
