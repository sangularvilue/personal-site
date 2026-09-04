"use client";

import { useEffect, useMemo, useState } from "react";
import type { HistoryRun, RoundRecord } from "../game";

type FieldStat = { field: string; points: number; count: number };

function average(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function ErrorMap({ rounds }: { rounds: RoundRecord[] }) {
  const point = (lat: number, lon: number) => ({
    x: ((lon + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100,
  });
  return (
    <div
      className="tt-history-map"
      aria-label="Map of your recent location guesses and answers"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {rounds.map((round, index) => {
          const guess = point(round.guess.lat, round.guess.lon),
            answer = point(round.answer.lat, round.answer.lon);
          return (
            <g key={`${round.title}-${index}`}>
              <line x1={guess.x} y1={guess.y} x2={answer.x} y2={answer.y} />
              <circle
                className="tt-history-answer"
                cx={answer.x}
                cy={answer.y}
                r="0.95"
              />
              <circle
                className="tt-history-guess"
                cx={guess.x}
                cy={guess.y}
                r="0.75"
              />
            </g>
          );
        })}
      </svg>
      <p>
        <i className="tt-history-guess" /> your guess{" "}
        <i className="tt-history-answer" /> answer
      </p>
    </div>
  );
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<HistoryRun[] | null>(null);
  useEffect(() => {
    fetch("/api/thenthere/history")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => setRuns(data.runs))
      .catch(() => setRuns([]));
  }, []);

  const summary = useMemo(() => {
    const ordered = [...(runs || [])].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const rounds = ordered.flatMap((run) => run.rounds);
    const fields = new Map<string, FieldStat>();
    for (const round of rounds) {
      const current = fields.get(round.field) || {
        field: round.field,
        points: 0,
        count: 0,
      };
      current.points += round.points;
      current.count += 1;
      fields.set(round.field, current);
    }
    const fieldStats = [...fields.values()]
      .map((field) => ({ ...field, average: field.points / field.count }))
      .sort((a, b) => b.average - a.average);
    return {
      ordered,
      rounds,
      averageScore: average(ordered.map((run) => run.score)),
      averageDistance: average(rounds.map((round) => round.distance)),
      dateBias: average(
        rounds.map((round) => round.guess.year - round.answer.year),
      ),
      fieldStats,
    };
  }, [runs]);

  return (
    <main className="tt-shell tt-history-page">
      <header className="tt-top">
        <div className="tt-brand">
          <a href="/thenthere" className="tt-mark">
            <span>then</span>
            <i>/</i>
            <span>there</span>
          </a>
          <span className="tt-history-link">field notes</span>
        </div>
        <div />
        <a className="tt-score tt-history-back" href="/thenthere">
          Today’s game
        </a>
      </header>
      {runs === null ? (
        <section className="tt-history-empty">
          <p>Opening your field notes…</p>
        </section>
      ) : !runs.length ? (
        <section className="tt-history-empty">
          <p>Field notes begin after your first verified expedition.</p>
          <a href="/thenthere">Play today’s game</a>
        </section>
      ) : (
        <section className="tt-history-content">
          <div className="tt-history-intro">
            <p>Your field notes</p>
            <h1>How history looks from where you stand.</h1>
            <span>
              {summary.ordered.length} verified{" "}
              {summary.ordered.length === 1 ? "day" : "days"} recorded in this
              browser.
            </span>
          </div>
          <div className="tt-history-stats">
            <div>
              <span>Average expedition</span>
              <strong>
                {Math.round(summary.averageScore).toLocaleString()}
              </strong>
              <small>out of 3,000</small>
            </div>
            <div>
              <span>Average map miss</span>
              <strong>
                {Math.round(summary.averageDistance).toLocaleString()} km
              </strong>
              <small>across all answered events</small>
            </div>
            <div>
              <span>Chronological instinct</span>
              <strong>
                {Math.abs(Math.round(summary.dateBias))} years{" "}
                {summary.dateBias >= 0 ? "late" : "early"}
              </strong>
              <small>on average</small>
            </div>
          </div>
          <div className="tt-history-grid">
            <section>
              <h2>Where you miss</h2>
              <ErrorMap rounds={summary.rounds.slice(-72)} />
            </section>
            <section className="tt-history-fields">
              <h2>Strongest fields</h2>
              {summary.fieldStats.slice(0, 5).map((field) => (
                <div key={field.field}>
                  <span>{field.field}</span>
                  <i>
                    <b
                      style={{
                        width: `${Math.max(4, (field.average / 500) * 100)}%`,
                      }}
                    />
                  </i>
                  <strong>{Math.round(field.average)}</strong>
                </div>
              ))}
              {summary.fieldStats.length < 2 && (
                <p>Play more days to uncover a pattern.</p>
              )}
            </section>
          </div>
          <section className="tt-history-trend">
            <h2>Expeditions</h2>
            <div>
              {summary.ordered.slice(-30).map((run) => (
                <span
                  key={run.date}
                  title={`${run.date}: ${run.score} / 3,000`}
                  style={{
                    height: `${Math.max(8, (run.score / 3000) * 100)}%`,
                  }}
                />
              ))}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}
