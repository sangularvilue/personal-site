import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, todayEst } from "@/lib/fc-redis";
import type { FCGameMode } from "@/lib/fc-types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const game = (sp.get("game") || "speed-drill") as FCGameMode;
  const category = sp.get("category") || "all";
  const window = sp.get("window") || "all"; // 'all' | 'd:YYYY-MM-DD' | 'w:YYYY-Www'
  const win = window === "today" ? `d:${todayEst()}` : window;
  const rows = await getLeaderboard(game, category, win, 50);
  return NextResponse.json({ rows });
}
