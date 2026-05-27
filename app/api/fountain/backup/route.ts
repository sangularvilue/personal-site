import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { exportFountain, replaceFountain } from "@/lib/fountain";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const backup = await exportFountain();
  const filename = `fountain-backup-${new Date(backup.exportedAt)
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let backup;
  try {
    backup = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    await replaceFountain(backup);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Restore failed" },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
