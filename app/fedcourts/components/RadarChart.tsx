"use client";
import { FC_CATEGORIES, FC_CATEGORY_SHORT, type FCRatings } from "@/lib/fc-types";

const CATS = FC_CATEGORIES;

type Props = {
  ratings: FCRatings;
  size?: number;
  min?: number;
  max?: number;
};

export default function RadarChart({
  ratings,
  size = 360,
  min = 600,
  max = 1500,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = (size / 2) * 0.72;
  const labelR = (size / 2) * 0.92;

  function ringR(value: number) {
    return ((value - min) / (max - min)) * maxR;
  }

  function point(i: number, value: number): [number, number] {
    const angle = (i / CATS.length) * 2 * Math.PI - Math.PI / 2;
    const r = Math.max(0, Math.min(maxR, ringR(value)));
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  }

  function labelPos(i: number): [number, number] {
    const angle = (i / CATS.length) * 2 * Math.PI - Math.PI / 2;
    return [cx + Math.cos(angle) * labelR, cy + Math.sin(angle) * labelR];
  }

  const points = CATS.map((c, i) => point(i, ratings[c] ?? 1000));
  const polyPath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ") + "Z";

  const ringValues = [750, 900, 1050, 1200, 1350];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="auto"
      style={{ maxWidth: size, display: "block" }}
      role="img"
      aria-label="Skill radar chart"
    >
      <defs>
        <radialGradient id="fc-radar-fill" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(245, 158, 11, 0.6)" />
          <stop offset="100%" stopColor="rgba(245, 158, 11, 0.05)" />
        </radialGradient>
        <linearGradient id="fc-radar-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* concentric reference rings */}
      {ringValues.map((rv) => {
        const r = ringR(rv);
        const ringPath =
          CATS.map((_, i) => {
            const a = (i / CATS.length) * 2 * Math.PI - Math.PI / 2;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(" ") + "Z";
        return (
          <path
            key={rv}
            d={ringPath}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={rv === 1050 ? 1.2 : 0.7}
            strokeDasharray={rv === 1050 ? "0" : "2 4"}
          />
        );
      })}

      {/* spokes */}
      {CATS.map((_, i) => {
        const [x, y] = point(i, max);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={0.8}
          />
        );
      })}

      {/* user polygon */}
      <path d={polyPath} fill="url(#fc-radar-fill)" stroke="url(#fc-radar-stroke)" strokeWidth={2} strokeLinejoin="round" />

      {/* points */}
      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={4}
          fill="#f59e0b"
          stroke="#0a0a0f"
          strokeWidth={1.5}
        />
      ))}

      {/* labels */}
      {CATS.map((c, i) => {
        const [lx, ly] = labelPos(i);
        const v = ratings[c] ?? 1000;
        return (
          <g key={c}>
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="600"
              fill="currentColor"
              opacity="0.9"
              fontFamily="Manrope, system-ui"
            >
              {FC_CATEGORY_SHORT[c]}
            </text>
            <text
              x={lx}
              y={ly + 13}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="currentColor"
              opacity="0.5"
              fontFamily="JetBrains Mono, monospace"
            >
              {v}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
