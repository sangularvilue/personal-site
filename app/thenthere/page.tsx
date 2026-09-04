"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { GlobePoint } from "./Globe";
import { EVENTS, FOCUSES, type Event } from "./events";

type Result = {
  points: number;
  distance: number;
  yearError: number;
  metric: number;
  eraScale: number;
  spaceScale: number;
};
type BoardRow = { name: string; score: number };
const NAME_KEY = "thenthere:name";

const FALLBACK: BoardRow[] = [
  { name: "atlas_finch", score: 2468 },
  { name: "yearzero", score: 2312 },
  { name: "cicero_7", score: 2190 },
];
const ZOOM_SPANS = [6026, 1200, 240, 40, 4, 0.2],
  ZOOM_LABELS = [
    "millennia",
    "centuries",
    "decades",
    "years",
    "months",
    "days",
  ];
function dailyGame() {
  let seed =
    [...new Date().toISOString().slice(0, 10)].reduce(
      (n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619),
      2166136261,
    ) >>> 0;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const focus =
      seed % 5 === 0 ? FOCUSES[Math.floor(rand() * FOCUSES.length)] : null,
    deck = focus?.deck || EVENTS;
  return {
    focus,
    questions: [...deck]
      .map((event) => ({ event, rank: rand() / event.weight }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 6)
      .map((x) => x.event),
  };
}
function yearLabel(year: number, detailed = false) {
  if (detailed && Math.abs(year - Math.round(year)) > 0.005) {
    const whole = Math.floor(year),
      month = Math.max(1, Math.min(12, Math.round((year - whole) * 12 + 1)));
    return `${new Date(2000, month - 1).toLocaleString("en", { month: "short" })} ${Math.abs(whole)} ${whole < 0 ? "BC" : "AD"}`;
  }
  return `${Math.round(Math.abs(year))} ${year < 0 ? "BC" : "AD"}`;
}
function greatCircle(a: GlobePoint, b: GlobePoint) {
  const r = Math.PI / 180,
    dLat = (b.lat - a.lat) * r,
    dLon = (b.lon - a.lon) * r,
    h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function scoreGuess(guess: GlobePoint, year: number, event: Event): Result {
  const distance = greatCircle(guess, event),
    yearError = Math.abs(year - event.year),
    eraScale =
      event.timeScale ??
      Math.max(6, Math.min(140, (2026 - event.year) * 0.075)),
    spaceScale = event.spaceScale ?? 1800;
  const metric = Math.hypot(distance / spaceScale, yearError / eraScale),
    points = Math.round((500 / (1 + metric ** 1.65)) * 10) / 10;
  return { points, distance, yearError, metric, eraScale, spaceScale };
}

export default function ThenThere() {
  const daily = useMemo(dailyGame, []),
    questions = daily.questions,
    focus = daily.focus;
  const startYear = (item: Event) =>
    focus
      ? (focus.years[0] + focus.years[1]) / 2
      : item.years
        ? (item.years[0] + item.years[1]) / 2
        : 1000;
  const initialYear = startYear(questions[0]);
  const [round, setRound] = useState(0),
    [year, setYear] = useState(initialYear),
    [zoom, setZoom] = useState(0);
  const [guess, setGuess] = useState<GlobePoint | null>(null),
    [result, setResult] = useState<Result | null>(null),
    [total, setTotal] = useState(0),
    [finished, setFinished] = useState(false);
  const [name, setName] = useState(""),
    [board, setBoard] = useState<BoardRow[]>(FALLBACK),
    [posted, setPosted] = useState(false),
    hold = useRef<ReturnType<typeof setInterval> | null>(null);
  const event = questions[round],
    bounds: [number, number] = focus?.years || event.years || [-4000, 2026],
    span = Math.min(ZOOM_SPANS[zoom], bounds[1] - bounds[0]),
    min = Math.max(bounds[0], year - span / 2),
    max = Math.min(bounds[1], year + span / 2);
  const nudge =
    zoom >= 4 ? 1 : zoom === 3 ? 5 : zoom === 2 ? 20 : zoom === 1 ? 100 : 500;
  const nudgeYear = (amount: number) => {
    setYear((y) => Math.max(bounds[0], Math.min(bounds[1], y + amount)));
    setResult(null);
  };
  useEffect(() => {
    document.body.classList.add("then-there-mode");
    return () => document.body.classList.remove("then-there-mode");
  }, []);
  useEffect(() => {
    fetch("/api/thenthere/leaderboard")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setBoard(d.scores))
      .catch(() => {});
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved) setName(saved.slice(0, 18));
    } catch {}
  }, []);
  const stopHold = useCallback(() => {
    if (hold.current) clearInterval(hold.current);
    hold.current = null;
  }, []);
  const startHold = () => {
    stopHold();
    hold.current = setInterval(
      () => setZoom((z) => Math.min(ZOOM_SPANS.length - 1, z + 1)),
      620,
    );
  };
  useEffect(() => stopHold, [stopHold]);
  const choose = (p: GlobePoint) => {
    if (!result) setGuess(p);
  };
  const lock = () => {
    if (!guess || result) return;
    const next = scoreGuess(guess, year, event);
    setResult(next);
    setTotal((t) => Math.round((t + next.points) * 10) / 10);
  };
  const advance = () => {
    if (round === 5) {
      setFinished(true);
      return;
    }
    setRound((r) => r + 1);
    setGuess(null);
    setResult(null);
    setYear(startYear(questions[round + 1]));
    setZoom(0);
  };
  const reset = () => {
    setRound(0);
    setYear(initialYear);
    setZoom(0);
    setGuess(null);
    setResult(null);
    setTotal(0);
    setFinished(false);
    setPosted(false);
  };
  const rank = posted
    ? (() => {
        const i = board.findIndex(
          (r) => r.name === name.trim() && r.score === Math.round(total),
        );
        return i === -1 ? null : i;
      })()
    : null;
  const submit = async () => {
    const entrant = name.trim();
    if (!entrant || posted) return;
    try {
      localStorage.setItem(NAME_KEY, entrant);
    } catch {}
    try {
      const r = await fetch("/api/thenthere/leaderboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: entrant, score: Math.round(total) }),
      });
      if (r.ok) setBoard((await r.json()).scores);
    } catch {}
    setPosted(true);
  };
  if (finished)
    return (
      <main className="tt-shell">
        <Header total={total} />
        <section className="tt-end">
          <div className="tt-final">
            <p>Today’s expedition</p>
            <strong>{Math.round(total).toLocaleString()}</strong>
            <span>out of 3,000</span>
            <h1>
              {total > 2200
                ? "You knew where history stood."
                : total > 1400
                  ? "A respectable passage through time."
                  : "The map remembers. Try again tomorrow."}
            </h1>
            <button onClick={reset}>↻ Play again</button>
          </div>
          <aside className="tt-leader">
            <h2>♜ Today’s leaders</h2>
            <ol>
              {board.slice(0, 5).map((row, i) => (
                <li
                  key={`${row.name}-${i}`}
                  className={
                    posted &&
                    row.name === name.trim() &&
                    row.score === Math.round(total)
                      ? "is-you"
                      : ""
                  }
                >
                  <span>{i + 1}</span>
                  <b>{row.name}</b>
                  <strong>{row.score.toLocaleString()}</strong>
                </li>
              ))}
            </ol>
            {posted && rank !== null && rank > 4 && (
              <p className="tt-rank">
                You placed #{rank + 1} of {board.length} today.
              </p>
            )}
            <label>{posted ? "Posted as" : "Post your score"}</label>
            <div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 18))}
                placeholder="your name"
                disabled={posted}
              />
              <button onClick={submit} disabled={!name.trim() || posted}>
                {posted ? "Posted" : "Join board"}
              </button>
            </div>
          </aside>
        </section>
      </main>
    );
  return (
    <main className="tt-shell">
      <Header total={total} round={round} />
      <section className="tt-play">
        <div className="tt-prompt">
          <div>
            {focus && (
              <div className="tt-focus">
                <b>Today’s focus</b>
                <span>{focus.name}</span>
                <em>{focus.note}</em>
              </div>
            )}
            <p className="tt-kicker">
              Round {round + 1} of 6 <span>{event.field}</span>
            </p>
            <h1>{event.title}</h1>
            <p className="tt-instruction">Place it in space and time.</p>
          </div>
          <div className="tt-globe-wrap">
            <Globe
              guess={guess}
              answer={result ? event : null}
              locked={!!result}
              onGuess={choose}
              view={focus?.view}
            />
            {!guess && (
              <p className="tt-globe-hint">Drag to rotate · click to mark</p>
            )}
            <div className="tt-globe-key">
              <span className="guess-dot" />
              guess{" "}
              {result && (
                <>
                  <span className="answer-dot" />
                  answer
                </>
              )}
            </div>
          </div>
        </div>
        <aside className="tt-time">
          <div className="tt-year">
            <p>Your year</p>
            <strong>
              {yearLabel(year, zoom > 3).replace(/ (BC|AD)$/, "")}
            </strong>
            <span>{year < 0 ? "BC" : "AD"}</span>
          </div>
          <div className="tt-zoom">
            <button
              onClick={() => setZoom((z) => Math.max(0, z - 1))}
              disabled={zoom === 0}
              aria-label="Zoom timeline out"
            >
              −
            </button>
            <span>
              <small>Timeline scale</small>
              {ZOOM_LABELS[zoom]}
            </span>
            <div className="tt-zoom-bars">
              {ZOOM_LABELS.map((_, i) => (
                <i key={i} className={i <= zoom ? "on" : ""} />
              ))}
            </div>
            <button
              onClick={() =>
                setZoom((z) => Math.min(ZOOM_SPANS.length - 1, z + 1))
              }
              disabled={zoom === ZOOM_SPANS.length - 1}
              aria-label="Zoom timeline in"
            >
              +
            </button>
          </div>
          <div className="tt-window">
            <button onClick={() => nudgeYear(-nudge)}>← {nudge}y</button>
            <span>
              Available: {yearLabel(bounds[0])}–{yearLabel(bounds[1])}
            </span>
            <button onClick={() => nudgeYear(nudge)}>{nudge}y →</button>
          </div>
          <div
            className="tt-timeline"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerCancel={stopHold}
            onPointerLeave={stopHold}
          >
            <input
              type="range"
              aria-label="Choose a year"
              min={min}
              max={max}
              step={zoom === 5 ? 1 / 365 : zoom === 4 ? 1 / 12 : 1}
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value));
                setResult(null);
              }}
            />
            <div>
              <span>{yearLabel(min)}</span>
              <span>{yearLabel((min + max) / 2)}</span>
              <span>{yearLabel(max)}</span>
            </div>
          </div>
          <p className="tt-note">
            Drag the date. Use +/− for deliberate zoom, or press and hold the
            slider to zoom continuously.
          </p>
          {result ? (
            <div className="tt-result">
              <div>
                <span>+ {result.points.toFixed(1)}</span> points
              </div>
              <p>
                <b>{event.place}</b> · {yearLabel(event.year)}
              </p>
              <ul>
                <li>{Math.round(result.distance).toLocaleString()} km away</li>
                <li>
                  {Math.round(result.yearError).toLocaleString()} years off
                </li>
                <li>L² distance {result.metric.toFixed(2)}</li>
              </ul>
              <button onClick={advance}>
                {round === 5 ? "See today’s score" : "Next event"} →
              </button>
            </div>
          ) : (
            <>
              <button className="tt-lock" onClick={lock} disabled={!guess}>
                Lock in this guess
              </button>
              <p className="tt-ready">
                {guess
                  ? "Location marked. Adjust the year, then lock it in."
                  : "Rotate the globe and mark a location."}
              </p>
            </>
          )}
          <div className="tt-rule">
            <span>Surface-distance scale</span>
            <b>{(event.spaceScale ?? 1800).toLocaleString()} km</b>
            <span>Date scale</span>
            <b>
              {event.timeScale ? `${event.timeScale} years` : "Era-adjusted"}
            </b>
            <span>Distance</span>
            <b>L²</b>
            <span>Perfect round</span>
            <b>500 pts</b>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Header({ total, round }: { total: number; round?: number }) {
  return (
    <header className="tt-top">
      <a href="/" className="tt-mark">
        <span>then</span>
        <i>/</i>
        <span>there</span>
      </a>
      {round !== undefined ? (
        <div className="tt-rounds">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={i === round ? "active" : i < round ? "done" : ""}
            >
              {i < round ? "✓" : i + 1}
            </span>
          ))}
        </div>
      ) : (
        <div />
      )}
      <div className="tt-score">{Math.round(total).toLocaleString()} pts</div>
    </header>
  );
}
