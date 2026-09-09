"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Globe, { GlobePoint } from "./Globe";
import { EVENT_CONTEXT, type Event } from "./events";
import { dailyGame, scoreGuess, type Guess, type ScoreResult } from "./game";
import PracticeRound from "./PracticeRound";
import TimePicker, { yearLabel } from "./TimePicker";

type BoardRow = { name: string; score: number };
type EventContext = { summary: string; title: string; url: string };
const NAME_KEY = "thenthere:name";
const TUTORIAL_KEY = "thenthere:practice-complete";

function ThenThere() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedDate = searchParams.get("date");
  const isCalendarDate =
    requestedDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) &&
    new Date(`${requestedDate}T00:00:00.000Z`).toISOString().slice(0, 10) ===
      requestedDate;
  const previewDate =
    pathname.endsWith("/thenthere/play") && isCalendarDate
      ? requestedDate
      : undefined;
  const isPreview = Boolean(previewDate);
  const daily = useMemo(() => dailyGame(previewDate), [previewDate]),
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
    [year, setYear] = useState(initialYear);
  const [guess, setGuess] = useState<GlobePoint | null>(null),
    [result, setResult] = useState<ScoreResult | null>(null),
    [total, setTotal] = useState(0),
    [finished, setFinished] = useState(false);
  const [name, setName] = useState(""),
    [board, setBoard] = useState<BoardRow[]>([]),
    [answers, setAnswers] = useState<Guess[]>([]),
    [posted, setPosted] = useState(false),
    [claimed, setClaimed] = useState(false),
    [submitError, setSubmitError] = useState(""),
    [shareState, setShareState] = useState(""),
    [practice, setPractice] = useState(false),
    [context, setContext] = useState<EventContext | null>(null),
    [contextState, setContextState] = useState<"idle" | "loading" | "error">(
      "idle",
    );
  const event = questions[round],
    bounds: [number, number] = focus?.years || event.years || [-4000, 2026];
  useEffect(() => {
    document.body.classList.add("then-there-mode");
    return () => document.body.classList.remove("then-there-mode");
  }, []);
  useEffect(() => {
    if (isPreview) return;
    try {
      setPractice(!localStorage.getItem(TUTORIAL_KEY));
    } catch {}
  }, [isPreview]);
  useEffect(() => {
    if (isPreview) return;
    fetch("/api/thenthere/leaderboard")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setBoard(d.scores);
        setClaimed(Boolean(d.submitted));
      })
      .catch(() => {});
  }, [isPreview]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved) setName(saved.slice(0, 18));
    } catch {}
  }, []);
  useEffect(() => {
    if (!result) {
      setContext(null);
      setContextState("idle");
      return;
    }
    const controller = new AbortController();
    setContext(null);
    setContextState("loading");
    fetch(`/api/thenthere/context?title=${encodeURIComponent(event.title)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: EventContext) => {
        setContext(data);
        setContextState("idle");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setContextState("error");
      });
    return () => controller.abort();
  }, [event.title, result]);
  const choose = (p: GlobePoint) => {
    if (!result) setGuess(p);
  };
  const lock = () => {
    if (!guess || result) return;
    const roundGuess = { ...guess, year };
    const next = scoreGuess(roundGuess, event);
    setResult(next);
    setAnswers((current) => [...current, roundGuess]);
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
  };
  const reset = () => {
    setRound(0);
    setYear(initialYear);
    setGuess(null);
    setResult(null);
    setTotal(0);
    setAnswers([]);
    setFinished(false);
    setPosted(false);
    setSubmitError("");
    setShareState("");
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
    if (isPreview || !entrant || posted || claimed || answers.length !== 6)
      return;
    setSubmitError("");
    try {
      localStorage.setItem(NAME_KEY, entrant);
    } catch {}
    try {
      const r = await fetch("/api/thenthere/leaderboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: entrant, answers }),
      });
      const data = await r.json();
      if (!r.ok) {
        setSubmitError(data.error || "Could not verify this run.");
        if (r.status === 409) setClaimed(true);
        return;
      }
      setBoard(data.scores);
      setTotal(data.score);
      setPosted(true);
      setClaimed(true);
    } catch {
      setSubmitError(
        "Could not verify this run. Check your connection and try again.",
      );
    }
  };
  const share = async () => {
    const text = `then/there · ${Math.round(total).toLocaleString()} / 3,000\nSix events. One map. One timeline.\nhttps://thenthere.grannis.xyz`;
    const browser = navigator as {
      share?: (data: ShareData) => Promise<void>;
      clipboard?: Clipboard;
    };
    try {
      if (browser.share) await browser.share({ title: "then/there", text });
      else await browser.clipboard?.writeText(text);
      setShareState(browser.share ? "Shared" : "Copied");
    } catch {
      setShareState("");
    }
  };
  const completePractice = () => {
    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch {}
    setPractice(false);
  };
  if (practice && !isPreview)
    return <PracticeRound onComplete={completePractice} />;
  if (finished)
    return (
      <main className="tt-shell">
        <Header total={total} previewDate={previewDate} />
        <section className="tt-end">
          <div className="tt-final">
            <p>
              {isPreview
                ? `Scheduled deck · ${previewDate}`
                : "Today’s expedition"}
            </p>
            <strong>{Math.round(total).toLocaleString()}</strong>
            <span>out of 3,000</span>
            <h1>
              {isPreview
                ? "Deck rehearsed. The public record is untouched."
                : total > 2200
                  ? "You knew where history stood."
                  : total > 1400
                    ? "A respectable passage through time."
                    : "The map remembers. Try again tomorrow."}
            </h1>
            <div className="tt-final-actions">
              <button onClick={share}>{shareState || "Share result"}</button>
              <button className="tt-quiet-button" onClick={reset}>
                ↻ Play again
              </button>
            </div>
          </div>
          <aside className="tt-leader">
            {isPreview ? (
              <>
                <h2>Scheduled rehearsal</h2>
                <p className="tt-empty-board">
                  This run has no leaderboard, verification, or field-notes
                  entry. It is only a view of the deck selected for this date.
                </p>
                <a className="tt-admin-return" href="/admin/thenthere">
                  Choose another date
                </a>
              </>
            ) : (
              <>
                <h2>♜ Today’s leaders</h2>
                {board.length ? (
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
                ) : (
                  <p className="tt-empty-board">
                    Be the first verified expedition today.
                  </p>
                )}
                {posted && rank !== null && rank > 4 && (
                  <p className="tt-rank">
                    You placed #{rank + 1} of {board.length} today.
                  </p>
                )}
                <label>
                  {posted || claimed ? "Verified run" : "Verify your score"}
                </label>
                <div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 18))}
                    placeholder="your name"
                    disabled={posted || claimed}
                  />
                  <button
                    onClick={submit}
                    disabled={!name.trim() || posted || claimed}
                  >
                    {posted
                      ? "Verified"
                      : claimed
                        ? "Already verified"
                        : "Verify"}
                  </button>
                </div>
                {submitError && (
                  <p className="tt-submit-error">{submitError}</p>
                )}
                <p className="tt-board-note">
                  Scores are computed from your six guesses on our server. One
                  verified run per browser each day.
                </p>
              </>
            )}
          </aside>
        </section>
      </main>
    );
  return (
    <main className="tt-shell">
      <Header total={total} round={round} previewDate={previewDate} />
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
              <p className="tt-globe-hint">
                Place pin: drag it under your finger · use Rotate to turn the
                globe · scroll or +/− to zoom
              </p>
            )}
            <div className="tt-globe-key">
              <span className="guess-dot" />
              guess{" "}
              {result && (
                <>
                  <i className="route-line" />
                  route
                  <span className="answer-dot" />
                  answer
                </>
              )}
            </div>
          </div>
        </div>
        <aside className="tt-time">
          <TimePicker
            year={year}
            bounds={bounds}
            answer={result ? event.year : null}
            disabled={!!result}
            onChange={(y) => {
              setYear(y);
              setResult(null);
            }}
          />
          {result ? (
            <div className="tt-result">
              <div className="tt-result-score">
                <span>+ {result.points.toFixed(1)}</span>
                <small>of 500 points</small>
              </div>
              <p>
                <b>{event.place}</b> · {yearLabel(event.year)}
              </p>
              <aside
                className="tt-context"
                aria-live="polite"
                aria-label="What happened"
              >
                <b>What happened</b>
                {contextState === "loading" && (
                  <p>Finding a short historical note…</p>
                )}
                {context && (
                  <>
                    <p>{context.summary}</p>
                    <a href={context.url} target="_blank" rel="noreferrer">
                      Read {context.title} on Wikipedia ↗
                    </a>
                  </>
                )}
                {contextState === "error" && (
                  <p>
                    {EVENT_CONTEXT[event.title] ??
                      "A short explainer could not load. Try again in a moment."}
                  </p>
                )}
              </aside>
              {(result.spaceScale >= 2000 || result.eraScale >= 60) && (
                <p className="tt-confidence-note">
                  {result.spaceScale >= 2000 && "Regional location accepted"}
                  {result.spaceScale >= 2000 && result.eraScale >= 60 && " · "}
                  {result.eraScale >= 60 && "Date is approximate"}
                </p>
              )}
              <div className="tt-result-breakdown" aria-label="Score breakdown">
                <div>
                  <span>Place</span>
                  <b>−{result.spaceLoss.toFixed(1)} pts</b>
                  <small>
                    {Math.round(result.distance).toLocaleString()} km away
                  </small>
                </div>
                <div>
                  <span>Time</span>
                  <b>−{result.timeLoss.toFixed(1)} pts</b>
                  <small>
                    {Math.round(result.yearError).toLocaleString()} years off
                  </small>
                </div>
              </div>
              <p className="tt-metric-note">
                Combined L² distance: {result.metric.toFixed(2)}
              </p>
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

function Header({
  total,
  round,
  previewDate,
}: {
  total: number;
  round?: number;
  previewDate?: string;
}) {
  return (
    <header className="tt-top">
      <div className="tt-brand">
        <a href={previewDate ? "/admin/thenthere" : "/"} className="tt-mark">
          <span>then</span>
          <i>/</i>
          <span>there</span>
        </a>
        {previewDate ? (
          <span className="tt-history-link">
            scheduled deck · {previewDate}
          </span>
        ) : (
          <a href="/thenthere/history" className="tt-history-link">
            field notes
          </a>
        )}
      </div>
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

export default function ThenTherePage() {
  return (
    <Suspense fallback={<main className="tt-shell" />}>
      <ThenThere />
    </Suspense>
  );
}
