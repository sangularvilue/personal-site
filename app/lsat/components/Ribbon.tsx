import type { CSSProperties } from "react";

type Variant = "correct" | "wrong" | "neutral";

const FILL: Record<Variant, string> = {
  correct: "#9c2c2c",
  wrong: "#7a5a3a",
  neutral: "#a07d2a",
};
const FILL_DEEP: Record<Variant, string> = {
  correct: "#6e1b1b",
  wrong: "#4a3f30",
  neutral: "#7a5a18",
};

type Props = {
  variant: Variant;
  height?: number;
  width?: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
};

// A swallow-tailed bookmark ribbon. Used as the signature marker that
// drops from the top of the question card after every answer, and (in
// miniature) for the ribbon stack on the profile page.
export default function Ribbon({
  variant,
  height = 88,
  width = 36,
  className,
  style,
  ariaLabel,
}: Props) {
  return (
    <svg
      viewBox="0 0 36 88"
      width={width}
      height={height}
      className={className}
      style={style}
      role={ariaLabel ? "img" : "presentation"}
      aria-label={ariaLabel}
    >
      {/* Ribbon body */}
      <path
        d="M 2 0 L 34 0 L 34 74 L 18 60 L 2 74 Z"
        fill={FILL[variant]}
      />
      {/* Inner fold for depth */}
      <path
        d="M 2 0 L 5 0 L 5 70 L 2 74 Z"
        fill={FILL_DEEP[variant]}
        opacity="0.55"
      />
      {/* Highlight stripe */}
      <path
        d="M 8 0 L 9 0 L 9 64 L 8 66 Z"
        fill="rgba(255,255,255,0.18)"
      />
      {/* Stitched top edge */}
      <line
        x1="2"
        y1="6"
        x2="34"
        y2="6"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.5"
        strokeDasharray="2 2"
      />
    </svg>
  );
}
