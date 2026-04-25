import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/fc-auth";
import { upsertQuestion } from "@/lib/fc-redis";
import type { FCQuestion } from "@/lib/fc-types";

const ADMIN_USERNAMES = (process.env.FC_ADMINS || "will,maddie").split(",");

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user || !ADMIN_USERNAMES.includes(user.username.toLowerCase())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const q: FCQuestion = {
    id: body.id,
    category: body.category,
    difficulty: parseInt(body.difficulty, 10),
    rating: 1000,
    num_answered: 0,
    stem: body.stem,
    opt_a: body.opt_a, opt_b: body.opt_b, opt_c: body.opt_c, opt_d: body.opt_d,
    correct: body.correct,
    case_cited: body.case || undefined,
    rule_id: body.rule_id || undefined,
    prong: body.prong || undefined,
    explanation: body.explanation,
    tags: body.tags ? body.tags.split(";").map((t: string) => t.trim()).filter(Boolean) : [],
    daily_eligible: !!body.daily_eligible,
  };
  await upsertQuestion(q);
  return NextResponse.json({ ok: true });
}
