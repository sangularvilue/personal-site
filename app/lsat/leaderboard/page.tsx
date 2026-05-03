"use client";
import { useEffect, useState } from "react";
import {
  LSAT_SKILLS,
  LSAT_SKILL_LABELS,
  arabicToRoman,
  type LSATGameMode,
  type LSATSkill,
} from "@/lib/lsat-types";

const GAMES: Array<{ key: LSATGameMode; label: string }> = [
  { key: "drill", label: "Adaptive" },
  { key: "spotter", label: "Spotter" },
  { key: "streak", label: "Streak" },
  { key: "daily", label: "Daily" },
  { key: "speed", label: "Speed" },
  { key: "skill-focus", label: "Skill" },
  { key: "section-focus", label: "Section" },
  { key: "marathon", label: "Marathon" },
];

const WINDOWS: Array<{ key: "all" | "weekly" | "daily"; label: string }> = [
  { key: "all", label: "All time" },
  { key: "weekly", label: "This week" },
  { key: "daily", label: "Today" },
];

export default function LeaderboardPage() {
  const [game, setGame] = useState<LSATGameMode>("drill");
  const [skill, setSkill] = useState<LSATSkill | "all">("all");
  const [window, setWindow] = useState<"all" | "weekly" | "daily">("all");
  const [rows, setRows] = useState<
    { uid: string; display_name: string; score: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      game,
      skill,
      window,
      limit: "25",
    });
    fetch(`/api/lsat/leaderboard?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows || []);
      })
      .finally(() => setLoading(false));
  }, [game, skill, window]);

  return (
    <div>
      <div className="lsat-edition">
        <span>Vol. <em>I</em></span>
        <span>The Roll</span>
        <span>No. <em>II</em></span>
      </div>

      <h1 className="lsat-h1">
        The <em>Roll</em>.
      </h1>
      <p className="lsat-sub">
        Highest scores in each chapter. The first ribbon belongs to the
        first name on the roll.
      </p>

      <div className="lsat-fleuron" aria-hidden>
        <span>❦</span>
      </div>

      <div className="lsat-pill-row">
        {GAMES.map((g) => (
          <button
            key={g.key}
            className="lsat-pill"
            aria-pressed={game === g.key}
            onClick={() => setGame(g.key)}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="lsat-pill-row">
        <button
          className="lsat-pill"
          aria-pressed={skill === "all"}
          onClick={() => setSkill("all")}
        >
          All skills
        </button>
        {LSAT_SKILLS.map((s) => (
          <button
            key={s}
            className="lsat-pill"
            aria-pressed={skill === s}
            onClick={() => setSkill(s)}
          >
            {LSAT_SKILL_LABELS[s]}
          </button>
        ))}
      </div>
      <div className="lsat-pill-row">
        {WINDOWS.map((w) => (
          <button
            key={w.key}
            className="lsat-pill"
            aria-pressed={window === w.key}
            onClick={() => setWindow(w.key)}
          >
            {w.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="lsat-empty">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="lsat-empty">No scores in this slice yet.</p>
      ) : (
        <table className="lsat-lb-table">
          <thead>
            <tr>
              <th style={{ width: "3rem" }}>Rank</th>
              <th>Name</th>
              <th className="score" style={{ textAlign: "right" }}>
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.uid + i}>
                <td
                  style={{
                    fontFamily: "var(--lsat-display)",
                    fontStyle: "italic",
                    color: "var(--lsat-ink-soft)",
                  }}
                >
                  {arabicToRoman(i + 1)}.
                </td>
                <td>{r.display_name}</td>
                <td className="score">{r.score.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
