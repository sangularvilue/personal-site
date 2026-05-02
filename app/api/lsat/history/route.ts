import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/lsat-auth";
import {
  getQuestionAttemptsForUser,
  getUserAttempts,
} from "@/lib/lsat-redis";

// GET /api/lsat/history          -> recent attempts
// GET /api/lsat/history?qid=...  -> all attempts for one question
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to view history." },
      { status: 401 },
    );
  }
  const qid = req.nextUrl.searchParams.get("qid");
  if (qid) {
    const attempts = await getQuestionAttemptsForUser(user.id, qid);
    return NextResponse.json({ ok: true, attempts });
  }
  const limit = Math.min(
    500,
    parseInt(req.nextUrl.searchParams.get("limit") || "100", 10),
  );
  const attempts = await getUserAttempts(user.id, limit);
  return NextResponse.json({ ok: true, attempts });
}
