"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

/*
 * Shared overlay where all glass-card refractive borders are rendered.
 * Because this layer paints after all cards, each border's backdrop-filter
 * captures sibling cards — not just the page background.
 *
 * Uses ResizeObserver + scroll/resize listeners for positioning.
 * Renders a soft, rounded ring around each card via mask-composite.
 */

interface CardEntry {
  el: HTMLElement;
}

interface EdgeRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// ── Store (singleton, outside React) ──

const cards = new Map<string, CardEntry>();
let snapshot: Map<string, EdgeRect> = new Map();
let listeners: Array<() => void> = [];

function emit() {
  const next = new Map<string, EdgeRect>();
  cards.forEach(({ el }, id) => {
    const r = el.getBoundingClientRect();
    next.set(id, { top: r.top, left: r.left, width: r.width, height: r.height });
  });
  snapshot = next;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function getSnapshot() {
  return snapshot;
}

// ── Context ──

interface GlassEdgeContextValue {
  register: (id: string, el: HTMLElement) => () => void;
}

const Ctx = createContext<GlassEdgeContextValue | null>(null);
export const useGlassEdge = () => useContext(Ctx);

// ── Provider ──

const SPREAD = 14; // how far the glow extends beyond card edges
const RING = 18; // inner padding that gets masked out (matches card radius)
const BORDER_RADIUS = 18 + SPREAD;

export function GlassEdgeProvider({ children }: { children: React.ReactNode }) {
  const observerRef = useRef<ResizeObserver | null>(null);

  // Batched RAF sync
  const rafRef = useRef(0);
  const scheduleSync = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(emit);
  }, []);

  const register = useCallback(
    (id: string, el: HTMLElement) => {
      cards.set(id, { el });
      if (!observerRef.current) {
        observerRef.current = new ResizeObserver(() => scheduleSync());
      }
      observerRef.current.observe(el);
      scheduleSync();
      return () => {
        observerRef.current?.unobserve(el);
        cards.delete(id);
        scheduleSync();
      };
    },
    [scheduleSync],
  );

  // Scroll + resize listeners
  useEffect(() => {
    const sync = () => scheduleSync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [scheduleSync]);

  const edges = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return (
    <Ctx.Provider value={{ register }}>
      {children}
      {/* Overlay — paints after all cards */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 50 }}
        aria-hidden
      >
        {Array.from(edges.entries()).map(([id, rect]) => (
          <div
            key={id}
            style={{
              position: "absolute",
              top: rect.top - SPREAD,
              left: rect.left - SPREAD,
              width: rect.width + SPREAD * 2,
              height: rect.height + SPREAD * 2,
              borderRadius: BORDER_RADIUS,
              backdropFilter: "blur(3px) saturate(2) brightness(1.35)",
              WebkitBackdropFilter: "blur(3px) saturate(2) brightness(1.35)",
              // Mask out the center so only the outer ring is visible
              padding: RING,
              maskImage:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMaskImage:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </Ctx.Provider>
  );
}
