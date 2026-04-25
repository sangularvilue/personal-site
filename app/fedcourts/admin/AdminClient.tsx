"use client";
import { useState } from "react";

export default function AdminClient({ categories }: { categories: string[] }) {
  const [csvText, setCsvText] = useState("");
  const [importStatus, setImportStatus] = useState<string>("");
  const [tab, setTab] = useState<"add" | "import" | "export">("add");

  // single-question form
  const [form, setForm] = useState({
    id: "",
    category: categories[0],
    difficulty: 3,
    stem: "",
    opt_a: "", opt_b: "", opt_c: "", opt_d: "",
    correct: "a",
    case: "",
    rule_id: "",
    prong: "",
    explanation: "",
    tags: "",
    daily_eligible: false,
  });

  async function addOne(e: React.FormEvent) {
    e.preventDefault();
    setImportStatus("Saving…");
    const res = await fetch("/api/fc/admin/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setImportStatus(data.ok ? "Saved." : `Error: ${data.error}`);
  }

  async function importCsv() {
    setImportStatus("Importing…");
    const res = await fetch("/api/fc/admin/import-csv", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: csvText,
    });
    const data = await res.json();
    setImportStatus(data.ok ? `Imported ${data.count} rows.` : `Error: ${data.error}`);
  }

  return (
    <div>
      <h1 className="fc-h1">Admin</h1>
      <p className="fc-sub">Add or import questions. Source-of-truth CSV in <code>fedcourts/content/questions.csv</code>.</p>

      <div className="fc-tabs">
        {[
          ["add", "Add one"],
          ["import", "CSV import"],
          ["export", "Export"],
        ].map(([k, label]) => (
          <button key={k} className={`fc-tab ${tab === k ? "fc-tab-active" : ""}`} onClick={() => setTab(k as typeof tab)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "add" && (
        <form onSubmit={addOne} className="fc-form" style={{ maxWidth: "100%" }}>
          <label>ID<input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} required /></label>
          <label>Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Stem<textarea value={form.stem} onChange={(e) => setForm({ ...form, stem: e.target.value })} required rows={3} style={{ font: "inherit", padding: "0.7rem", borderRadius: "0.5rem", background: "var(--fc-bg-elevated)", border: "1px solid var(--fc-border-strong)", color: "var(--fc-text)" }} /></label>
          {(["a", "b", "c", "d"] as const).map((l) => (
            <label key={l}>Option {l.toUpperCase()}<input value={form[`opt_${l}` as const]} onChange={(e) => setForm({ ...form, [`opt_${l}`]: e.target.value })} required /></label>
          ))}
          <label>Correct
            <select value={form.correct} onChange={(e) => setForm({ ...form, correct: e.target.value })}>
              {["a", "b", "c", "d"].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label>Case<input value={form.case} onChange={(e) => setForm({ ...form, case: e.target.value })} /></label>
          <label>Rule ID<input value={form.rule_id} onChange={(e) => setForm({ ...form, rule_id: e.target.value })} /></label>
          <label>Prong<input value={form.prong} onChange={(e) => setForm({ ...form, prong: e.target.value })} /></label>
          <label>Explanation<textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} required rows={3} style={{ font: "inherit", padding: "0.7rem", borderRadius: "0.5rem", background: "var(--fc-bg-elevated)", border: "1px solid var(--fc-border-strong)", color: "var(--fc-text)" }} /></label>
          <label>Tags (semicolon-separated)<input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></label>
          <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" checked={form.daily_eligible} onChange={(e) => setForm({ ...form, daily_eligible: e.target.checked })} style={{ width: "auto" }} />
            Daily-eligible
          </label>
          <button type="submit">Save</button>
          {importStatus && <p style={{ color: "var(--fc-text-soft)" }}>{importStatus}</p>}
        </form>
      )}

      {tab === "import" && (
        <div>
          <p className="fc-sub">Paste CSV content (with header). Rows upsert by id.</p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={14}
            style={{ width: "100%", font: "inherit", padding: "0.7rem", borderRadius: "0.5rem", background: "var(--fc-bg-elevated)", border: "1px solid var(--fc-border-strong)", color: "var(--fc-text)", fontFamily: "JetBrains Mono, monospace" }}
            placeholder="id,category,difficulty,stem,opt_a,opt_b,opt_c,opt_d,correct,case,rule_id,prong,explanation,tags,daily_eligible&#10;..."
          />
          <button className="fc-drill-next" onClick={importCsv}>Import</button>
          {importStatus && <p style={{ color: "var(--fc-text-soft)" }}>{importStatus}</p>}
        </div>
      )}

      {tab === "export" && (
        <div>
          <p className="fc-sub">Download current question bank as CSV.</p>
          <a className="fc-drill-next" href="/api/fc/admin/export-csv" style={{ display: "inline-block", textDecoration: "none", textAlign: "center" }}>
            Download CSV
          </a>
        </div>
      )}
    </div>
  );
}
