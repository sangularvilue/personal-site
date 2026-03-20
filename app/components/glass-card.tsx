"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  target?: string;
  rel?: string;
}

function isTouchDevice() {
  return typeof window !== "undefined" && "ontouchstart" in window;
}

export default function GlassCard({
  children,
  className = "",
  href,
  target,
  rel,
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    opacity: 0,
  });
  const [refractionShadow, setRefractionShadow] = useState("none");

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  const handleMove = useCallback(
    (e: React.MouseEvent) => {
      if (isTouch) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (y - 0.5) * -14;
      const rotateY = (x - 0.5) * 14;

      setStyle({
        transform: `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`,
        transition: "transform 120ms ease-out",
      });

      setGlareStyle({
        opacity: 0.18,
        background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.3), transparent 55%)`,
        transition: "opacity 120ms ease-out",
      });

      const offsetX = (x - 0.5) * 6;
      const offsetY = (y - 0.5) * 6;
      setRefractionShadow(
        `${offsetX}px ${offsetY}px 8px -2px rgba(255,80,80,0.18), ${-offsetX}px ${-offsetY}px 8px -2px rgba(80,120,255,0.18)`,
      );
    },
    [isTouch],
  );

  const reset = useCallback(() => {
    setStyle({
      transform: "perspective(500px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 500ms ease-out",
    });
    setGlareStyle({
      opacity: 0,
      transition: "opacity 500ms ease-out",
    });
    setRefractionShadow("none");
  }, []);

  const Tag = href ? "a" : "div";
  const linkProps = href ? { href, target, rel } : {};

  return (
    <Tag
      {...linkProps}
      className={`glass-tilt block ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        className="glass-tilt-inner relative"
        style={{
          ...style,
          boxShadow:
            refractionShadow !== "none"
              ? `inset 0 1px 0 0 rgba(255,255,255,0.12), inset 0 0 20px 0 rgba(140,170,210,0.06), 0 4px 24px -4px rgba(0,0,0,0.3), ${refractionShadow}`
              : undefined,
          transition: style.transition
            ? `${style.transition}, box-shadow 200ms ease-out`
            : "box-shadow 200ms ease-out",
        }}
      >
        {/*
          Refractive glass edge: extends 16px beyond the card on each side
          so backdrop-filter samples the ACTUAL surroundings (not the card
          interior). Masked to a 2px ring at the card boundary. Uses low
          blur so surrounding colors come through clearly — the contrast
          with the heavily frosted card center creates the beveled-edge look.
        */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: "-16px",
            borderRadius: "34px",
            backdropFilter: "blur(3px) saturate(3) brightness(1.6)",
            WebkitBackdropFilter: "blur(3px) saturate(3) brightness(1.6)",
            background: "rgba(255,255,255,0.03)",
            /* Clip to only a 2px ring at the card boundary (16px inward) */
            clipPath: `polygon(
              0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
              16px 16px, 16px calc(100% - 16px), calc(100% - 16px) calc(100% - 16px), calc(100% - 16px) 16px, 16px 16px
            )`,
          }}
        />
        {/* Glare overlay */}
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-10"
          style={glareStyle}
        />
        <div className="relative z-[1]">{children}</div>
      </div>
    </Tag>
  );
}
