"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PostEditor from "../editor";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  published: boolean;
}

export default function EditPost() {
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((r) => r.json())
      .then(setPost);
  }, [id]);

  if (!post) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-text-soft font-mono text-sm">loading...</span>
      </main>
    );
  }

  return (
    <PostEditor
      postId={id}
      initial={{
        title: post.title,
        coverImage: post.coverImage || "",
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags.join(", "),
        published: post.published,
      }}
    />
  );
}
