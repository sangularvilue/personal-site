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
  const [borderStyle, setBorderStyle] = useState<React.CSSProperties>({});
  const [refractionStyle, setRefractionStyle] = useState<React.CSSProperties>(
    {},
  );

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -16;
    const rotateY = (x - 0.5) * 16;

    setStyle({
      transform: `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`,
      transition: "transform 120ms ease-out",
    });

    // Glare follows cursor
    setGlareStyle({
      opacity: 0.18,
      background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.3), transparent 55%)`,
      transition: "opacity 120ms ease-out",
    });

    // Prismatic border — angle follows cursor position
    const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + 180;
    setBorderStyle({
      opacity: 1,
      background: `conic-gradient(from ${angle}deg, rgba(255,120,120,0.5), rgba(255,200,100,0.4), rgba(120,255,180,0.5), rgba(100,180,255,0.5), rgba(180,120,255,0.5), rgba(255,120,200,0.4), rgba(255,120,120,0.5))`,
      transition: "opacity 200ms ease-out",
    });

    // Chromatic refraction — offset RGB shadows based on tilt
    const offsetX = (x - 0.5) * 6;
    const offsetY = (y - 0.5) * 6;
    setRefractionStyle({
      opacity: 0.6,
      boxShadow: `${offsetX}px ${offsetY}px 8px -2px rgba(255,80,80,0.2), ${-offsetX}px ${-offsetY}px 8px -2px rgba(80,120,255,0.2)`,
      transition: "all 120ms ease-out",
    });
  }, []);

  const handleLeave = useCallback(() => {
    setStyle({
      transform: "perspective(500px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 500ms ease-out",
    });
    setGlareStyle({
      opacity: 0,
      transition: "opacity 500ms ease-out",
    });
    setBorderStyle({
      opacity: 0,
      transition: "opacity 500ms ease-out",
    });
    setRefractionStyle({
      opacity: 0,
      boxShadow: "none",
      transition: "all 500ms ease-out",
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
        style={{ ...style, ...refractionStyle }}
      >
        {/* Prismatic border layer */}
        <div
          className="absolute -inset-[1px] rounded-[19px] pointer-events-none z-0"
          style={{
            opacity: 0,
            maskImage:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskImage:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            padding: "1.5px",
            ...borderStyle,
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
