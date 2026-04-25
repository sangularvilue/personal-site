import { NextRequest, NextResponse } from "next/server";
import { getAllCaseIds, getCase } from "@/lib/fc-redis";

export async function GET(req: NextRequest) {
  const withHolding = req.nextUrl.searchParams.get("withHolding") === "1";
  const ids = await getAllCaseIds();
  const cases = await Promise.all(ids.map((id) => getCase(id)));
  const out = cases
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .map((c) =>
      withHolding
        ? { id: c.id, name: c.name, holding: c.holding }
        : { id: c.id, name: c.name },
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ cases: out });
}
