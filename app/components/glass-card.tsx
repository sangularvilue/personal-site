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
  const [glintStyle, setGlintStyle] = useState<React.CSSProperties>({
    opacity: 0,
  });

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
      const rotateX = (y - 0.5) * -6;
      const rotateY = (x - 0.5) * 6;

      setStyle({
        transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`,
        transition: "transform 300ms ease-out",
      });

      setGlareStyle({
        opacity: 0.12,
        background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.2), transparent 60%)`,
        transition: "opacity 300ms ease-out",
      });

      // Border glint — bright spot that follows the cursor along the edge.
      // Uses a conic-gradient so the glint sits on the border nearest the cursor,
      // with a tight falloff so it reads as a small specular highlight.
      const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI);
      setGlintStyle({
        opacity: 1,
        background: `conic-gradient(from ${angle + 180}deg at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.35) 0deg, transparent 40deg, transparent 320deg, rgba(255,255,255,0.35) 360deg)`,
        transition: "opacity 150ms ease-out",
      });
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
    setGlintStyle({
      opacity: 0,
      transition: "opacity 500ms ease-out",
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
        onMouseLeave={reset}
        className="glass-tilt-inner relative"
        style={style}
      >
        {/* Border glint — specular highlight on the edge nearest the cursor */}
        <div
          className="absolute -inset-[1px] rounded-[19px] pointer-events-none"
          style={{
            opacity: 0,
            padding: "1.5px",
            maskImage:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskImage:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            ...glintStyle,
          }}
        />
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
