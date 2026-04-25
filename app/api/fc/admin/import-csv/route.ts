import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/fc-auth";
import { upsertQuestion } from "@/lib/fc-redis";
import type { FCCategory, FCQuestion } from "@/lib/fc-types";

const ADMIN_USERNAMES = (process.env.FC_ADMINS || "will,maddie").split(",");

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

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user || !ADMIN_USERNAMES.includes(user.username.toLowerCase())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const text = await req.text();
  const rows = parseCSV(text);
  const headers = rows.shift();
  if (!headers) return NextResponse.json({ ok: false, error: "Empty CSV" }, { status: 400 });
  const idx = (h: string) => headers.indexOf(h);
  let count = 0;
  for (const row of rows) {
    if (!row[idx("id")]) continue;
    const q: FCQuestion = {
      id: row[idx("id")],
      category: row[idx("category")] as FCCategory,
      difficulty: parseInt(row[idx("difficulty")] || "3", 10),
      rating: 1000,
      num_answered: 0,
      stem: row[idx("stem")],
      opt_a: row[idx("opt_a")], opt_b: row[idx("opt_b")],
      opt_c: row[idx("opt_c")], opt_d: row[idx("opt_d")],
      correct: row[idx("correct")].toLowerCase() as "a" | "b" | "c" | "d",
      case_cited: row[idx("case")] || undefined,
      rule_id: row[idx("rule_id")] || undefined,
      prong: row[idx("prong")] || undefined,
      explanation: row[idx("explanation")],
      tags: row[idx("tags")] ? row[idx("tags")].split(";").map((t) => t.trim()).filter(Boolean) : [],
      daily_eligible: row[idx("daily_eligible")] === "true" || row[idx("daily_eligible")] === "1",
    };
    await upsertQuestion(q);
    count++;
  }
  return NextResponse.json({ ok: true, count });
}
