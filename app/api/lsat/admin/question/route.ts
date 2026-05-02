import { NextRequest, NextResponse } from "next/server";
import { currentUser, isAdminUser } from "@/lib/lsat-auth";
import {
  getQuestion,
  updateQuestionContent,
} from "@/lib/lsat-redis";
import type {
  LSATAnswerLetter,
  LSATSkill,
} from "@/lib/lsat-types";
import { LSAT_SKILLS, LSAT_LETTERS } from "@/lib/lsat-types";

// GET /api/lsat/admin/question?id=...   -> full question record incl. correct
// POST /api/lsat/admin/question         -> { id, ...patch fields }
// Admin-gated: only the willg account.

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing id" },
      { status: 400 },
    );
  }
  const q = await getQuestion(id);
  if (!q) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, question: q });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  const body = await req.json();
  const id = String(body.id || "");
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing id" },
      { status: 400 },
    );
  }
  const patch: Parameters<typeof updateQuestionContent>[1] = {};
  if (typeof body.stem === "string") patch.stem = body.stem;
  for (const letter of LSAT_LETTERS) {
    const k = `choice_${letter}` as const;
    if (typeof body[k] === "string") patch[k] = body[k];
  }
  if (typeof body.correct === "string") {
    const c = body.correct.toLowerCase();
    if (!LSAT_LETTERS.includes(c as LSATAnswerLetter)) {
      return NextResponse.json(
        { ok: false, error: "correct must be a-e" },
        { status: 400 },
      );
    }
    patch.correct = c as LSATAnswerLetter;
  }
  if (typeof body.skill === "string") {
    if (!LSAT_SKILLS.includes(body.skill as LSATSkill)) {
      return NextResponse.json(
        { ok: false, error: "Unknown skill tag" },
        { status: 400 },
      );
    }
    patch.skill = body.skill as LSATSkill;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }
  await updateQuestionContent(id, patch);
  const updated = await getQuestion(id);
  return NextResponse.json({ ok: true, question: updated });
}
