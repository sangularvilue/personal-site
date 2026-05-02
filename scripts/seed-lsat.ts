// Seed lsat content from CSV into Redis.
// Run with:
//   npx vercel env pull .env.local
//   node --env-file=.env.local --import tsx scripts/seed-lsat.ts
//
// Expects env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

import { readFileSync } from "fs";
import { join } from "path";
import { upsertQuestion } from "../lib/lsat-redis";
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

async function main() {
  const path = join(process.cwd(), "lsat/content/questions.csv");
  const text = readFileSync(path, "utf8");
  const rows = parseCSV(text);
  const headers = rows.shift()!;
  console.log(`Seeding ${rows.length} questions from ${path}…`);

  let n = 0;
  let skipped = 0;
  for (const row of rows) {
    const o = rowToObj(headers, row);
    if (!o.question_id) {
      skipped++;
      continue;
    }
    const correctRaw = (o.correct_answer || "").toLowerCase();
    if (!LSAT_LETTERS.includes(correctRaw as LSATAnswerLetter)) {
      // Some rows in the CSV don't have a correct answer recorded; skip them
      // rather than seeding with a wrong guess.
      skipped++;
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
      stem: o.stem,
      choice_a: o.choice_a,
      choice_b: o.choice_b,
      choice_c: o.choice_c,
      choice_d: o.choice_d,
      choice_e: o.choice_e,
      correct: correctRaw as LSATAnswerLetter,
      skill,
      rating: 1000,
      num_answered: 0,
    };

    await upsertQuestion(q);
    n++;
    if (n % 100 === 0) console.log(`  …${n} seeded`);
  }
  console.log(`Done. Seeded ${n} questions${skipped ? `, skipped ${skipped}` : ""}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
