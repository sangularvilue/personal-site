import { NextResponse } from "next/server";
import { logout } from "@/lib/fc-auth";

export async function POST() {
  await logout();
  return NextResponse.redirect(new URL("/", "https://fedcourts.grannis.xyz"));
}
