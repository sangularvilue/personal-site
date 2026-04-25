"use client";
import { useEffect, useState } from "react";

type CaseLite = { id: string; name: string; holding: string };
type Card = { key: string; caseId: string; kind: "name" | "holding"; text: string };

function shuffle<T>(a: T[]): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

export default function MatchPage() {
  const [pairs, setPairs] = useState(6);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mismatches, setMismatches] = useState(0);
  const [startMs, setStartMs] = useState(0);
  const [done, setDone] = useState(false);
  const [allCases, setAllCases] = useState<CaseLite[] | null>(null);

  useEffect(() => {
    fetch("/api/fc/cases?withHolding=1").then((r) => r.json()).then((d) => setAllCases(d.cases));
  }, []);

  function newGame(p = pairs) {
    if (!allCases) return;
    setPairs(p);
    const picked = shuffle(allCases).slice(0, p);
    const cs: Card[] = [];
    for (const c of picked) {
      cs.push({ key: c.id + ":n", caseId: c.id, kind: "name", text: c.name });
      cs.push({ key: c.id + ":h", caseId: c.id, kind: "holding", text: c.holding });
    }
    setCards(shuffle(cs));
    setFlipped([]);
    setMatched(new Set());
    setMismatches(0);
    setStartMs(Date.now());
    setDone(false);
  }

  useEffect(() => {
    if (allCases) newGame(6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCases]);

  function flip(key: string) {
    if (flipped.length >= 2 || flipped.includes(key) || matched.has(key)) return;
    const newFlipped = [...flipped, key];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      const [a, b] = newFlipped.map((k) => cards.find((c) => c.key === k)!);
      if (a.caseId === b.caseId && a.kind !== b.kind) {
        setTimeout(() => {
          const m = new Set(matched);
          m.add(a.key);
          m.add(b.key);
          setMatched(m);
          setFlipped([]);
          if (m.size === cards.length) finish();
        }, 350);
      } else {
        setMismatches((x) => x + 1);
        setTimeout(() => setFlipped([]), 800);
      }
    }
  }

  async function finish() {
    setDone(true);
    const seconds = Math.round((Date.now() - startMs) / 1000);
    const score = Math.max(0, 1000 - mismatches * 50 - seconds * 5 + (mismatches === 0 ? 500 : 0));
    await fetch("/api/fc/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "case-match", category: `pairs:${pairs}`, score }),
    });
  }

  if (!allCases) return <div className="fc-empty">Loading…</div>;

  return (
    <div>
      <h1 className="fc-h1">Case Match</h1>
      <p className="fc-sub">Match each case name with its holding. Fewer mismatches and faster = higher score.</p>
      <div className="fc-tabs">
        {[6, 8, 10].map((p) => (
          <button key={p} className={`fc-tab ${pairs === p ? "fc-tab-active" : ""}`} onClick={() => newGame(p)}>
            {p} pairs
          </button>
        ))}
        <button className="fc-tab" onClick={() => newGame(pairs)}>Restart</button>
      </div>
      <div className="fc-drill-header">
        <span>{matched.size / 2} / {pairs} matched</span>
        <span>✗ {mismatches}</span>
      </div>
      <div className="fc-match-grid">
        {cards.map((c) => {
          const isFlipped = flipped.includes(c.key) || matched.has(c.key);
          return (
            <div
              key={c.key}
              className={`fc-match-card ${matched.has(c.key) ? "matched" : isFlipped ? "flipped" : ""}`}
              onClick={() => flip(c.key)}
            >
              {isFlipped ? <span>{c.text}</span> : <span className="fc-match-back">?</span>}
            </div>
          );
        })}
      </div>
      {done && (
        <div className="fc-results" style={{ marginTop: "2rem" }}>
          <p className="fc-results-score">Done!</p>
          <p className="fc-results-detail">{mismatches} mismatches</p>
          <div className="fc-results-actions">
            <button onClick={() => newGame(pairs)} className="primary">Play again</button>
            <a href="/leaderboard">Leaderboard</a>
          </div>
        </div>
      )}
    </div>
  );
}
