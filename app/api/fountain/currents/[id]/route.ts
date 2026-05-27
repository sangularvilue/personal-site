import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  deleteCurrent,
  getCurrentById,
  moveCurrent,
  updateCurrent,
} from "@/lib/fountain";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const current = await getCurrentById(id);
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(current);
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
    await moveCurrent(id, data.move);
    const updated = await getCurrentById(id);
    return NextResponse.json(updated);
  }
  const current = await updateCurrent(id, {
    name: data.name,
    openingVerse: data.openingVerse,
  });
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(current);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteCurrent(id);
  return NextResponse.json({ ok: true });
}
