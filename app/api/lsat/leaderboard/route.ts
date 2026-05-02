import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, todayEst } from "@/lib/lsat-redis";
import type { LSATGameMode } from "@/lib/lsat-types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const game = (sp.get("game") || "drill") as LSATGameMode;
  const skill = sp.get("skill") || "all";
  const window = sp.get("window") || "all";
  const w =
    window === "daily"
      ? `d:${todayEst()}`
      : window === "weekly"
        ? `w:${weekKey(todayEst())}`
        : "all";
  const limit = Math.min(100, parseInt(sp.get("limit") || "25", 10));
  const rows = await getLeaderboard(game, skill, w, limit);
  return NextResponse.json({ ok: true, rows });
}

function weekKey(dateEst: string): string {
  const d = new Date(dateEst + "T00:00:00-05:00");
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
  );
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
