"use client";

import { useEffect, useMemo, useState } from "react";
import { MAX_ROUND_POINTS, type HistoryRun, type RoundRecord } from "../game";

type Insight = { label: string; average: number; count: number };

function periodFor(year: number) {
  if (year < -500) return "Before 500 BC";
  if (year < 500) return "500 BC–500 AD";
  if (year < 1500) return "500–1500";
  if (year < 1800) return "1500–1800";
  if (year < 1946) return "1800–1945";
  return "1946–present";
}

function regionFor({ lat, lon }: { lat: number; lon: number }) {
  if (lat < -55) return "Antarctica";
  if (lat > 66) return "The Arctic";
  if (lon >= -12 && lon <= 45 && lat >= 34 && lat <= 72)
    return "Europe & Mediterranean";
  if (lon >= -170 && lon < -50 && lat >= 7 && lat <= 66) return "North America";
  if (lon >= -120 && lon < -30 && lat >= -56 && lat < 34)
    return "Latin America";
  if (lon >= -20 && lon <= 65 && lat >= 12 && lat < 42)
    return "West Asia & North Africa";
  if (lon >= -20 && lon <= 55 && lat >= -35 && lat < 15)
    return "Sub-Saharan Africa";
  if (lon > 65 && lon < 92 && lat >= 5 && lat <= 36) return "South Asia";
  if (lon >= 92 && lon <= 150 && lat >= 18 && lat <= 55) return "East Asia";
  if (lon >= 92 && lon <= 150 && lat >= -12 && lat < 18)
    return "Southeast Asia";
  if (lon >= 110 && lon <= 180 && lat < -10) return "Oceania";
  return "Open water & borderlands";
}

function summarize(
  rounds: RoundRecord[],
  labelFor: (round: RoundRecord) => string,
  scoreFor: (round: RoundRecord) => number = (round) => round.points,
) {
  const byLabel = new Map<string, { total: number; count: number }>();
  for (const round of rounds) {
    const label = labelFor(round);
    const current = byLabel.get(label) || { total: 0, count: 0 };
    current.total += scoreFor(round);
    current.count += 1;
    byLabel.set(label, current);
  }
  return [...byLabel].map(([label, value]) => ({
    label,
    count: value.count,
    average: value.total / value.count,
  }));
}

function InsightList({
  title,
  note,
  insights,
  locationOnly = false,
}: {
  title: string;
  note: string;
  insights: Insight[];
  locationOnly?: boolean;
}) {
  const ordered = [...insights].sort((a, b) => b.average - a.average);
  const groupSize = Math.min(3, Math.max(1, Math.floor(ordered.length / 2)));
  const strongest = ordered.slice(0, groupSize);
  const weakest = ordered.slice(-groupSize).reverse();
  const hasSignal = insights.some((insight) => insight.count > 1);
  const hasComparison = ordered.length > 1;
  const scoreLabel = (insight: Insight) =>
    locationOnly
      ? `${Math.round(insight.average)} place pts`
      : `${Math.round(insight.average)} / 500`;

  return (
    <section className="tt-history-lens">
      <div className="tt-history-lens-head">
        <h2>{title}</h2>
        <p>{note}</p>
      </div>
      {!hasSignal && (
        <p className="tt-history-provisional">
          Early read — this will sharpen as you play more verified days.
        </p>
      )}
      <div className="tt-history-directions">
        <div>
          <h3>Usually solid</h3>
          {strongest.map((insight) => (
            <p key={insight.label}>
              <b>{insight.label}</b>
              <span>
                {scoreLabel(insight)} · {insight.count} answer
                {insight.count === 1 ? "" : "s"}
              </span>
            </p>
          ))}
        </div>
        {hasComparison && (
          <div>
            <h3>Worth revisiting</h3>
            {weakest.map((insight) => (
              <p key={insight.label}>
                <b>{insight.label}</b>
                <span>
                  {scoreLabel(insight)} · {insight.count} answer
                  {insight.count === 1 ? "" : "s"}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ScoreTrend({ runs }: { runs: HistoryRun[] }) {
  const recent = runs.slice(-30);
  const latest = recent.at(-1);
  return (
    <section className="tt-history-trend">
      <div className="tt-history-trend-head">
        <div>
          <h2>Score over time</h2>
          <p>One bar per verified expedition.</p>
        </div>
        {latest && <strong>{latest.score.toLocaleString()} / 3,000</strong>}
      </div>
      <div className="tt-history-trend-bars" aria-label="Score over time">
        {recent.map((run) => (
          <span
            key={run.date}
            title={`${run.date}: ${run.score} / 3,000`}
            style={{ height: `${Math.max(8, (run.score / 3000) * 100)}%` }}
          />
        ))}
      </div>
    </section>
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
    return {
      ordered,
      periods: summarize(rounds, (round) => periodFor(round.answer.year)),
      fields: summarize(rounds, (round) => round.field),
      regions: summarize(
        rounds,
        (round) => regionFor(round.answer),
        (round) => MAX_ROUND_POINTS - round.spaceLoss,
      ),
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
            <h1>Three ways your memory has a shape.</h1>
            <span>
              {summary.ordered.length} verified{" "}
              {summary.ordered.length === 1 ? "day" : "days"} recorded in this
              browser.
            </span>
          </div>
          <div className="tt-history-lenses">
            <InsightList
              title="Time periods"
              note="How accurately you place events in time."
              insights={summary.periods}
            />
            <InsightList
              title="Categories"
              note="Which kinds of history come most naturally."
              insights={summary.fields}
            />
            <InsightList
              title="Locations"
              note="Map accuracy only; dates do not affect this read."
              insights={summary.regions}
              locationOnly
            />
          </div>
          <ScoreTrend runs={summary.ordered} />
        </section>
      )}
    </main>
  );
}
