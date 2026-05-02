"use client";
import { useEffect, useState } from "react";
import {
  LSAT_LETTERS,
  LSAT_SKILLS,
  LSAT_SKILL_LABELS,
  type LSATAnswerLetter,
  type LSATQuestion,
  type LSATSkill,
} from "@/lib/lsat-types";

type Props = {
  questionId: string;
  // Skill known from the public payload — shown for non-admins.
  publicSkill?: LSATSkill;
  isAdmin: boolean;
  onClose: () => void;
  onUpdated?: (q: LSATQuestion) => void;
};

export default function QuestionInfo({
  questionId,
  publicSkill,
  isAdmin,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(isAdmin);
  const [error, setError] = useState("");
  const [q, setQ] = useState<LSATQuestion | null>(null);

  // Edit fields (admin only).
  const [stem, setStem] = useState("");
  const [choices, setChoices] = useState<Record<LSATAnswerLetter, string>>({
    a: "",
    b: "",
    c: "",
    d: "",
    e: "",
  });
  const [correct, setCorrect] = useState<LSATAnswerLetter>("a");
  const [skill, setSkill] = useState<LSATSkill>("inference");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/lsat/admin/question?id=${encodeURIComponent(questionId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d.ok) {
          setError(d.error || "Failed to load");
          return;
        }
        const fresh: LSATQuestion = d.question;
        setQ(fresh);
        setStem(fresh.stem);
        setChoices({
          a: fresh.choice_a,
          b: fresh.choice_b,
          c: fresh.choice_c,
          d: fresh.choice_d,
          e: fresh.choice_e,
        });
        setCorrect(fresh.correct);
        setSkill(fresh.skill);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, questionId]);

  // Esc to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    setSaving(true);
    setError("");
    setSavedMsg("");
    const res = await fetch("/api/lsat/admin/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: questionId,
        stem,
        choice_a: choices.a,
        choice_b: choices.b,
        choice_c: choices.c,
        choice_d: choices.d,
        choice_e: choices.e,
        correct,
        skill,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setSavedMsg("Saved.");
    setQ(data.question);
    onUpdated?.(data.question);
  }

  // Public view: just the tag, no edit.
  if (!isAdmin) {
    return (
      <div
        className="lsat-modal-back"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="lsat-modal" role="dialog" aria-modal="true">
          <h3>Question info</h3>
          <div className="lsat-modal-meta">{questionId}</div>
          <p style={{ marginBottom: "0.6rem" }}>
            <strong>Skill tag:</strong>{" "}
            {publicSkill ? LSAT_SKILL_LABELS[publicSkill] : "—"}
          </p>
          <p style={{ color: "var(--lsat-ink-soft)", fontSize: "0.88rem" }}>
            Only the admin (Will G) can edit a question's content or tag.
          </p>
          <div className="lsat-modal-actions">
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // Admin view: full editor.
  return (
    <div
      className="lsat-modal-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lsat-modal" role="dialog" aria-modal="true">
        <h3>Edit question</h3>
        <div className="lsat-modal-meta">
          {q
            ? `${questionId} · PT ${q.pt} S${q.section_num} Q${q.question_num} · ${q.section_type}`
            : questionId}
        </div>
        {loading ? (
          <p style={{ color: "var(--lsat-ink-soft)" }}>Loading…</p>
        ) : (
          <>
            <label>
              Stem
              <textarea
                value={stem}
                onChange={(e) => setStem(e.target.value)}
                rows={4}
              />
            </label>
            {LSAT_LETTERS.map((letter) => (
              <label key={letter}>
                Choice {letter.toUpperCase()}
                <textarea
                  value={choices[letter]}
                  onChange={(e) =>
                    setChoices((c) => ({ ...c, [letter]: e.target.value }))
                  }
                  rows={2}
                />
              </label>
            ))}
            <label>
              Correct answer
              <select
                value={correct}
                onChange={(e) =>
                  setCorrect(e.target.value as LSATAnswerLetter)
                }
              >
                {LSAT_LETTERS.map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Skill tag
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value as LSATSkill)}
              >
                {LSAT_SKILLS.map((s) => (
                  <option key={s} value={s}>
                    {LSAT_SKILL_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            {error && <p className="lsat-error">{error}</p>}
            {savedMsg && <p className="lsat-success">{savedMsg}</p>}
            <div className="lsat-modal-actions">
              <button onClick={onClose}>Cancel</button>
              <button
                className="primary"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
