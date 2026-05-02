import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/lsat-auth";
import {
  applyEloUpdate,
  getQuestion,
  logAttempt,
} from "@/lib/lsat-redis";
import type {
  LSATAnswerLetter,
  LSATGameMode,
} from "@/lib/lsat-types";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to record answers." },
      { status: 401 },
    );
  }

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
    game_mode: LSATGameMode;
    session_id: string;
    selected: LSATAnswerLetter | null;
    shuffle_key?: string;
    ms_to_answer: number;
  } = body;

  const q = await getQuestion(question_id);
  if (!q) {
    return NextResponse.json(
      { ok: false, error: "Unknown question" },
      { status: 404 },
    );
  }

  // Map the displayed-position pick back to canonical letter via the
  // shuffle key issued by /questions.
  let canonicalSelected: LSATAnswerLetter | null = selected;
  if (selected && shuffle_key && /^[abcde]{5}$/.test(shuffle_key)) {
    const posIdx = "abcde".indexOf(selected);
    canonicalSelected = shuffle_key[posIdx] as LSATAnswerLetter;
  }
  const correct = canonicalSelected === q.correct;
  const correctDisplayLetter: LSATAnswerLetter =
    shuffle_key && /^[abcde]{5}$/.test(shuffle_key)
      ? (["a", "b", "c", "d", "e"][shuffle_key.indexOf(q.correct)] as LSATAnswerLetter)
      : q.correct;

  const elo = await applyEloUpdate(user.id, q, correct);
  await logAttempt(user.id, {
    question_id,
    selected,
    correct,
    ms_to_answer,
    answered_at: Date.now(),
    game_mode,
    session_id,
    skill: q.skill,
    shuffle_key,
  });

  return NextResponse.json({
    ok: true,
    correct,
    correct_answer: correctDisplayLetter,
    correct_canonical: q.correct,
    skill: q.skill,
    new_user_rating: elo.newUserRating,
    new_q_rating: elo.newQRating,
  });
}
