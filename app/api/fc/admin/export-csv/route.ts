import { NextResponse } from "next/server";
import { currentUser } from "@/lib/fc-auth";
import { FC_CATEGORIES } from "@/lib/fc-types";
import { getQuestionIdsByCategory, getQuestionsByIds } from "@/lib/fc-redis";

const ADMIN_USERNAMES = (process.env.FC_ADMINS || "will,maddie").split(",");

function csvEscape(s: string): string {
  if (s == null) return "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET() {
  const user = await currentUser();
  if (!user || !ADMIN_USERNAMES.includes(user.username.toLowerCase())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const allIds: string[] = [];
  for (const c of FC_CATEGORIES) allIds.push(...(await getQuestionIdsByCategory(c)));
  const all = await getQuestionsByIds(allIds);
  const headers = "id,category,difficulty,stem,opt_a,opt_b,opt_c,opt_d,correct,case,rule_id,prong,explanation,tags,daily_eligible";
  const rows = all.map((q) =>
    [
      q.id, q.category, String(q.difficulty),
      csvEscape(q.stem),
      csvEscape(q.opt_a), csvEscape(q.opt_b), csvEscape(q.opt_c), csvEscape(q.opt_d),
      q.correct, csvEscape(q.case_cited || ""), q.rule_id || "", q.prong || "",
      csvEscape(q.explanation),
      csvEscape(q.tags.join(";")),
      q.daily_eligible ? "true" : "false",
    ].join(","),
  );
  const csv = [headers, ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="fedcourts-questions-${Date.now()}.csv"`,
    },
  });
}
