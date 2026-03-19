"use client";

import { useRef, useState, useCallback } from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  target?: string;
  rel?: string;
}

export default function GlassCard({
  children,
  className = "",
  href,
  target,
  rel,
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    opacity: 0,
  });

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0-1
    const y = (e.clientY - rect.top) / rect.height; // 0-1
    const rotateX = (y - 0.5) * -8; // degrees
    const rotateY = (x - 0.5) * 8;

    setStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
      transition: "transform 150ms ease-out",
    });

    // Glare follows cursor
    setGlareStyle({
      opacity: 0.12,
      background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.25), transparent 60%)`,
      transition: "opacity 150ms ease-out",
    });
  }, []);

  const handleLeave = useCallback(() => {
    setStyle({
      transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 400ms ease-out",
    });
    setGlareStyle({
      opacity: 0,
      transition: "opacity 400ms ease-out",
    });
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
        onMouseLeave={handleLeave}
        className="glass-tilt-inner relative"
        style={style}
      >
        {/* Glare overlay */}
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-10"
          style={glareStyle}
        />
        {children}
      </div>
    </Tag>
  );
}
