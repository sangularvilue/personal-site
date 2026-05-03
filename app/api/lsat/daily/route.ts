import { NextResponse } from "next/server";
import { currentUser } from "@/lib/lsat-auth";
import {
  getDailySet,
  getDailySubmission,
  getQuestionsByIds,
  todayEst,
} from "@/lib/lsat-redis";
import { LSAT_LETTERS } from "@/lib/lsat-types";
import type { LSATAnswerLetter } from "@/lib/lsat-types";

// GET /api/lsat/daily
// Returns today's 5 questions with shuffled choices, plus user's submission state.
export async function GET() {
  const date = todayEst();
  const ids = await getDailySet(date);
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, error: "No daily set" }, { status: 503 });
  }
  const qs = await getQuestionsByIds(ids);
  // Preserve the original chosen order rather than the order Redis returns.
  const order = new Map(ids.map((id, i) => [id, i]));
  qs.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  // Shuffle each question's choices the same way every time today (seeded by qid+date).
  const out = qs.map((q) => {
    const seed = hash(q.id + ":" + date);
    const idx = [0, 1, 2, 3, 4];
    let s = seed >>> 0;
    function rnd() {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    }
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const opts = [q.choice_a, q.choice_b, q.choice_c, q.choice_d, q.choice_e];
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
  });

  const user = await currentUser();
  let submission = null;
  if (user) submission = await getDailySubmission(user.id, date);

  return NextResponse.json({ ok: true, date, questions: out, submission });
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

// Keep tree-shake happy
void LSAT_LETTERS;
void ({} as LSATAnswerLetter);
