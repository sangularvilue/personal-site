import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/fc-auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }
  const r = await login(username, password);
  return NextResponse.json(r);
}
