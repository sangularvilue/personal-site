// Seed lsat content from CSV into Redis.
// Run with:
//   npx vercel env pull .env.local
//   node --env-file=.env.local --import tsx scripts/seed-lsat.ts
//
// Expects env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

import { readFileSync } from "fs";
import { join } from "path";
import { clearAllQuestions, setPassageText, upsertQuestion } from "../lib/lsat-redis";
import {
  LSAT_LETTERS,
  LSAT_SKILLS,
  type LSATAnswerLetter,
  type LSATQuestion,
  type LSATSectionType,
  type LSATSkill,
} from "../lib/lsat-types";

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        cur.push(field);
        field = "";
      } else if (ch === "\n") {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else if (ch === "\r") {
        // skip
      } else {
        field += ch;
      }
    }
  }
  if (field.length || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].length > 0));
}

function rowToObj(headers: string[], row: string[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) o[headers[i]] = row[i] ?? "";
  return o;
}

async function seedPassages() {
  const path = join(process.cwd(), "lsat/content/passages.csv");
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    console.log("No passages.csv found — skipping.");
    return;
  }
  const rows = parseCSV(text);
  const headers = rows.shift()!;
  const idIdx = headers.indexOf("passage_id");
  const textIdx = headers.indexOf("text");
  if (idIdx === -1 || textIdx === -1) {
    console.log("passages.csv missing passage_id or text — skipping.");
    return;
  }
  console.log(`Seeding ${rows.length} passages…`);
  let n = 0;
  for (const row of rows) {
    const id = row[idIdx];
    const passage = row[textIdx];
    if (!id || !passage) continue;
    await setPassageText(id, passage);
    n++;
    if (n % 50 === 0) console.log(`  …${n} passages seeded`);
  }
  console.log(`Done. Seeded ${n} passages.`);
}

async function main() {
  // Always wipe questions first so a previously-seeded broken row doesn't
  // linger after the validator starts rejecting it.
  console.log("Wiping previously-seeded questions…");
  const wipe = await clearAllQuestions();
  console.log(`  Deleted ${wipe.deleted} question hashes + index sets.`);

  await seedPassages();

  const path = join(process.cwd(), "lsat/content/questions.csv");
  const text = readFileSync(path, "utf8");
  const rows = parseCSV(text);
  const headers = rows.shift()!;
  console.log(`Seeding ${rows.length} questions from ${path}…`);

  // First pass: build a map of (pt:section_num) → list of question rows in
  // order. This lets us inherit a passage_id from the previous good RC/LG
  // question when one is missing — the OCR drops the passage_id on rows
  // belonging to the same passage as a prior question.
  type Obj = ReturnType<typeof rowToObj>;
  const buckets = new Map<string, Obj[]>();
  const objs: Obj[] = rows.map((r) => rowToObj(headers, r));
  for (const o of objs) {
    const key = `${o.pt}:${o.section_num}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(o);
  }
  for (const list of buckets.values()) {
    list.sort(
      (a, b) =>
        parseInt(a.question_num || "0", 10) - parseInt(b.question_num || "0", 10),
    );
    let lastPassageId = "";
    for (const o of list) {
      if (
        (o.section_type === "RC" || o.section_type === "LG") &&
        !(o.passage_id || "").trim()
      ) {
        if (lastPassageId) o.passage_id = lastPassageId;
      } else if ((o.passage_id || "").trim()) {
        lastPassageId = o.passage_id;
      }
    }
  }

  // Second pass: validate + seed. Skip rows that are too damaged to be useful.
  let n = 0;
  let skipped = 0;
  const skipReasons: Record<string, number> = {};
  function skip(reason: string) {
    skipped++;
    skipReasons[reason] = (skipReasons[reason] || 0) + 1;
  }

  for (const o of objs) {
    if (!o.question_id) {
      skip("missing-id");
      continue;
    }
    const correctRaw = (o.correct_answer || "").toLowerCase();
    if (!LSAT_LETTERS.includes(correctRaw as LSATAnswerLetter)) {
      skip("missing-correct");
      continue;
    }
    const stem = (o.stem || "").trim();
    if (!stem) {
      skip("empty-stem");
      continue;
    }
    // Mega-stem: this row's stem carries the text of several downstream
    // questions glued together (a parse artifact from the OCR). It always
    // contains a few inline "(A)" "(B)" "(C)" markers.
    if (stem.length > 800) {
      const inlineMarkers = (stem.match(/\([A-E]\)/g) || []).length;
      if (inlineMarkers >= 3) {
        skip("mega-stem");
        continue;
      }
    }
    const choices = {
      a: (o.choice_a || "").trim(),
      b: (o.choice_b || "").trim(),
      c: (o.choice_c || "").trim(),
      d: (o.choice_d || "").trim(),
      e: (o.choice_e || "").trim(),
    };
    if (!choices.a || !choices.b || !choices.c || !choices.d || !choices.e) {
      skip("empty-choice");
      continue;
    }
    // Reject rows where the correct answer's text is wildly longer than the
    // others — that is the signature of a parse error where the stem of the
    // next question leaked into a choice.
    const ct = choices[correctRaw as keyof typeof choices].length;
    const otherLens = (Object.entries(choices)
      .filter(([k]) => k !== correctRaw)
      .map(([, v]) => v.length));
    const otherMean =
      otherLens.reduce((s, x) => s + x, 0) / Math.max(1, otherLens.length);
    if (ct > 200 && otherMean > 0 && ct > otherMean * 4) {
      skip("suspicious-correct");
      continue;
    }

    let skill = o.skills as LSATSkill;
    if (!LSAT_SKILLS.includes(skill)) skill = "inference";
    const sectionType = (o.section_type || "LR") as LSATSectionType;

    const q: LSATQuestion = {
      id: o.question_id,
      pt: parseInt(o.pt || "0", 10),
      section_num: parseInt(o.section_num || "0", 10),
      section_type: sectionType,
      question_num: parseInt(o.question_num || "0", 10),
      passage_id: o.passage_id || undefined,
      stem,
      choice_a: choices.a,
      choice_b: choices.b,
      choice_c: choices.c,
      choice_d: choices.d,
      choice_e: choices.e,
      correct: correctRaw as LSATAnswerLetter,
      skill,
      rating: 1000,
      num_answered: 0,
    };

    await upsertQuestion(q);
    n++;
    if (n % 100 === 0) console.log(`  …${n} seeded`);
  }
  console.log(`\nDone. Seeded ${n} questions, skipped ${skipped}.`);
  if (skipped > 0) {
    console.log(`Skip reasons:`);
    for (const [r, c] of Object.entries(skipReasons).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${r.padEnd(20)} ${c}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
