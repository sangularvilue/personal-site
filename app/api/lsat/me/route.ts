import { NextResponse } from "next/server";
import { currentUser, isAdminUser } from "@/lib/lsat-auth";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json({
    ok: true,
    user,
    is_admin: isAdminUser(user),
  });
}
