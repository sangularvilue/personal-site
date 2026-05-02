import { NextRequest, NextResponse } from "next/server";
import { signup } from "@/lib/lsat-auth";

export async function POST(req: NextRequest) {
  const { username, password, display_name } = await req.json();
  if (!username || !password || !display_name) {
    return NextResponse.json(
      { ok: false, error: "Missing fields" },
      { status: 400 },
    );
  }
  const r = await signup(username, password, display_name);
  return NextResponse.json(r);
}
