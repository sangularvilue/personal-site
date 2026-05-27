import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  deleteBallad,
  getBalladById,
  moveBallad,
  updateBallad,
} from "@/lib/fountain";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ballad = await getBalladById(id);
  if (!ballad) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(ballad);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const data = await request.json();
  if (data.move === "up" || data.move === "down") {
    await moveBallad(id, data.move);
    const updated = await getBalladById(id);
    return NextResponse.json(updated);
  }
  const ballad = await updateBallad(id, {
    title: data.title,
    content: data.content,
    currentId: data.currentId,
  });
  if (!ballad) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(ballad);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteBallad(id);
  return NextResponse.json({ ok: true });
}
