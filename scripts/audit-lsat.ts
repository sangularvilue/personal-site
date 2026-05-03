// Audit the LSAT content for problems that would break the live drill UI.
// Pure CSV-level checks (no Redis required).
// Run: node --import tsx scripts/audit-lsat.ts

import { readFileSync } from "fs";
import { join } from "path";

type CSVRow = Record<string, string>;

function parseCSV(text: string): { headers: string[]; rows: CSVRow[] } {
  const out: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQ = false;
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") {
        cur.push(field);
        field = "";
      } else if (c === "\n") {
        cur.push(field);
        out.push(cur);
        cur = [];
        field = "";
      } else if (c === "\r") {
        // skip
      } else field += c;
    }
  }
  if (field || cur.length) {
    cur.push(field);
    out.push(cur);
  }
  const filtered = out.filter((r) => r.length > 1 || (r.length === 1 && r[0]));
  const headers = filtered.shift()!;
  const rows = filtered.map((r) => {
    const o: CSVRow = {};
    for (let i = 0; i < headers.length; i++) o[headers[i]] = r[i] ?? "";
    return o;
  });
  return { headers, rows };
}

const VALID_SKILLS = new Set([
  "main_point",
  "inference",
  "strengthen_weaken",
  "assumption",
  "flaw_method",
  "principle_parallel",
  "detail_function",
  "authors_voice",
]);

const VALID_LETTERS = new Set(["a", "b", "c", "d", "e"]);
const VALID_SECTIONS = new Set(["RC", "LR", "LG"]);

type Finding = {
  qid: string;
  section_type: string;
  pt: number;
  section_num: number;
  question_num: number;
  category: string;
  detail: string;
};

function main() {
  const root = process.cwd();
  const qPath = join(root, "lsat/content/questions.csv");
  const pPath = join(root, "lsat/content/passages.csv");
  const questionsCSV = readFileSync(qPath, "utf8");
  const passagesCSV = readFileSync(pPath, "utf8");
  const { rows: qrows } = parseCSV(questionsCSV);
  const { rows: prows } = parseCSV(passagesCSV);

  const passageById = new Map<string, CSVRow>();
  for (const p of prows) passageById.set(p.passage_id, p);

  const findings: Finding[] = [];
  const ids = new Set<string>();

  let total = 0;
  for (const r of qrows) {
    total++;
    const qid = r.question_id;
    const pt = parseInt(r.pt || "0", 10);
    const section_num = parseInt(r.section_num || "0", 10);
    const question_num = parseInt(r.question_num || "0", 10);
    const section_type = r.section_type;
    const meta = { qid, pt, section_num, question_num, section_type };

    function flag(category: string, detail: string) {
      findings.push({ ...meta, category, detail });
    }

    if (!qid) {
      flag("missing-id", "row has no question_id");
      continue;
    }
    if (ids.has(qid)) flag("duplicate-id", `seen twice`);
    ids.add(qid);

    if (!VALID_SECTIONS.has(section_type)) {
      flag("bad-section-type", `section_type=${JSON.stringify(section_type)}`);
    }

    // Stem must be non-empty.
    const stem = (r.stem || "").trim();
    if (!stem) flag("empty-stem", "stem is blank");
    if (stem.length < 5)
      flag("tiny-stem", `len=${stem.length}: ${JSON.stringify(stem)}`);

    // Each choice must be non-empty.
    const choices: Record<string, string> = {
      a: (r.choice_a || "").trim(),
      b: (r.choice_b || "").trim(),
      c: (r.choice_c || "").trim(),
      d: (r.choice_d || "").trim(),
      e: (r.choice_e || "").trim(),
    };
    for (const [letter, text] of Object.entries(choices)) {
      if (!text) flag(`empty-choice-${letter}`, `choice_${letter} is blank`);
      else if (text.length < 2)
        flag(`tiny-choice-${letter}`, `len=${text.length}: ${JSON.stringify(text)}`);
    }

    // Correct answer must be one of a-e.
    const correct = (r.correct_answer || "").trim().toLowerCase();
    if (!correct) flag("missing-correct", "correct_answer blank");
    else if (!VALID_LETTERS.has(correct))
      flag("bad-correct", `correct_answer=${JSON.stringify(r.correct_answer)}`);

    // Skill must be valid (warn rather than error if blank — fallback to inference).
    const skill = (r.skills || "").trim();
    if (skill && !VALID_SKILLS.has(skill))
      flag("bad-skill", `skill=${JSON.stringify(skill)}`);

    // RC/LG questions reference a passage.
    if (section_type === "RC" || section_type === "LG") {
      const pid = (r.passage_id || "").trim();
      if (!pid) flag("missing-passage-id", `${section_type} question has no passage_id`);
      else if (!passageById.has(pid))
        flag("dangling-passage-id", `passage_id=${pid} not in passages.csv`);
    }

    // Heuristic: if the *correct* answer text is suspiciously long compared to
    // the others, the row probably has a parse error (data leaking between fields).
    const correctLetter = correct as "a" | "b" | "c" | "d" | "e";
    if (VALID_LETTERS.has(correctLetter)) {
      const ct = choices[correctLetter];
      const others = (["a", "b", "c", "d", "e"] as const)
        .filter((l) => l !== correctLetter)
        .map((l) => choices[l].length);
      const otherMean =
        others.reduce((s, x) => s + x, 0) / Math.max(1, others.length);
      if (ct && otherMean > 0 && ct.length > otherMean * 4 && ct.length > 200) {
        flag(
          "suspicious-correct",
          `correct text is ${ct.length} chars vs avg ${Math.round(otherMean)} for others`,
        );
      }
    }

    // Heuristic: stem ending mid-sentence (common parse breakage). RC stems
    // sometimes legitimately end with a question mark or colon; just look for
    // *very* short stems with no terminal punctuation.
    if (stem && stem.length < 25 && !/[.?!:]$/.test(stem)) {
      flag(
        "stem-truncated?",
        `stem=${JSON.stringify(stem)}; might be truncated`,
      );
    }

    // Mega-stem: a stem that contains the text of multiple downstream
    // questions concatenated together. Signature: very long stem AND it
    // contains 3+ inline choice markers like "(A)" "(B)" "(C)". On a clean
    // row the stem doesn't carry choice markers — those live in the choice_a
    // through choice_e columns.
    if (stem.length > 800) {
      const inlineMarkers = (stem.match(/\([A-E]\)/g) || []).length;
      if (inlineMarkers >= 3) {
        flag(
          "mega-stem",
          `stem is ${stem.length} chars with ${inlineMarkers} inline choice markers`,
        );
      }
    }
  }

  // ====== Report ======

  const byCategory = new Map<string, Finding[]>();
  for (const f of findings) {
    if (!byCategory.has(f.category)) byCategory.set(f.category, []);
    byCategory.get(f.category)!.push(f);
  }

  console.log(`\n=== LSAT content audit ===`);
  console.log(`Read ${total} questions, ${prows.length} passages.`);
  console.log(
    `Found ${findings.length} issues across ${byCategory.size} categories.\n`,
  );

  // Categories sorted by severity (count desc).
  const cats = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [cat, list] of cats) {
    console.log(`[${cat}] ${list.length} occurrence${list.length === 1 ? "" : "s"}`);
    const sample = list.slice(0, 5);
    for (const f of sample) {
      console.log(`  ${f.qid} (PT${f.pt} §${f.section_num} Q${f.question_num} ${f.section_type}): ${f.detail}`);
    }
    if (list.length > sample.length) {
      console.log(`  …and ${list.length - sample.length} more`);
    }
    console.log();
  }

  // Per-section coverage of passage_id (informational).
  const rcMissing = qrows.filter(
    (r) => r.section_type === "RC" && !(r.passage_id || "").trim(),
  ).length;
  const rcTotal = qrows.filter((r) => r.section_type === "RC").length;
  const lgMissing = qrows.filter(
    (r) => r.section_type === "LG" && !(r.passage_id || "").trim(),
  ).length;
  const lgTotal = qrows.filter((r) => r.section_type === "LG").length;
  console.log(`Coverage:`);
  console.log(`  RC questions with passage_id: ${rcTotal - rcMissing} / ${rcTotal}`);
  console.log(`  LG questions with passage_id: ${lgTotal - lgMissing} / ${lgTotal}`);

  if (findings.length > 0) process.exit(1);
}

main();
