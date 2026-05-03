import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/lsat-auth";
import {
  getQuestion,
  logSpotterAttempt,
  setSpotterBest,
} from "@/lib/lsat-redis";
import { LSAT_SKILLS, type LSATSkill } from "@/lib/lsat-types";

// POST /api/lsat/spotter/submit
// Body: { question_id, predicted, ms_to_answer, session_id }
// Returns: { ok, correct, actual }
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
    predicted,
    ms_to_answer,
    session_id,
  }: {
    question_id: string;
    predicted: LSATSkill;
    ms_to_answer: number;
    session_id: string;
  } = body;

  if (!LSAT_SKILLS.includes(predicted)) {
    return NextResponse.json(
      { ok: false, error: "Bad skill" },
      { status: 400 },
    );
  }
  const q = await getQuestion(question_id);
  if (!q) {
    return NextResponse.json(
      { ok: false, error: "Unknown question" },
      { status: 404 },
    );
  }
  const correct = q.skill === predicted;
  await logSpotterAttempt(user.id, {
    question_id,
    predicted,
    actual: q.skill,
    correct,
    ms_to_answer,
    answered_at: Date.now(),
    session_id,
  });
  return NextResponse.json({ ok: true, correct, actual: q.skill });
}
