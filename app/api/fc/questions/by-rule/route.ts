import { NextRequest, NextResponse } from "next/server";
import { FC_CATEGORIES } from "@/lib/fc-types";
import { getQuestionIdsByCategory, getQuestionsByIds } from "@/lib/fc-redis";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ruleId = sp.get("rule");
  const n = Math.min(20, parseInt(sp.get("n") || "10", 10));
  if (!ruleId) return NextResponse.json({ ok: false, error: "Need rule" }, { status: 400 });

  // we don't index by rule_id; gather across categories and filter
  const allIds: string[] = [];
  for (const c of FC_CATEGORIES) {
    allIds.push(...(await getQuestionIdsByCategory(c)));
  }
  const all = await getQuestionsByIds(allIds);
  const filtered = all.filter((q) => q.rule_id === ruleId);
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }
  const LETTERS = ["a", "b", "c", "d"] as const;
  const picked = filtered.slice(0, n).map((q) => {
    const opts = [q.opt_a, q.opt_b, q.opt_c, q.opt_d];
    const idx = [0, 1, 2, 3];
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return {
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      rating: q.rating,
      stem: q.stem,
      opt_a: opts[idx[0]],
      opt_b: opts[idx[1]],
      opt_c: opts[idx[2]],
      opt_d: opts[idx[3]],
      case_cited: q.case_cited,
      shuffle_key: idx.map((i) => LETTERS[i]).join(""),
    };
  });
  return NextResponse.json({ questions: picked });
}
