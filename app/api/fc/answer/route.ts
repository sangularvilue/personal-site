import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/fc-auth";
import {
  getQuestion,
  applyEloUpdate,
  logAnswer,
  todayEst,
} from "@/lib/fc-redis";
import type { FCGameMode } from "@/lib/fc-types";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const {
    question_id,
    game_mode,
    session_id,
    selected,
    ms_to_answer,
  }: {
    question_id: string;
    game_mode: FCGameMode;
    session_id: string;
    selected: "a" | "b" | "c" | "d" | null;
    ms_to_answer: number;
  } = body;

  const q = await getQuestion(question_id);
  if (!q) return NextResponse.json({ ok: false, error: "Unknown question" }, { status: 404 });

  const correct = selected === q.correct;
  const elo = await applyEloUpdate(user.id, q, correct);
  await logAnswer({
    user_id: user.id,
    question_id,
    game_mode,
    session_id,
    selected,
    correct,
    ms_to_answer,
    answered_at: Date.now(),
    category: q.category,
  });
  void todayEst;

  return NextResponse.json({
    ok: true,
    correct,
    correct_answer: q.correct,
    explanation: q.explanation,
    case_cited: q.case_cited,
    new_user_rating: elo.newUserRating,
    new_q_rating: elo.newQRating,
  });
}
