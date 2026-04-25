"use client";
import { useEffect, useState } from "react";
import { FC_CATEGORIES, FC_CATEGORY_LABELS, type FCGameMode } from "@/lib/fc-types";

type Row = { uid: string; display_name: string; score: number };

const games: Array<{ id: FCGameMode; name: string; needsCategory: boolean }> = [
  { id: "speed-drill", name: "Speed Drill", needsCategory: true },
  { id: "drills", name: "Drills", needsCategory: false },
  { id: "daily-hypo", name: "Daily Hypo", needsCategory: false },
  { id: "case-wordle", name: "Case Wordle", needsCategory: false },
  { id: "case-match", name: "Case Match", needsCategory: false },
  { id: "rule-builder", name: "Rule Builder", needsCategory: false },
  { id: "which-prong", name: "Which Prong?", needsCategory: false },
];

export default function LeaderboardPage() {
  const [game, setGame] = useState<FCGameMode>("speed-drill");
  const [category, setCategory] = useState<string>("just");
  const [window_, setWindow] = useState<string>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const meta = games.find((g) => g.id === game)!;

  useEffect(() => {
    setLoading(true);
    const cat = meta.needsCategory ? category : "all";
    fetch(`/api/fc/leaderboard?game=${game}&category=${cat}&window=${window_}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .finally(() => setLoading(false));
  }, [game, category, window_, meta.needsCategory]);

  return (
    <div>
      <h1 className="fc-h1">Leaderboard</h1>
      <p className="fc-sub">Top players across games. EST daily reset.</p>

      <div className="fc-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            className={`fc-tab ${game === g.id ? "fc-tab-active" : ""}`}
            onClick={() => setGame(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>

      {meta.needsCategory && (
        <div className="fc-tabs">
          {FC_CATEGORIES.map((c) => (
            <button
              key={c}
              className={`fc-tab ${category === c ? "fc-tab-active" : ""}`}
              onClick={() => setCategory(c)}
            >
              {FC_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      )}

      <div className="fc-tabs">
        {[
          ["all", "All-time"],
          ["today", "Today"],
        ].map(([k, label]) => (
          <button
            key={k}
            className={`fc-tab ${window_ === k ? "fc-tab-active" : ""}`}
            onClick={() => setWindow(k)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="fc-leaderboard">
        {loading ? (
          <div className="fc-empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="fc-empty">No scores yet. Be the first.</div>
        ) : (
          rows.map((r, i) => (
            <div key={r.uid + i} className="fc-lb-row">
              <span className="fc-lb-rank">{i + 1}</span>
              <span className="fc-lb-name">{r.display_name}</span>
              <span className="fc-lb-score">{r.score.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
