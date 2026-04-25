// Seed Fedcourts content from CSV files into Redis.
// Run with:  npx tsx scripts/seed-fedcourts.ts
//
// Expects env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

import { readFileSync } from "fs";
import { join } from "path";
import { upsertQuestion, upsertCase, upsertRule } from "../lib/fc-redis";
import type { FCQuestion, FCCase, FCRule, FCCategory } from "../lib/fc-types";

function parseCSV(text: string): string[][] {
  // Robust CSV parser supporting quoted fields with commas and "" escapes.
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

async function seedQuestions() {
  const path = join(process.cwd(), "fedcourts/content/questions.csv");
  const text = readFileSync(path, "utf8");
  const rows = parseCSV(text);
  const headers = rows.shift()!;
  console.log(`Seeding ${rows.length} questions...`);
  let n = 0;
  for (const row of rows) {
    const o = rowToObj(headers, row);
    const q: FCQuestion = {
      id: o.id,
      category: o.category as FCCategory,
      difficulty: parseInt(o.difficulty || "3", 10),
      rating: 1000,
      num_answered: 0,
      stem: o.stem,
      opt_a: o.opt_a,
      opt_b: o.opt_b,
      opt_c: o.opt_c,
      opt_d: o.opt_d,
      correct: o.correct.toLowerCase() as "a" | "b" | "c" | "d",
      case_cited: o.case || undefined,
      rule_id: o.rule_id || undefined,
      prong: o.prong || undefined,
      explanation: o.explanation,
      tags: o.tags ? o.tags.split(";").map((t) => t.trim()).filter(Boolean) : [],
      daily_eligible: o.daily_eligible === "true" || o.daily_eligible === "1",
    };
    await upsertQuestion(q);
    n++;
    if (n % 50 === 0) console.log(`  ${n}/${rows.length}`);
  }
  console.log(`Done seeding ${n} questions.`);
}

async function seedCases() {
  const path = join(process.cwd(), "fedcourts/content/cases.csv");
  const text = readFileSync(path, "utf8");
  const rows = parseCSV(text);
  const headers = rows.shift()!;
  console.log(`Seeding ${rows.length} cases...`);
  for (const row of rows) {
    const o = rowToObj(headers, row);
    const c: FCCase = {
      id: o.id,
      name: o.name,
      year: parseInt(o.year || "0", 10),
      court: o.court,
      category: o.category as FCCategory,
      holding: o.holding,
      facts_one_liner: o.facts_one_liner,
      cluster: o.cluster || undefined,
      outline_section: o.outline_section || undefined,
      first_letter: o.first_letter || undefined,
      citation_hint: o.citation_hint || undefined,
    };
    await upsertCase(c);
  }
  console.log(`Done seeding cases.`);
}

async function seedRules() {
  const path = join(process.cwd(), "fedcourts/content/rules.csv");
  const text = readFileSync(path, "utf8");
  const rows = parseCSV(text);
  const headers = rows.shift()!;
  console.log(`Seeding ${rows.length} rules...`);
  for (const row of rows) {
    const o = rowToObj(headers, row);
    const r: FCRule = {
      id: o.id,
      name: o.name,
      category: o.category as FCCategory,
      elements: o.elements ? o.elements.split(";").map((s) => s.trim()).filter(Boolean) : [],
      source_case: o.source_case || undefined,
      when_applied: o.when_applied || undefined,
      common_distractors: o.common_distractors
        ? o.common_distractors.split(";").map((s) => s.trim()).filter(Boolean)
        : [],
    };
    await upsertRule(r);
  }
  console.log(`Done seeding rules.`);
}

async function main() {
  await seedRules();
  await seedCases();
  await seedQuestions();
  console.log("All done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
