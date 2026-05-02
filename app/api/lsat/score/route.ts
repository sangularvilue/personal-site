import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/lsat-auth";
import { postScore, todayEst } from "@/lib/lsat-redis";
import type { LSATGameMode } from "@/lib/lsat-types";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to post scores." },
      { status: 401 },
    );
  }
  const {
    game,
    skill,
    score,
  }: { game: LSATGameMode; skill: string; score: number } = await req.json();
  if (!game || typeof score !== "number" || score < 0) {
    return NextResponse.json(
      { ok: false, error: "Bad request" },
      { status: 400 },
    );
  }
  await postScore(
    game,
    skill || "all",
    user.id,
    user.display_name,
    Math.round(score),
    todayEst(),
  );
  return NextResponse.json({ ok: true });
}
