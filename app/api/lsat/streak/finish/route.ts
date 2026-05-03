import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/lsat-auth";
import {
  getStreakBest,
  postScore,
  setStreakBest,
  todayEst,
} from "@/lib/lsat-redis";

// Wrap up a Streak run. Body: { length }.
// Records personal best longest correct chain and posts to the leaderboard.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in." },
      { status: 401 },
    );
  }
  const { length }: { length: number } = await req.json();
  const safe = Math.max(0, Math.round(length));
  await Promise.all([
    setStreakBest(user.id, safe),
    postScore("streak", "all", user.id, user.display_name, safe, todayEst()),
  ]);
  const best = await getStreakBest(user.id);
  return NextResponse.json({ ok: true, best });
}
