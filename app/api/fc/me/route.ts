import { NextResponse } from "next/server";
import { currentUser } from "@/lib/fc-auth";
import { getUserRatings } from "@/lib/fc-redis";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const ratings = await getUserRatings(user.id);
  return NextResponse.json({ ok: true, user, ratings });
}
