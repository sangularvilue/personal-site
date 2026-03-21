"use client";

import { useState, useCallback } from "react";
import PostReader from "./post-reader";

interface ExpandableTileProps {
  children: React.ReactNode;
  title: string;
  slug: string;
  date: string;
  tags: string[];
  coverImage: string;
  html: string;
  readTime: string;
}

export default function ExpandableTile({
  children,
  title,
  slug,
  date,
  tags,
  coverImage,
  html,
  readTime,
}: ExpandableTileProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>
      {open && (
        <PostReader
          title={title}
          slug={slug}
          date={date}
          tags={tags}
          coverImage={coverImage}
          html={html}
          readTime={readTime}
          onClose={close}
        />
      )}
    </>
  );
}
