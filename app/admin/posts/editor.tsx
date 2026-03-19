"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface EditorProps {
  initial?: {
    title: string;
    coverImage: string;
    excerpt: string;
    content: string;
    tags: string;
    published: boolean;
  };
  postId?: string;
}

export default function PostEditor({ initial, postId }: EditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState(initial?.content || "");
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploading, setUploading] = useState(false);
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function togglePreview() {
    if (!preview) {
      // Render markdown for preview
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const { html } = await res.json();
        setPreviewHtml(html);
      }
    }
    setPreview(!preview);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      const { url } = await res.json();
      // Insert markdown image at cursor position
      const textarea = textareaRef.current;
      if (textarea) {
        const pos = textarea.selectionStart;
        const before = content.slice(0, pos);
        const after = content.slice(pos);
        const imgMd = `![${file.name}](${url})`;
        setContent(before + imgMd + after);
      }
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      const { url } = await res.json();
      setCoverImage(url);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    const url = postId ? `/api/posts/${postId}` : "/api/posts";
    const method = postId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        coverImage,
        excerpt: form.get("excerpt"),
        content,
        tags: (form.get("tags") as string)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        published: form.get("published") === "on",
      }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <Link
        href="/admin"
        className="text-sm text-text-soft hover:text-text transition-colors mb-8 inline-block"
      >
        &larr; back
      </Link>
      <h1 className="font-serif text-sand text-2xl font-medium mb-8">
        {postId ? "Edit post" : "New post"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          name="title"
          defaultValue={initial?.title}
          placeholder="Title"
          required
          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text font-serif text-lg focus:outline-none focus:border-sand/50 transition-colors"
        />

        {/* Cover image */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="Cover image URL (optional)"
              className="flex-1 px-4 py-3 bg-surface border border-border rounded-lg text-text-soft text-sm font-mono focus:outline-none focus:border-sand/50 transition-colors"
            />
            <label className="px-4 py-3 bg-surface border border-border rounded-lg text-text-soft text-sm font-mono cursor-pointer hover:border-sand/50 transition-colors whitespace-nowrap">
              {uploading ? "..." : "upload"}
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </label>
          </div>
          {coverImage && (
            <img
              src={coverImage}
              alt="Cover preview"
              className="w-full h-32 object-cover rounded-lg"
            />
          )}
        </div>

        <input
          name="excerpt"
          defaultValue={initial?.excerpt}
          placeholder="Short excerpt..."
          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text-soft text-sm focus:outline-none focus:border-sand/50 transition-colors font-serif italic"
        />

        {/* Content editor with preview toggle and image upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={togglePreview}
                className="text-xs font-mono text-text-soft hover:text-sand transition-colors"
              >
                {preview ? "edit" : "preview"}
              </button>
              <label className="text-xs font-mono text-text-soft hover:text-teal transition-colors cursor-pointer">
                {uploading ? "uploading..." : "insert image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-[0.65rem] text-text-soft/50 font-mono">
              markdown
            </span>
          </div>

          {preview ? (
            <div
              className="prose min-h-[400px] p-4 bg-surface border border-border rounded-lg overflow-auto"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write in markdown..."
              rows={20}
              required
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text font-mono text-sm focus:outline-none focus:border-sand/50 transition-colors resize-y leading-relaxed"
            />
          )}
        </div>

        <input
          name="tags"
          defaultValue={initial?.tags}
          placeholder="Tags (comma-separated)"
          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text-soft text-sm font-mono focus:outline-none focus:border-sand/50 transition-colors"
        />
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 text-sm text-text-soft font-mono cursor-pointer">
            <input
              name="published"
              type="checkbox"
              defaultChecked={initial?.published ?? true}
              className="accent-sand"
            />
            publish
          </label>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-sand/15 border border-sand/30 rounded-lg text-sand font-mono text-sm hover:bg-sand/25 transition-colors disabled:opacity-50"
          >
            {saving ? "saving..." : "save"}
          </button>
        </div>
      </form>
    </main>
  );
}
