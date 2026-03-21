import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAllCrafts, createCraft } from "@/lib/crafts";

export async function GET() {
  const crafts = await getAllCrafts();
  return NextResponse.json(crafts);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await request.json();
  const craft = await createCraft(data);
  return NextResponse.json(craft);
}
