"use client";

import { useId, useRef, useState } from "react";

type BoardRow = { name: string; score: number };
type RankedBoardRow = BoardRow & { rank: number };
type PlayerPlacement = { rank: number; total: number; scores: RankedBoardRow[] };

export default function LeaderboardTab() {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [scores, setScores] = useState<BoardRow[]>([]);
  const [player, setPlayer] = useState<PlayerPlacement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  async function open() {
    dialog.current?.showModal();
    setStatus("loading");
    try {
      const response = await fetch("/api/thenthere/leaderboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Leaderboard unavailable");
      const data = await response.json() as { scores: BoardRow[]; player: PlayerPlacement | null };
      setScores(data.scores);
      setPlayer(data.player);
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
            <>
              <ol>
                {scores.slice(0, 20).map((row, i) => (
                  <li key={`${row.name}-${i}`} className={player?.rank === i + 1 ? "is-you" : ""}>
                    <span>{i + 1}</span><b>{row.name}</b><strong>{row.score.toLocaleString()}</strong>
                  </li>
                ))}
              </ol>
              {player && player.rank > 20 && (
                <section className="tt-player-placement" aria-label={`Your place, rank ${player.rank}`}>
                  <p className="tt-rank">Your place · #{player.rank.toLocaleString()} of {player.total.toLocaleString()} today</p>
                  <ol>
                    {player.scores.map((row) => (
                      <li key={`${row.rank}-${row.name}-${row.score}`} className={row.rank === player.rank ? "is-you" : ""}>
                        <span>{row.rank.toLocaleString()}</span><b>{row.name}</b><strong>{row.score.toLocaleString()}</strong>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          ) : <p className="tt-empty-board">Be the first verified expedition today.</p>)}
          <button onClick={() => dialog.current?.close()} autoFocus>Back to game</button>
        </div>
      </dialog>
    </>
  );
}
