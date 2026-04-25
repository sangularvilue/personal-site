import { NextResponse } from "next/server";
import { getAllRuleIds, getRule } from "@/lib/fc-redis";

export async function GET() {
  const ids = await getAllRuleIds();
  const rules = await Promise.all(ids.map((id) => getRule(id)));
  return NextResponse.json({ rules: rules.filter(Boolean) });
}
