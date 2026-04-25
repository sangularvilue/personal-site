import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/fc-auth";
import {
  getQuestionIdsByCategory,
  getQuestionsByIds,
  getUserRatings,
} from "@/lib/fc-redis";
import type { FCCategory, FCQuestion } from "@/lib/fc-types";
import { FC_CATEGORIES } from "@/lib/fc-types";

// GET /api/fc/questions?category=just&n=10  (Speed Drill style)
// GET /api/fc/questions?adaptive=1&n=10     (Drills, adaptive)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const n = Math.min(50, parseInt(sp.get("n") || "10", 10));
  const category = sp.get("category") as FCCategory | null;
  const adaptive = sp.get("adaptive") === "1";

  let pool: FCQuestion[];
  let ratings: Record<string, number> | null = null;

  if (adaptive) {
    const user = await currentUser();
    if (!user) {
      // unauthed — random mix
      const allIds: string[] = [];
      for (const c of FC_CATEGORIES) {
        allIds.push(...(await getQuestionIdsByCategory(c)));
      }
      pool = await getQuestionsByIds(allIds);
    } else {
      ratings = await getUserRatings(user.id);
      // weight categories by weakness
      const weakness = FC_CATEGORIES.map((c) => ({
        c,
        weakness: 1500 - (ratings![c] ?? 1000),
      }));
      const totalW = weakness.reduce((s, x) => s + Math.max(50, x.weakness), 0);
      const picks: FCCategory[] = [];
      for (let i = 0; i < n; i++) {
        let r = Math.random() * totalW;
        for (const w of weakness) {
          r -= Math.max(50, w.weakness);
          if (r <= 0) {
            picks.push(w.c);
            break;
          }
        }
      }
      const allIds: string[] = [];
      for (const c of new Set(picks)) {
        allIds.push(...(await getQuestionIdsByCategory(c)));
      }
      pool = await getQuestionsByIds(allIds);
      // sort closest to user rating in their category
      pool.sort((a, b) => {
        const da = Math.abs(a.rating - (ratings![a.category] ?? 1000));
        const db = Math.abs(b.rating - (ratings![b.category] ?? 1000));
        return da - db;
      });
    }
  } else if (category) {
    const ids = await getQuestionIdsByCategory(category);
    pool = await getQuestionsByIds(ids);
  } else {
    return NextResponse.json({ ok: false, error: "Need category or adaptive=1" }, { status: 400 });
  }

  // shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, n).map((q) => ({
    // strip correct + explanation from initial fetch
    id: q.id,
    category: q.category,
    difficulty: q.difficulty,
    rating: q.rating,
    stem: q.stem,
    opt_a: q.opt_a,
    opt_b: q.opt_b,
    opt_c: q.opt_c,
    opt_d: q.opt_d,
    case_cited: q.case_cited,
  }));
  return NextResponse.json({ questions: picked });
}
