"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

async function uploadFile(file: File): Promise<string> {
  // Step 1: Get the blob token from our authenticated API
  const tokenRes = await fetch("/api/upload", { method: "POST" });
  if (!tokenRes.ok) {
    const data = await tokenRes.json().catch(() => ({}));
    throw new Error(data.error || "Auth failed");
  }
  const { token } = await tokenRes.json();

  // Step 2: Upload directly to Vercel Blob (bypasses serverless payload limit)
  const blobRes = await fetch(
    `https://blob.vercel-storage.com/${encodeURIComponent(file.name)}`,
    {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "x-content-type": file.type,
        "x-api-version": "7",
      },
      body: file,
    }
  );

  if (!blobRes.ok) {
    const text = await blobRes.text().catch(() => blobRes.statusText);
    throw new Error(`Blob upload failed: ${text}`);
  }

  const blob = await blobRes.json();
  return blob.url;
}

interface UploadedImage {
  url: string;
  name: string;
}

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
  const [uploadError, setUploadError] = useState("");
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [imageTray, setImageTray] = useState<UploadedImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function togglePreview() {
    if (!preview) {
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

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");

    try {
      const url = await uploadFile(file);
      const textarea = textareaRef.current;
      if (textarea) {
        const pos = textarea.selectionStart;
        const before = content.slice(0, pos);
        const after = content.slice(pos);
        const imgMd = `![${file.name}](${url})`;
        setContent(before + imgMd + after);
      }
    } catch (err: unknown) {
      setUploadError(`Upload failed: ${err instanceof Error ? err.message : "unknown error"}`);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleTrayUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setUploadError("");

    try {
      for (const file of Array.from(files)) {
        const url = await uploadFile(file);
        setImageTray((prev) => [...prev, { url, name: file.name }]);
      }
    } catch (err: unknown) {
      setUploadError(`Upload failed: ${err instanceof Error ? err.message : "unknown error"}`);
    }
    setUploading(false);
    e.target.value = "";
  }

  function insertAsAside(img: UploadedImage) {
    const textarea = textareaRef.current;
    const pos = textarea ? textarea.selectionStart : content.length;
    const before = content.slice(0, pos);
    const after = content.slice(pos);
    const asideMd = `:::aside 300\n![${img.name}](${img.url})\n:::\n`;
    setContent(before + asideMd + after);
    // Focus back on textarea
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPos = pos + asideMd.length;
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }

  function insertInline(img: UploadedImage) {
    const textarea = textareaRef.current;
    const pos = textarea ? textarea.selectionStart : content.length;
    const before = content.slice(0, pos);
    const after = content.slice(pos);
    const imgMd = `![${img.name}](${img.url})`;
    setContent(before + imgMd + after);
  }

  function removeTrayImage(url: string) {
    setImageTray((prev) => prev.filter((img) => img.url !== url));
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");

    try {
      const url = await uploadFile(file);
      setCoverImage(url);
    } catch (err: unknown) {
      setUploadError(`Upload failed: ${err instanceof Error ? err.message : "unknown error"}`);
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
          className="w-full px-4 py-3 glass-input rounded-xl text-text font-serif text-lg focus:outline-none focus:border-sand/30 transition-all"
        />

        {/* Cover image */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="Cover image URL (optional)"
              className="flex-1 px-4 py-3 glass-input rounded-xl text-text-soft text-sm font-mono focus:outline-none focus:border-sand/30 transition-all"
            />
            <label className="px-4 py-3 glass-input rounded-xl text-text-soft text-sm font-mono cursor-pointer hover:border-sand/50 transition-colors whitespace-nowrap">
              {uploading ? "..." : "upload"}
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </label>
          </div>
          {uploadError && (
            <p className="text-red-400 text-xs font-mono">{uploadError}</p>
          )}
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
          className="w-full px-4 py-3 glass-input rounded-xl text-text-soft text-sm focus:outline-none focus:border-sand/30 transition-all font-serif italic"
        />

        {/* Image tray */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-text-soft">image tray</span>
            <label className="text-xs font-mono text-text-soft hover:text-teal transition-colors cursor-pointer">
              {uploading ? "uploading..." : "+ upload images"}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleTrayUpload}
                className="hidden"
              />
            </label>
          </div>
          {imageTray.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {imageTray.map((img) => (
                <div
                  key={img.url}
                  className="group relative glass-subtle p-1.5 rounded-lg"
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="absolute inset-0 rounded-lg bg-bg/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertAsAside(img)}
                      className="text-[0.6rem] font-mono text-sand hover:text-text transition-colors"
                    >
                      aside
                    </button>
                    <button
                      type="button"
                      onClick={() => insertInline(img)}
                      className="text-[0.6rem] font-mono text-teal hover:text-text transition-colors"
                    >
                      inline
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTrayImage(img.url)}
                      className="text-[0.6rem] font-mono text-text-soft hover:text-red-400 transition-colors"
                    >
                      remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
                  onChange={handleUploadFile}
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
              className="prose min-h-[400px] p-5 glass overflow-auto"
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
              className="w-full px-4 py-3 glass-input rounded-xl text-text font-mono text-sm focus:outline-none focus:border-sand/30 transition-all resize-y leading-relaxed"
            />
          )}
        </div>

        <input
          name="tags"
          defaultValue={initial?.tags}
          placeholder="Tags (comma-separated)"
          className="w-full px-4 py-3 glass-input rounded-xl text-text-soft text-sm font-mono focus:outline-none focus:border-sand/30 transition-all"
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
