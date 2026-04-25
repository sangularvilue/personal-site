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
    shuffle_key,
    ms_to_answer,
  }: {
    question_id: string;
    game_mode: FCGameMode;
    session_id: string;
    selected: "a" | "b" | "c" | "d" | null;
    shuffle_key?: string;
    ms_to_answer: number;
  } = body;

  const q = await getQuestion(question_id);
  if (!q) return NextResponse.json({ ok: false, error: "Unknown question" }, { status: 404 });

  // Map the user's display-position pick back to the canonical letter.
  let canonicalSelected: "a" | "b" | "c" | "d" | null = selected;
  if (selected && shuffle_key && /^[abcd]{4}$/.test(shuffle_key)) {
    const posIdx = "abcd".indexOf(selected);
    canonicalSelected = shuffle_key[posIdx] as "a" | "b" | "c" | "d";
  }
  const correct = canonicalSelected === q.correct;
  // Compute display-letter for the correct answer so the client can highlight it.
  const correctDisplayLetter = shuffle_key && /^[abcd]{4}$/.test(shuffle_key)
    ? (["a", "b", "c", "d"] as const)[shuffle_key.indexOf(q.correct)]
    : q.correct;
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
    correct_answer: correctDisplayLetter,
    explanation: q.explanation,
    case_cited: q.case_cited,
    new_user_rating: elo.newUserRating,
    new_q_rating: elo.newQRating,
  });
}
