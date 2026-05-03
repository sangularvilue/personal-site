import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/lsat-auth";
import {
  applyEloUpdate,
  getDailySet,
  getDailySubmission,
  getQuestionsByIds,
  logAttempt,
  postScore,
  setDailySubmission,
  todayEst,
} from "@/lib/lsat-redis";
import type { LSATAnswerLetter } from "@/lib/lsat-types";

// Submit a full daily run.
// Body: { picks: { [qid]: { selected, shuffle_key, ms } } }
// Once-per-day enforced — second submission returns the existing record.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in." },
      { status: 401 },
    );
  }
  const date = todayEst();

  const existing = await getDailySubmission(user.id, date);
  if (existing) {
    return NextResponse.json({ ok: true, already: true, submission: existing });
  }

  const body = (await req.json()) as {
    picks: Record<
      string,
      { selected: LSATAnswerLetter | null; shuffle_key: string; ms: number }
    >;
  };
  const ids = await getDailySet(date);
  const qs = await getQuestionsByIds(ids);
  const sessionId = crypto.randomUUID();
  let correctN = 0;
  let totalMs = 0;
  const recordPicks: Record<string, LSATAnswerLetter | null> = {};

  for (const q of qs) {
    const p = body.picks?.[q.id];
    const selected = p?.selected ?? null;
    const shuffleKey = p?.shuffle_key || "abcde";
    const ms = p?.ms ?? 0;
    let canonical: LSATAnswerLetter | null = selected;
    if (selected && /^[abcde]{5}$/.test(shuffleKey)) {
      const posIdx = "abcde".indexOf(selected);
      canonical = shuffleKey[posIdx] as LSATAnswerLetter;
    }
    const correct = canonical === q.correct;
    if (correct) correctN++;
    totalMs += ms;
    recordPicks[q.id] = selected;

    await applyEloUpdate(user.id, q, correct);
    await logAttempt(user.id, {
      question_id: q.id,
      selected,
      correct,
      ms_to_answer: ms,
      answered_at: Date.now(),
      game_mode: "daily",
      session_id: sessionId,
      skill: q.skill,
      shuffle_key: shuffleKey,
    });
  }

  // Score: 200 per correct, +up to 50 per Q for speed (faster = more, capped).
  const speedBonus = Math.max(0, Math.min(250, 250 - Math.floor(totalMs / 1000)));
  const score = correctN * 200 + speedBonus;

  const sub = {
    date,
    picks: recordPicks,
    correct_count: correctN,
    score,
    submitted_at: Date.now(),
  };
  await setDailySubmission(user.id, date, sub);
  await postScore("daily", "all", user.id, user.display_name, score, date);

  return NextResponse.json({ ok: true, submission: sub });
}
