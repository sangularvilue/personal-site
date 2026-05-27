"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Current {
  id: string;
  name: string;
}

interface UploadedImage {
  url: string;
  name: string;
}

interface Props {
  balladId?: string;
  initial?: {
    title: string;
    content: string;
    currentId: string;
  };
  defaultCurrentId?: string;
}

async function uploadFile(file: File): Promise<string> {
  const tokenRes = await fetch("/api/upload", { method: "POST" });
  if (!tokenRes.ok) {
    const data = await tokenRes.json().catch(() => ({}));
    throw new Error(data.error || "Auth failed");
  }
  const { token } = await tokenRes.json();
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

export default function BalladEditor({
  balladId,
  initial,
  defaultCurrentId,
}: Props) {
  const router = useRouter();
  const [currents, setCurrents] = useState<Current[]>([]);
  const [currentId, setCurrentId] = useState(
    initial?.currentId || defaultCurrentId || ""
  );
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [imageTray, setImageTray] = useState<UploadedImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/fountain/currents")
      .then((r) => r.json())
      .then((list: Current[]) => {
        setCurrents(list);
        if (!currentId && list.length > 0) setCurrentId(list[0].id);
      });
  }, [currentId]);

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

  async function handleInsertUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadFile(file);
      const textarea = textareaRef.current;
      const pos = textarea ? textarea.selectionStart : content.length;
      const before = content.slice(0, pos);
      const after = content.slice(pos);
      setContent(before + `![${file.name}](${url})` + after);
    } catch (err: unknown) {
      setUploadError(
        `Upload failed: ${err instanceof Error ? err.message : "unknown error"}`
      );
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
      setUploadError(
        `Upload failed: ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
    setUploading(false);
    e.target.value = "";
  }

  function insertAsAside(img: UploadedImage) {
    const textarea = textareaRef.current;
    const pos = textarea ? textarea.selectionStart : content.length;
    const before = content.slice(0, pos);
    const after = content.slice(pos);
    const md = `:::aside 300\n![${img.name}](${img.url})\n:::\n`;
    setContent(before + md + after);
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPos = pos + md.length;
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }

  function insertInline(img: UploadedImage) {
    const textarea = textareaRef.current;
    const pos = textarea ? textarea.selectionStart : content.length;
    const before = content.slice(0, pos);
    const after = content.slice(pos);
    setContent(before + `![${img.name}](${img.url})` + after);
  }

  function removeTrayImage(url: string) {
    setImageTray((prev) => prev.filter((img) => img.url !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentId) return;
    setSaving(true);
    const url = balladId
      ? `/api/fountain/ballads/${balladId}`
      : "/api/fountain/ballads";
    const method = balladId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, currentId }),
    });
    if (res.ok) {
      router.push("/admin/fountain");
      router.refresh();
    } else {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <Link
        href="/admin/fountain"
        className="text-sm text-text-soft hover:text-text transition-colors mb-8 inline-block"
      >
        &larr; back
      </Link>
      <h1 className="font-serif text-sand text-2xl font-medium mb-2">
        {balladId ? "Edit ballad" : "New ballad"}
      </h1>
      <p className="text-xs text-text-soft font-mono mb-8">
        named after a person or thing — e.g.{" "}
        <span className="text-sand">Donald Mendelson</span> becomes{" "}
        <span className="text-sand">The Ballad of Donald Mendelson</span>
      </p>

      {currents.length === 0 ? (
        <div className="py-8">
          <p className="text-text-soft font-serif italic mb-4">
            Create a current first.
          </p>
          <Link
            href="/admin/fountain/currents/new"
            className="text-xs font-mono text-teal hover:text-sand transition-colors"
          >
            + new current &rarr;
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-text-soft mb-2">
              current
            </label>
            <select
              value={currentId}
              onChange={(e) => setCurrentId(e.target.value)}
              required
              className="w-full px-4 py-3 glass-input rounded-xl text-text font-serif text-sm focus:outline-none focus:border-sand/30 transition-all"
            >
              {currents.map((c) => (
                <option key={c.id} value={c.id}>
                  The Current of {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-text-soft mb-2">
              ballad of...
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Donald Mendelson"
              required
              className="w-full px-4 py-3 glass-input rounded-xl text-text font-serif text-lg focus:outline-none focus:border-sand/30 transition-all"
            />
          </div>

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
            {uploadError && (
              <p className="text-red-400 text-xs font-mono">{uploadError}</p>
            )}
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
                    onChange={handleInsertUpload}
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
                placeholder="Write the ballad in markdown..."
                rows={20}
                className="w-full px-4 py-3 glass-input rounded-xl text-text font-mono text-sm focus:outline-none focus:border-sand/30 transition-all resize-y leading-relaxed"
              />
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !title || !currentId}
              className="px-6 py-3 bg-sand/15 border border-sand/30 rounded-lg text-sand font-mono text-sm hover:bg-sand/25 transition-colors disabled:opacity-50"
            >
              {saving ? "saving..." : "save"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
