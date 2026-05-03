import { NextRequest, NextResponse } from "next/server";
import { currentUser, isAdminUser } from "@/lib/lsat-auth";
import { getPassageText, setPassageText } from "@/lib/lsat-redis";

// GET /api/lsat/admin/passage?id=<passage_id>
//   → { ok, passage_id, text }
// POST /api/lsat/admin/passage  body { passage_id, text }
//   → { ok, passage_id }
//
// Both gated to the willg admin account.

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing id" },
      { status: 400 },
    );
  }
  const text = await getPassageText(id);
  return NextResponse.json({
    ok: true,
    passage_id: id,
    text: text ?? "",
    found: text !== null,
  });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  const body = await req.json();
  const id = String(body.passage_id || "");
  const text = typeof body.text === "string" ? body.text : "";
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing passage_id" },
      { status: 400 },
    );
  }
  if (!text.trim()) {
    return NextResponse.json(
      { ok: false, error: "Passage text cannot be empty" },
      { status: 400 },
    );
  }
  await setPassageText(id, text);
  return NextResponse.json({ ok: true, passage_id: id });
}
