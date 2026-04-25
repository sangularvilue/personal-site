// Delete Redis question keys whose IDs are no longer in questions.csv.
// Run after editing the CSV to remove scrapped questions from Redis.
// Run: node --env-file=.env.local --import tsx scripts/cleanup-redis.ts

import { readFileSync } from "fs";
import { join } from "path";
import { getRedis } from "../lib/redis";
import { FC_CATEGORIES } from "../lib/fc-types";

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

async function main() {
  const r = getRedis();
  const path = join(process.cwd(), "fedcourts/content/questions.csv");
  const text = readFileSync(path, "utf8");
  const rows = parseCSV(text);
  rows.shift(); // header
  const csvIds = new Set<string>(rows.map((row) => row[0]));
  console.log(`CSV has ${csvIds.size} questions.`);

  let deleted = 0;
  for (const cat of FC_CATEGORIES) {
    const setKey = `fc:q-by-cat:${cat}`;
    const ids = (await r.smembers(setKey)) as string[];
    for (const id of ids) {
      if (!csvIds.has(id)) {
        await r.del(`fc:q:${id}`);
        await r.srem(setKey, id);
        deleted++;
        if (deleted % 25 === 0) console.log(`  deleted ${deleted}…`);
      }
    }
  }
  console.log(`Deleted ${deleted} stale question keys.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
