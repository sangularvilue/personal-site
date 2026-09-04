import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
type BoardRow = { name: string; score: number };
const boardKey = () => `then-there:leaderboard:${new Date().toISOString().slice(0, 10)}`;
const fallback: BoardRow[] = [{ name: "atlas_finch", score: 2468 }, { name: "yearzero", score: 2312 }, { name: "cicero_7", score: 2190 }];
async function readBoard() { const rows = await getRedis().get<BoardRow[]>(boardKey()); return Array.isArray(rows) && rows.length ? rows : fallback; }
export async function GET() { try { return NextResponse.json({ scores: await readBoard() }); } catch { return NextResponse.json({ scores: fallback }); } }
export async function POST(request: Request) {
  try {
    const body = await request.json(), name = String(body.name || "").trim().replace(/[^a-zA-Z0-9 _.-]/g, "").slice(0, 18), score = Math.max(0, Math.min(3000, Math.round(Number(body.score))));
    if (!name || !Number.isFinite(score)) return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    const rows = [...await readBoard(), { name, score }].sort((a, b) => b.score - a.score).slice(0, 20);
    await getRedis().set(boardKey(), rows, { ex: 259200 }); return NextResponse.json({ scores: rows });
  } catch { return NextResponse.json({ error: "Could not post score" }, { status: 500 }); }
}
