import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/fc-auth";
import {
  setDailySubmission,
  getDailySubmission,
  updateStreak,
  postScore,
  todayEst,
} from "@/lib/fc-redis";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { date, case_id, correct, guesses } = await req.json();
  if (date !== todayEst()) return NextResponse.json({ ok: false, error: "Bad date" }, { status: 400 });
  const existing = await getDailySubmission(user.id, "case-wordle", date);
  if (existing) return NextResponse.json({ ok: false, error: "Already submitted" }, { status: 409 });

  await setDailySubmission(user.id, "case-wordle", date, {
    selected: case_id,
    correct: !!correct,
  });
  const streak = await updateStreak(user.id, "case-wordle", !!correct, date);
  // score = 6 - guesses (5 for first try, 1 for last) for solved; 0 otherwise
  const score = correct ? Math.max(1, 6 - guesses) : 0;
  await postScore("case-wordle", "all", user.id, user.display_name, score, date);
  return NextResponse.json({ ok: true, score, streak: streak.current });
}
