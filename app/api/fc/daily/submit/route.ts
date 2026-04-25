import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/fc-auth";
import {
  getQuestion,
  getDailySubmission,
  setDailySubmission,
  applyEloUpdate,
  logAnswer,
  updateStreak,
  postScore,
  todayEst,
} from "@/lib/fc-redis";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const { date, game, question_id, selected } = await req.json();
  if (!date || !game || !question_id || !selected) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  if (date !== todayEst()) {
    return NextResponse.json({ ok: false, error: "Date is not today" }, { status: 400 });
  }
  if (game !== "daily-hypo" && game !== "case-wordle") {
    return NextResponse.json({ ok: false, error: "Bad game" }, { status: 400 });
  }
  const existing = await getDailySubmission(user.id, game, date);
  if (existing) {
    return NextResponse.json({ ok: false, error: "Already submitted for today", existing }, { status: 409 });
  }

  const q = await getQuestion(question_id);
  if (!q) return NextResponse.json({ ok: false, error: "Bad question" }, { status: 404 });
  const correct = selected === q.correct;

  await Promise.all([
    setDailySubmission(user.id, game, date, { selected, correct }),
    applyEloUpdate(user.id, q, correct),
    logAnswer({
      user_id: user.id,
      question_id,
      game_mode: game,
      session_id: crypto.randomUUID(),
      selected,
      correct,
      ms_to_answer: 0,
      answered_at: Date.now(),
      category: q.category,
    }),
  ]);

  const streak = await updateStreak(user.id, game, correct, date);
  await postScore(game, "all", user.id, user.display_name, streak.current, date);

  return NextResponse.json({ ok: true, correct, streak: streak.current, longest: streak.longest });
}
