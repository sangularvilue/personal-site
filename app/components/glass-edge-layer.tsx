"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createPortal } from "react-dom";

/*
 * GlassEdgeLayer: a shared overlay where all glass-card refractive borders
 * are rendered. Because this layer sits above all cards in the DOM, each
 * border's backdrop-filter captures sibling cards too — not just the
 * page background.
 */

interface EdgeEntry {
  id: string;
  rect: DOMRect;
}

interface GlassEdgeContextValue {
  containerRef: React.RefObject<HTMLDivElement | null>;
  register: (id: string, el: HTMLElement) => void;
  unregister: (id: string) => void;
}

const GlassEdgeContext = createContext<GlassEdgeContextValue | null>(null);

export function useGlassEdge() {
  return useContext(GlassEdgeContext);
}

export function GlassEdgeProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const [edges, setEdges] = useState<EdgeEntry[]>([]);

  const sync = useCallback(() => {
    const entries: EdgeEntry[] = [];
    elementsRef.current.forEach((el, id) => {
      entries.push({ id, rect: el.getBoundingClientRect() });
    });
    setEdges(entries);
  }, []);

  const register = useCallback(
    (id: string, el: HTMLElement) => {
      elementsRef.current.set(id, el);
      sync();
    },
    [sync],
  );

  const unregister = useCallback(
    (id: string) => {
      elementsRef.current.delete(id);
      sync();
    },
    [sync],
  );

  // Re-sync on scroll / resize
  useEffect(() => {
    const onUpdate = () => sync();
    window.addEventListener("scroll", onUpdate, { passive: true });
    window.addEventListener("resize", onUpdate, { passive: true });
    const interval = setInterval(onUpdate, 200); // catch layout shifts
    return () => {
      window.removeEventListener("scroll", onUpdate);
      window.removeEventListener("resize", onUpdate);
      clearInterval(interval);
    };
  }, [sync]);

  return (
    <GlassEdgeContext.Provider value={{ containerRef, register, unregister }}>
      {children}
      {/* The overlay layer — renders above all cards */}
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 50 }}
      >
        {edges.map(({ id, rect }) => (
          <div
            key={id}
            style={{
              position: "absolute",
              top: rect.top - 16,
              left: rect.left - 16,
              width: rect.width + 32,
              height: rect.height + 32,
              borderRadius: 34,
              backdropFilter: "blur(2px) saturate(3) brightness(1.5)",
              WebkitBackdropFilter: "blur(2px) saturate(3) brightness(1.5)",
              background: "rgba(255,255,255,0.02)",
              clipPath: `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                16px 16px, 16px calc(100% - 16px), calc(100% - 16px) calc(100% - 16px), calc(100% - 16px) 16px, 16px 16px
              )`,
            }}
          />
        ))}
      </div>
    </GlassEdgeContext.Provider>
  );
}
