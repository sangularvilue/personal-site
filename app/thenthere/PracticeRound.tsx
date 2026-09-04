"use client";

import { useState } from "react";
import type { Event } from "./events";
import Globe, { type GlobePoint } from "./Globe";
import { scoreGuess, type ScoreResult } from "./game";
import TimePicker, { yearLabel } from "./TimePicker";

const PRACTICE: Event = {
  title: "The first modern Olympic Games open.",
  year: 1896,
  lat: 37.97,
  lon: 23.72,
  place: "Athens, Greece",
  field: "Practice",
  weight: 1,
  years: [1800, 2026],
  spaceScale: 900,
  timeScale: 12,
};

export default function PracticeRound({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [guess, setGuess] = useState<GlobePoint | null>(null);
  const [year, setYear] = useState(1900);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const phase = result ? "reveal" : guess ? "time" : "place";

  return (
    <main className="tt-shell">
      <header className="tt-top">
        <a href="/" className="tt-mark">
          <span>then</span>
          <i>/</i>
          <span>there</span>
        </a>
        <div className="tt-practice-mark">practice</div>
        <button className="tt-skip-practice" onClick={onComplete}>
          Skip
        </button>
      </header>
      <section className="tt-play tt-practice">
        <div className="tt-prompt">
          <div>
            <p className="tt-kicker">A one-round orientation</p>
            <h1>{PRACTICE.title}</h1>
            <p className="tt-instruction">
              {phase === "place" &&
                "First, rotate the globe and click near where it happened."}
              {phase === "time" &&
                "Good. Now set the year and lock the practice guess."}
              {phase === "reveal" &&
                "That’s the whole game: one place, one date, one reveal."}
            </p>
          </div>
          <div className="tt-globe-wrap">
            <Globe
              guess={guess}
              answer={result ? PRACTICE : null}
              locked={!!result}
              onGuess={(point) => !result && setGuess(point)}
            />
            {!guess && (
              <p className="tt-globe-hint">Drag to rotate · click to mark</p>
            )}
            <div className="tt-globe-key">
              <span className="guess-dot" /> guess{" "}
              {result && (
                <>
                  <i className="route-line" /> route{" "}
                  <span className="answer-dot" /> answer
                </>
              )}
            </div>
          </div>
        </div>
        <aside className="tt-time">
          <TimePicker
            year={year}
            bounds={[1800, 2026]}
            answer={result ? PRACTICE.year : null}
            disabled={!!result || !guess}
            onChange={setYear}
          />
          {result ? (
            <div className="tt-result">
              <div className="tt-result-score">
                <span>Practice complete</span>
                <small>not counted</small>
              </div>
              <p>
                <b>{PRACTICE.place}</b> · {yearLabel(PRACTICE.year)}
              </p>
              <div className="tt-result-breakdown">
                <div>
                  <span>Place</span>
                  <b>{Math.round(result.distance).toLocaleString()} km</b>
                  <small>from your pin</small>
                </div>
                <div>
                  <span>Time</span>
                  <b>{Math.round(result.yearError)} years</b>
                  <small>from your date</small>
                </div>
              </div>
              <button onClick={onComplete}>Start today’s expedition</button>
            </div>
          ) : (
            <>
              <button
                className="tt-lock"
                onClick={() =>
                  guess && setResult(scoreGuess({ ...guess, year }, PRACTICE))
                }
                disabled={!guess}
              >
                Lock practice guess
              </button>
              <p className="tt-ready">
                {guess ? "Pin placed. Set the date." : "Place your pin first."}
              </p>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}
