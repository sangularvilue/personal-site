"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import AmbientImage from "./ambient-image";
import ReadingProgress from "./reading-progress";

interface PostReaderProps {
  title: string;
  slug: string;
  date: string;
  tags: string[];
  coverImage: string;
  html: string;
  readTime: string;
  onClose: () => void;
}

export default function PostReader({
  title,
  slug,
  date,
  tags,
  coverImage,
  html,
  readTime,
  onClose,
}: PostReaderProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9990] flex justify-center overflow-y-auto bg-bg/80 backdrop-blur-sm animate-reader-in"
    >
      <ReadingProgress />
      <div className="w-full max-w-[720px] px-[clamp(1.5rem,5vw,4rem)] py-12 animate-reader-content-in">
        {/* Close / full page link */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onClose}
            className="text-sm text-text-soft hover:text-text transition-colors"
          >
            &larr; back to arts
          </button>
          <Link
            href={`/arts/${slug}`}
            className="text-xs text-text-soft/50 hover:text-text-soft transition-colors font-mono"
          >
            open full page &rarr;
          </Link>
        </div>

        <article>
          {coverImage && (
            <div className="mb-8 -mx-4 sm:-mx-8 overflow-hidden rounded-2xl">
              <AmbientImage
                src={coverImage}
                alt={title}
                className="w-full rounded-2xl object-cover max-h-[400px] shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
                spread={32}
                blur={48}
                intensity={0.6}
              />
            </div>
          )}

          <header className="mb-8 pb-6 border-b border-glass-border">
            <div className="flex items-center justify-between">
              <span className="text-[0.72rem] uppercase tracking-widest text-sand-dim font-semibold">
                {date}
              </span>
              <span className="text-[0.65rem] text-text-soft/50 font-mono">
                {readTime}
              </span>
            </div>
            <h1 className="font-serif text-sand text-[clamp(1.8rem,4vw,2.5rem)] font-medium mt-2 mb-3">
              {title}
            </h1>
            {tags.length > 0 && (
              <div className="flex gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full border border-glass-border text-text-soft backdrop-blur-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </div>
    </div>
  );
}
