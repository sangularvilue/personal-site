import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCraftById, updateCraft, deleteCraft } from "@/lib/crafts";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const craft = await getCraftById(id);
  if (!craft) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(craft);
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
  const craft = await updateCraft(id, data);
  if (!craft) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(craft);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteCraft(id);
  return NextResponse.json({ ok: true });
}
