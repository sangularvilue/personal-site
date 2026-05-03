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
  onUpdated?: (q: LSATQuestion, passageText?: string) => void;
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
  const [passageText, setPassageText] = useState<string>("");
  const [hasPassage, setHasPassage] = useState<boolean>(false);
  const [passageDirty, setPassageDirty] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/lsat/admin/question?id=${encodeURIComponent(questionId)}`)
      .then((r) => r.json())
      .then(async (d) => {
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
        // If the question references a passage, pull the latest passage text
        // from Redis so admin edits are never lost.
        if (fresh.passage_id) {
          setHasPassage(true);
          try {
            const pr = await fetch(
              `/api/lsat/admin/passage?id=${encodeURIComponent(fresh.passage_id)}`,
            );
            const pd = await pr.json();
            if (!cancelled && pd.ok) {
              setPassageText(pd.text || "");
              setPassageDirty(false);
            }
          } catch {
            // network error — leave passage textarea empty; admin can still
            // type in fresh content.
          }
        } else {
          setHasPassage(false);
          setPassageText("");
        }
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
    // Question fields.
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
    if (!data.ok) {
      setSaving(false);
      setError(data.error || "Save failed");
      return;
    }

    // Passage, if dirty.
    let passageSavedText: string | undefined;
    if (hasPassage && passageDirty && q?.passage_id) {
      const pr = await fetch("/api/lsat/admin/passage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passage_id: q.passage_id,
          text: passageText,
        }),
      });
      const pd = await pr.json();
      if (!pd.ok) {
        setSaving(false);
        setError(pd.error || "Passage save failed");
        return;
      }
      passageSavedText = passageText;
      setPassageDirty(false);
    }

    setSaving(false);
    setSavedMsg("Saved.");
    setQ(data.question);
    onUpdated?.(data.question, passageSavedText);
  }

  async function reloadPassage() {
    if (!q?.passage_id) return;
    setError("");
    try {
      const r = await fetch(
        `/api/lsat/admin/passage?id=${encodeURIComponent(q.passage_id)}`,
      );
      const d = await r.json();
      if (d.ok) {
        setPassageText(d.text || "");
        setPassageDirty(false);
      }
    } catch {
      setError("Could not reload passage.");
    }
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
            {hasPassage && q?.passage_id && (
              <label>
                <span
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span>
                    Passage
                    <span
                      style={{
                        fontFamily: "var(--lsat-mono, monospace)",
                        fontStyle: "normal",
                        color: "var(--lsat-ink-faint)",
                        fontSize: "0.78rem",
                        marginLeft: "0.4rem",
                      }}
                    >
                      ({q.passage_id})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={reloadPassage}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "var(--lsat-ribbon-deep)",
                      fontFamily: "var(--lsat-display)",
                      fontStyle: "italic",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    reload from Redis
                  </button>
                </span>
                <textarea
                  value={passageText}
                  onChange={(e) => {
                    setPassageText(e.target.value);
                    setPassageDirty(true);
                  }}
                  rows={10}
                  style={{ minHeight: "10rem" }}
                  placeholder="Passage / LG setup text…"
                />
              </label>
            )}
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
