// Second audit pass: detect grammar mismatches between stem and options.
// Stems ending with patterns like "to:", "is:", "applies:" expect specific
// completion forms. If a non-correct option doesn't fit grammatically, the
// answer becomes guessable. Scrap the worst offenders.
//
// Run: node --import tsx scripts/audit2.ts [scrap_count=80]

import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(field); field = ""; }
      else if (ch === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (ch === "\r") {}
      else field += ch;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].length > 0));
}

function csvEscape(s: string): string {
  if (s == null) return "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// Heuristic: detect stem-option grammatical-form mismatch.
// Returns true if the option doesn't grammatically fit the stem.
function grammarMismatch(stem: string, option: string): boolean {
  const trim = stem.trim();
  const opt = option.trim();
  if (!opt) return true;

  // Stem ends with "to:" → expect infinitive verb start (Allow/Force/etc.)
  if (/\bto\s*:?\s*$/i.test(trim)) {
    const first = opt.split(/\s+/)[0].replace(/[.,;:]/g, "");
    // proper-noun start = case name? unlikely fit
    if (/^[A-Z][a-z]+$/.test(first) && /v\.|et al\.|^US$/i.test(opt)) return true;
    // article start = noun phrase, doesn't fit "to ___"
    if (/^(An?|The)\b/i.test(opt)) return true;
    return false;
  }
  // Stem ends with "if:" or "when:" → expect clause
  if (/\b(if|when|where|because|since|while|unless)\s*:?\s*$/i.test(trim)) {
    return false; // clauses can take many forms; can't reliably detect
  }
  // Stem ends with "is/are/was/were/applies/holds/means/requires:" — expect predicate
  if (/\b(is|are|was|were|applies|holds|means|requires|reflects|provides)\s*:?\s*$/i.test(trim)) {
    // option starting with case name like "Murdock v. Memphis limits..." reads like its own sentence
    if (/^[A-Z][a-zA-Z]+\s+v\.\s+[A-Z]/.test(opt)) return true;
    // option starting with "Federal common law fills..." is a complete sentence
    return false;
  }
  // Stem ends with "include:" or "includes:" → expect noun list
  if (/\b(include|includes|including)\s*:?\s*$/i.test(trim)) {
    if (/^(An?|The)\b/i.test(opt)) return false; // "An X, a Y, ..." OK
    return false;
  }
  return false;
}

const path = join(process.cwd(), "fedcourts/content/questions.csv");
const text = readFileSync(path, "utf8");
const rows = parseCSV(text);
const headers = rows.shift()!;
const idx = (h: string) => headers.indexOf(h);

type Scored = { row: string[]; mismatches: number; correctMismatch: boolean };
const scored: Scored[] = rows.map((row) => {
  const stem = row[idx("stem")] || "";
  const opts = ["a", "b", "c", "d"].map((l) => row[idx(`opt_${l}`)] || "");
  const correctIdx = "abcd".indexOf((row[idx("correct")] || "a").toLowerCase());
  let mismatches = 0;
  let correctMismatch = false;
  for (let i = 0; i < 4; i++) {
    if (grammarMismatch(stem, opts[i])) {
      mismatches++;
      if (i === correctIdx) correctMismatch = true;
    }
  }
  return { row, mismatches, correctMismatch };
});

// Score: scrap if 2+ non-correct distractors don't grammatically fit
//        (creates a tell — the correct answer stands out by fit)
const scrapTargets = scored.filter((s) => {
  if (s.correctMismatch) return false; // weird state, skip
  return s.mismatches >= 2; // most distractors don't fit → tell
});

console.log(`Scrap candidates: ${scrapTargets.length}`);
for (const s of scrapTargets.slice(0, 10)) {
  console.log(`  ${s.row[0]} (${s.mismatches} mismatches): "${s.row[idx("stem")].slice(0, 60)}"`);
}

const scrapIds = new Set(scrapTargets.map((s) => s.row[0]));
const kept = rows.filter((r) => !scrapIds.has(r[0]));

const lines = [headers.join(",")];
for (const r of kept) lines.push(r.map(csvEscape).join(","));
writeFileSync(path, lines.join("\n") + "\n");
console.log(`\nWrote ${kept.length} questions (was ${rows.length}).`);

// Append to scrapped log
const scrapLog = join(process.cwd(), "fedcourts/content/scrapped-questions.csv");
const logLines = scrapTargets.map((s) =>
  [s.row[0], s.row[idx("category")], "audit2", csvEscape(`grammar mismatch (${s.mismatches})`)].join(","),
);
appendFileSync(scrapLog, "\n" + logLines.join("\n"));
