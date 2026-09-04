"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Maps a year to a 0..1 position on the track.
 *
 * On a wide range (−4000..2026) a purely linear track buries the modern era:
 * the last two centuries, where most of the question bank lives, would occupy
 * about 3% of the width. So we blend the linear scale with a log scale on
 * "years before the end of the range", which expands recent time.
 *
 * The blend strength scales with the width of the range, so a question already
 * calibrated to a narrow modern window (baseball, 1840..2026) gets an honest
 * linear track and no surprises.
 */
export function trackScale(lo: number, hi: number) {
  const span = Math.max(1, hi - lo);
  const warp = Math.min(1, Math.max(0, (span - 300) / 5726)) * 0.5;
  const logMax = Math.log(span + 1);
  const toPos = (year: number) => {
    const linear = (year - lo) / span;
    if (warp === 0) return linear;
    const logged = 1 - Math.log(Math.max(1, hi - year + 1)) / logMax;
    return (1 - warp) * linear + warp * logged;
  };
  const toYear = (pos: number) => {
    if (warp === 0) return lo + pos * span;
    let a = lo,
      b = hi;
    for (let i = 0; i < 44; i++) {
      const mid = (a + b) / 2;
      if (toPos(mid) < pos) a = mid;
      else b = mid;
    }
    return (a + b) / 2;
  };
  return { toPos, toYear, span };
}

export function yearLabel(year: number) {
  const y = Math.round(year);
  return y < 0 ? `${Math.abs(y)} BC` : `${y} AD`;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** Step magnitudes offered for the +/− chips, scaled to the range. */
function stepsFor(span: number) {
  const steps = [1, 10, 100, 1000].filter((m) => m <= span / 6);
  if (!steps.length) steps.push(1);
  return steps.reverse();
}

/** Evenly spaced labelled ticks, rounded to readable years. */
function ticksFor(
  scale: ReturnType<typeof trackScale>,
  lo: number,
  hi: number,
) {
  const round =
    scale.span > 2000
      ? 500
      : scale.span > 600
        ? 100
        : scale.span > 120
          ? 10
          : 1;
  const out: { year: number; pos: number }[] = [];
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const raw = scale.toYear(p);
    const year = clamp(Math.round(raw / round) * round, lo, hi);
    if (!out.some((t) => t.year === year))
      out.push({ year, pos: scale.toPos(year) });
  }
  return out;
}

export default function TimePicker({
  year,
  bounds,
  answer,
  disabled,
  onChange,
}: {
  year: number;
  bounds: [number, number];
  answer: number | null;
  disabled: boolean;
  onChange: (year: number) => void;
}) {
  const [lo, hi] = bounds;
  const scale = useMemo(() => trackScale(lo, hi), [lo, hi]);
  const steps = useMemo(() => stepsFor(scale.span), [scale.span]);
  const ticks = useMemo(() => ticksFor(scale, lo, hi), [scale, lo, hi]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const set = useCallback(
    (next: number) => onChange(clamp(Math.round(next), lo, hi)),
    [onChange, lo, hi],
  );

  // Pointer position -> year. The domain is the whole range and never moves,
  // so the handle stays exactly where the pointer puts it.
  const fromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pos = clamp((clientX - rect.left) / rect.width, 0, 1);
      set(scale.toYear(pos));
    },
    [scale, set],
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => fromClientX(e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging, fromClientX]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const big = steps[0] ?? 10;
    const map: Record<string, number> = {
      ArrowLeft: -1,
      ArrowDown: -1,
      ArrowRight: 1,
      ArrowUp: 1,
      PageDown: -big,
      PageUp: big,
    };
    if (e.key in map) {
      e.preventDefault();
      set(year + map[e.key]);
    } else if (e.key === "Home") {
      e.preventDefault();
      set(lo);
    } else if (e.key === "End") {
      e.preventDefault();
      set(hi);
    }
  };

  const commitDraft = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    setDraft(null);
    if (!digits) return;
    const magnitude = Number(digits);
    if (!Number.isFinite(magnitude)) return;
    set(year < 0 ? -magnitude : magnitude);
  };

  const canBC = lo < 0;
  const era = year < 0 ? "BC" : "AD";
  const pos = scale.toPos(year);
  const answerPos = answer === null ? null : scale.toPos(clamp(answer, lo, hi));

  return (
    <div className="tt-picker">
      <div className="tt-year">
        <label htmlFor="tt-year-input">Your year</label>
        <div className="tt-year-entry">
          <input
            id="tt-year-input"
            inputMode="numeric"
            autoComplete="off"
            value={draft ?? String(Math.abs(Math.round(year)))}
            disabled={disabled}
            onChange={(e) =>
              setDraft(e.target.value.replace(/[^\d]/g, "").slice(0, 4))
            }
            onBlur={(e) => commitDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            aria-label="Year"
          />
          <button
            type="button"
            className="tt-era"
            disabled={disabled || !canBC}
            aria-pressed={era === "BC"}
            aria-label={`Switch to ${era === "BC" ? "AD" : "BC"}`}
            onClick={() => set(-year || lo)}
            title={
              canBC ? "Switch between BC and AD" : "This question is AD only"
            }
          >
            {era}
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className={`tt-track ${dragging ? "is-dragging" : ""}`}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuemin={lo}
        aria-valuemax={hi}
        aria-valuenow={Math.round(year)}
        aria-valuetext={yearLabel(year)}
        aria-label="Choose a year"
        aria-disabled={disabled}
        onKeyDown={disabled ? undefined : onKeyDown}
        onPointerDown={(e) => {
          if (disabled) return;
          e.preventDefault();
          e.currentTarget.focus();
          setDragging(true);
          fromClientX(e.clientX);
        }}
      >
        <div className="tt-track-rail">
          <div className="tt-track-fill" style={{ width: `${pos * 100}%` }} />
          {answerPos !== null && (
            <i
              className="tt-track-answer"
              style={{ left: `${answerPos * 100}%` }}
              aria-hidden="true"
            />
          )}
          <i
            className="tt-track-handle"
            style={{ left: `${pos * 100}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="tt-track-ticks" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t.year} style={{ left: `${t.pos * 100}%` }}>
              {yearLabel(t.year).replace(" AD", "")}
            </span>
          ))}
        </div>
      </div>

      <div className="tt-steps">
        {[...steps].reverse().map((s) => (
          <button
            key={`m${s}`}
            type="button"
            disabled={disabled || year <= lo}
            onClick={() => set(year - s)}
          >
            −{s}
          </button>
        ))}
        {steps.map((s) => (
          <button
            key={`p${s}`}
            type="button"
            disabled={disabled || year >= hi}
            onClick={() => set(year + s)}
          >
            +{s}
          </button>
        ))}
      </div>

      <p className="tt-note">
        Drag the track, type the year, or nudge it. Range for this question:{" "}
        <b>
          {yearLabel(lo)} – {yearLabel(hi)}
        </b>
        .
      </p>
    </div>
  );
}
