// Audit every question in fedcourts/content/questions.csv.
// Score on: distractor length, length-tell, pool-repetition, stem/explanation
// thinness, residual trash patterns. Scrap the bottom N (default 250).
//
// Outputs:
//   - questions.csv (rewritten with kept questions only)
//   - scrapped-questions.csv (audit trail of removed ones with reasons)
//
// Run: node --import tsx scripts/audit-questions.ts [scrap_count=250]

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// ---- CSV ----

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(field); field = ""; }
      else if (ch === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (ch === "\r") { /* skip */ }
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

// ---- Scoring ----

const TRASH_PATTERNS = [
  /^Same as /i, /^Pure /i, /^None of /i, /^All of /i, /^Both [a-d]/i,
  /^Article (I|II|III|IV|V|VI) ?(only)?$/i,
  /^(Bivens|Erie|Mottley|Diversity|FTCA|FCL|Common law|Civil rights)$/i,
  /^(Bivens|Erie) (applied|applies|precluded?)$/i,
  /^States? waived?$/i, /^Pure constitutional$/i,
];
const isTrash = (s: string) =>
  !s || s.length < 14 || TRASH_PATTERNS.some((rx) => rx.test(s.trim()));

type Row = string[];

function scoreRow(
  row: Row,
  idx: (h: string) => number,
  distFreq: Map<string, number>,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let s = 100;

  const correctLetter = (row[idx("correct")] || "a").toLowerCase();
  const correctIdx = "abcd".indexOf(correctLetter);
  const opts = [
    row[idx("opt_a")] || "",
    row[idx("opt_b")] || "",
    row[idx("opt_c")] || "",
    row[idx("opt_d")] || "",
  ];
  const correctText = opts[correctIdx] ?? "";
  const distractors = opts.filter((_, i) => i !== correctIdx);
  const stem = row[idx("stem")] || "";
  const explanation = row[idx("explanation")] || "";
  const caseCited = row[idx("case")] || "";
  const ruleId = row[idx("rule_id")] || "";

  // Distractor length & trash
  for (const d of distractors) {
    if (isTrash(d)) { s -= 35; reasons.push(`trash distractor: "${d.slice(0, 30)}"`); }
    else if (d.length < 22) { s -= 15; reasons.push(`short distractor (${d.length})`); }
    else if (d.length < 35) { s -= 5; }
  }

  // Length-tell: correct >> distractors
  const minDLen = Math.min(...distractors.map((d) => d.length || 1));
  if (correctText.length > 60 && minDLen < 25) { s -= 25; reasons.push("length-tell: correct >> shortest distractor"); }
  if (correctText.length > 0 && correctText.length > minDLen * 2.6) { s -= 15; reasons.push("length-tell: correct > 2.6x shortest"); }

  // Pool-repetition: same exact distractor used many times = metaquiz tell
  for (const d of distractors) {
    const f = distFreq.get(d) || 0;
    if (f >= 18) { s -= 25; reasons.push(`overused pool distractor (${f}×)`); }
    else if (f >= 10) { s -= 12; reasons.push(`repeated pool distractor (${f}×)`); }
  }

  // Stem
  if (stem.length < 40) { s -= 12; reasons.push("thin stem"); }
  if (stem.length < 25) { s -= 10; reasons.push("very thin stem"); }

  // Explanation
  if (explanation.length < 60) { s -= 8; reasons.push("thin explanation"); }
  if (explanation.length < 30) { s -= 12; reasons.push("very thin explanation"); }

  // Sourcing bonus
  if (caseCited) s += 4;
  if (ruleId) s += 2;

  // Question is a stub: stem ends with single word like "applies:" "apply:" "is:"
  if (/\b(is|applies|apply|requires|holds|means|reflects)\s*:\s*$/i.test(stem)) {
    // not a deal-breaker but suggests rule-recall not application
    // no penalty unless combined with other weakness — handled by stem length
  }

  return { score: s, reasons };
}

// ---- Main ----

const path = join(process.cwd(), "fedcourts/content/questions.csv");
const text = readFileSync(path, "utf8");
const rows = parseCSV(text);
const headers = rows.shift()!;
const idx = (h: string) => headers.indexOf(h);

// Pass 1: count distractor frequencies
const distFreq = new Map<string, number>();
for (const row of rows) {
  const correctLetter = (row[idx("correct")] || "a").toLowerCase();
  const correctIdx = "abcd".indexOf(correctLetter);
  for (let i = 0; i < 4; i++) {
    if (i === correctIdx) continue;
    const d = row[idx(`opt_${"abcd"[i]}`)] || "";
    distFreq.set(d, (distFreq.get(d) || 0) + 1);
  }
}

// Pass 2: score
type Scored = { row: Row; score: number; reasons: string[]; id: string };
const scored: Scored[] = rows.map((row) => {
  const { score, reasons } = scoreRow(row, idx, distFreq);
  return { row, score, reasons, id: row[idx("id")] };
});

scored.sort((a, b) => a.score - b.score);

const scrapCount = parseInt(process.argv[2] || "250", 10);
const scrapped = scored.slice(0, scrapCount);
const kept = scored.slice(scrapCount);

console.log(`Scrapping ${scrapped.length} of ${scored.length}.`);
console.log(`Score range scrapped: ${scrapped[0].score} → ${scrapped[scrapped.length - 1].score}`);
console.log(`Score range kept   : ${kept[0].score} → ${kept[kept.length - 1].score}`);
console.log(`\nWorst 10:`);
for (const q of scrapped.slice(0, 10)) {
  console.log(`  ${q.id} (${q.score}): ${q.reasons.slice(0, 3).join("; ")}`);
}
console.log(`\nBest 10 of kept:`);
for (const q of kept.slice(-10).reverse()) {
  console.log(`  ${q.id} (${q.score}): ${q.row[idx("category")]}`);
}

// Distribution of scrapped by category
const scrappedByCat: Record<string, number> = {};
for (const q of scrapped) {
  const c = q.row[idx("category")];
  scrappedByCat[c] = (scrappedByCat[c] || 0) + 1;
}
console.log(`\nScrapped by category:`, scrappedByCat);

// Write kept back to questions.csv (preserving original order, NOT score order)
const keptIds = new Set(kept.map((k) => k.id));
const orderedKept = rows.filter((r) => keptIds.has(r[idx("id")]));

const lines = [headers.join(",")];
for (const r of orderedKept) lines.push(r.map(csvEscape).join(","));
writeFileSync(path, lines.join("\n") + "\n");
console.log(`\nWrote ${orderedKept.length} questions to ${path}`);

// Write scrapped log for audit trail
const scrapHeaders = ["id", "category", "score", "reasons"];
const scrapLines = [scrapHeaders.join(",")];
for (const q of scrapped) {
  scrapLines.push([
    q.id, q.row[idx("category")], String(q.score),
    csvEscape(q.reasons.join(" | ")),
  ].join(","));
}
writeFileSync(
  join(process.cwd(), "fedcourts/content/scrapped-questions.csv"),
  scrapLines.join("\n") + "\n",
);
console.log(`Audit trail: fedcourts/content/scrapped-questions.csv`);
