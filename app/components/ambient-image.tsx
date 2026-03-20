"use client";

interface AmbientImageProps {
  src: string;
  alt?: string;
  className?: string;
  /** How far the color bleeds outward (px). Default 24. */
  spread?: number;
  /** Blur radius (px). Default 40. */
  blur?: number;
  /** Opacity of the ambient glow (0-1). Default 0.55. */
  intensity?: number;
}

export default function AmbientImage({
  src,
  alt = "",
  className = "",
  spread = 24,
  blur = 40,
  intensity = 0.55,
}: AmbientImageProps) {
  return (
    <div className="relative">
      {/* Ambient glow — blurred copy behind the image */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          inset: `-${spread}px`,
          width: `calc(100% + ${spread * 2}px)`,
          height: `calc(100% + ${spread * 2}px)`,
          objectFit: "cover",
          filter: `blur(${blur}px) saturate(1.6)`,
          opacity: intensity,
          borderRadius: "inherit",
          zIndex: 0,
        }}
      />
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={`relative z-[1] ${className}`}
      />
    </div>
  );
}
