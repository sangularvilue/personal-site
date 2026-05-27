import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createBallad, getAllBallads } from "@/lib/fountain";

export async function GET() {
  const ballads = await getAllBallads();
  return NextResponse.json(ballads);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await request.json();
  if (!data.title || !data.currentId) {
    return NextResponse.json(
      { error: "Title and currentId required" },
      { status: 400 }
    );
  }
  const ballad = await createBallad({
    title: data.title,
    currentId: data.currentId,
    content: data.content || "",
  });
  if (!ballad) {
    return NextResponse.json({ error: "Current not found" }, { status: 404 });
  }
  return NextResponse.json(ballad);
}
