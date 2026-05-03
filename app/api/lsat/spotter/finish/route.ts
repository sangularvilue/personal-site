import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/lsat-auth";
import {
  getSpotterBest,
  postScore,
  setSpotterBest,
  todayEst,
} from "@/lib/lsat-redis";

// Wrap up a Skill Spotter run. Body: { score }.
// Records personal best and posts to leaderboard.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in." },
      { status: 401 },
    );
  }
  const { score }: { score: number } = await req.json();
  const safe = Math.max(0, Math.round(score));
  await Promise.all([
    setSpotterBest(user.id, safe),
    postScore("spotter", "all", user.id, user.display_name, safe, todayEst()),
  ]);
  const best = await getSpotterBest(user.id);
  return NextResponse.json({ ok: true, best });
}
