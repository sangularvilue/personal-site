import { NextRequest, NextResponse } from "next/server";
import type { HistoryRun } from "@/app/thenthere/game";
import { getRedis } from "@/lib/redis";

const PLAYER_COOKIE = "then-there-player";

export async function GET(request: NextRequest) {
  const id = request.cookies.get(PLAYER_COOKIE)?.value;
  if (!id) return NextResponse.json({ runs: [] });
  try {
    const runs = await getRedis().get<HistoryRun[]>(`then-there:history:${id}`);
    return NextResponse.json({ runs: Array.isArray(runs) ? runs : [] });
  } catch {
    return NextResponse.json({ runs: [] });
  }
}
