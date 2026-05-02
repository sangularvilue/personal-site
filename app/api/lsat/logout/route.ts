import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/lsat-auth";

export async function POST(req: NextRequest) {
  await logout();
  // Redirect back to the same origin's root, preserving subdomain in prod.
  return NextResponse.redirect(new URL("/", req.url));
}
