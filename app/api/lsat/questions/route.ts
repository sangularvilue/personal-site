import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/lsat-auth";
import {
  getAllQuestionIds,
  getQuestionIdsBySection,
  getQuestionIdsBySkill,
  getQuestionsByIds,
  getUserRatings,
} from "@/lib/lsat-redis";
import type {
  LSATQuestion,
  LSATSectionType,
  LSATSkill,
} from "@/lib/lsat-types";
import { LSAT_LETTERS, LSAT_SKILLS } from "@/lib/lsat-types";

// Reduce payload size when shipping the question list to the client; the
// client never needs to know the correct answer ahead of time.
type ClientQuestion = {
  id: string;
  pt: number;
  section_num: number;
  section_type: LSATSectionType;
  question_num: number;
  passage_id?: string;
  skill: LSATSkill;
  rating: number;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  choice_e: string;
  shuffle_key: string;
};

// GET /api/lsat/questions?n=10 [&skill=inference] [&section=LR] [&adaptive=1] [&pt=73]
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const n = Math.min(50, Math.max(1, parseInt(sp.get("n") || "10", 10)));
  const skill = sp.get("skill") as LSATSkill | null;
  const section = sp.get("section") as LSATSectionType | null;
  const pt = sp.get("pt") ? parseInt(sp.get("pt")!, 10) : null;
  const adaptive = sp.get("adaptive") === "1";

  let pool: LSATQuestion[];

  if (adaptive) {
    const user = await currentUser();
    if (!user) {
      const allIds = await getAllQuestionIds();
      pool = await getQuestionsByIds(sample(allIds, Math.min(allIds.length, 400)));
    } else {
      const ratings = await getUserRatings(user.id);
      const weakness = LSAT_SKILLS.map((s) => ({
        s,
        weakness: 1500 - (ratings[s] ?? 1000),
      }));
      const totalW = weakness.reduce((sum, x) => sum + Math.max(50, x.weakness), 0);
      const picks: LSATSkill[] = [];
      for (let i = 0; i < n * 3; i++) {
        let r = Math.random() * totalW;
        for (const w of weakness) {
          r -= Math.max(50, w.weakness);
          if (r <= 0) {
            picks.push(w.s);
            break;
          }
        }
      }
      const allIds: string[] = [];
      for (const s of new Set(picks)) {
        allIds.push(...(await getQuestionIdsBySkill(s)));
      }
      pool = await getQuestionsByIds(sample(allIds, Math.min(allIds.length, 400)));
      pool.sort((a, b) => {
        const da = Math.abs(a.rating - (ratings[a.skill] ?? 1000));
        const db = Math.abs(b.rating - (ratings[b.skill] ?? 1000));
        return da - db;
      });
    }
  } else if (skill) {
    const ids = await getQuestionIdsBySkill(skill);
    pool = await getQuestionsByIds(sample(ids, Math.min(ids.length, 400)));
  } else if (section) {
    const ids = await getQuestionIdsBySection(section);
    pool = await getQuestionsByIds(sample(ids, Math.min(ids.length, 400)));
  } else {
    const ids = await getAllQuestionIds();
    pool = await getQuestionsByIds(sample(ids, Math.min(ids.length, 400)));
  }

  if (pt !== null) {
    pool = pool.filter((q) => q.pt === pt);
  }

  // Shuffle pool, then take first n.
  shuffleInPlace(pool);
  const picked = pool.slice(0, n).map(toClientQuestion);

  return NextResponse.json({ ok: true, questions: picked });
}

function toClientQuestion(q: LSATQuestion): ClientQuestion {
  // Shuffle answer choices to defeat memorization — keep a key so the API
  // can map the user's display-position pick back to the canonical letter.
  const opts = [q.choice_a, q.choice_b, q.choice_c, q.choice_d, q.choice_e];
  const idx = [0, 1, 2, 3, 4];
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const shuffleKey = idx.map((i) => LSAT_LETTERS[i]).join("");
  return {
    id: q.id,
    pt: q.pt,
    section_num: q.section_num,
    section_type: q.section_type,
    question_num: q.question_num,
    passage_id: q.passage_id,
    skill: q.skill,
    rating: q.rating,
    stem: q.stem,
    choice_a: opts[idx[0]],
    choice_b: opts[idx[1]],
    choice_c: opts[idx[2]],
    choice_d: opts[idx[3]],
    choice_e: opts[idx[4]],
    shuffle_key: shuffleKey,
  };
}

function sample<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return [...arr];
  const out = [...arr];
  shuffleInPlace(out);
  return out.slice(0, n);
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
