import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/fc-auth";
import { postScore, todayEst } from "@/lib/fc-redis";
import type { FCGameMode } from "@/lib/fc-types";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const { game, category, score }: { game: FCGameMode; category: string; score: number } =
    await req.json();
  if (!game || typeof score !== "number") {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  const date = todayEst();
  await postScore(game, category || "all", user.id, user.display_name, score, date);
  return NextResponse.json({ ok: true });
}
