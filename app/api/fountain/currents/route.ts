import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createCurrent, getAllCurrents } from "@/lib/fountain";

export async function GET() {
  const currents = await getAllCurrents();
  return NextResponse.json(currents);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await request.json();
  if (!data.name || typeof data.name !== "string") {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const current = await createCurrent({
    name: data.name,
    openingVerse: data.openingVerse || "",
  });
  return NextResponse.json(current);
}
