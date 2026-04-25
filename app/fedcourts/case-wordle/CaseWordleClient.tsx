"use client";
import { useEffect, useState } from "react";

type Props = {
  date: string;
  caseId: string;
  clues: string[];
  caseCount: number;
};

type CaseLite = { id: string; name: string };

export default function CaseWordleClient({ date, caseId, clues, caseCount }: Props) {
  const [allCases, setAllCases] = useState<CaseLite[]>([]);
  const [revealed, setRevealed] = useState(1);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [solved, setSolved] = useState<boolean | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/fc/cases").then((r) => r.json()).then((d) => setAllCases(d.cases));
  }, []);

  function guess(id: string) {
    if (solved !== null) return;
    const newGuesses = [...guesses, id];
    setGuesses(newGuesses);
    if (id === caseId) {
      setSolved(true);
      submit(true);
    } else if (newGuesses.length >= 5) {
      setSolved(false);
      submit(false);
    } else {
      setRevealed(Math.min(clues.length, newGuesses.length + 1));
    }
  }

  async function submit(correct: boolean) {
    await fetch("/api/fc/case-wordle/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, case_id: caseId, correct, guesses: guesses.length + (correct ? 1 : 0) }),
    });
  }

  const filtered = filter
    ? allCases.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase())).slice(0, 8)
    : [];
  const guessSet = new Set(guesses);

  const target = allCases.find((c) => c.id === caseId);

  return (
    <div className="fc-daily-card">
      <h1 className="fc-h1">Case Wordle</h1>
      <p className="fc-countdown">{date} · {caseCount} cases in pool</p>

      {clues.slice(0, revealed).map((c, i) => (
        <div key={i} className="fc-clue-tier">
          <div className="fc-clue-tier-label">Clue {i + 1}</div>
          {c}
        </div>
      ))}

      <div className="fc-guess-pips">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`fc-guess-pip ${
              i < guesses.length
                ? solved && i === guesses.length - 1
                  ? "solved"
                  : "used"
                : ""
            }`}
          />
        ))}
      </div>

      {solved === null ? (
        <>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Type a case name…"
            style={{
              width: "100%",
              padding: "0.7rem 1rem",
              borderRadius: "0.5rem",
              background: "var(--fc-bg-elevated)",
              border: "1px solid var(--fc-border-strong)",
              color: "var(--fc-text)",
              font: "inherit",
              fontSize: "1rem",
            }}
          />
          {filter && filtered.length > 0 && (
            <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {filtered.map((c) => (
                <button
                  key={c.id}
                  className="fc-option"
                  disabled={guessSet.has(c.id)}
                  onClick={() => { setFilter(""); guess(c.id); }}
                  style={{ padding: "0.5rem 0.85rem", fontSize: "0.9rem" }}
                >
                  <span className="fc-option-text">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="fc-explanation" style={{ marginTop: "1rem" }}>
          <div className="fc-explanation-case">
            {solved ? "✓ Solved" : "✗ Not quite"} · {target?.name || "—"}
          </div>
          <div>{guesses.length} {guesses.length === 1 ? "guess" : "guesses"}</div>
        </div>
      )}
    </div>
  );
}
