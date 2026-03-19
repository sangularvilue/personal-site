import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filename = request.headers.get("x-filename") || "upload";
    const contentType = request.headers.get("content-type") || "image/png";

    const blob = await put(filename, request.body!, {
      access: "public",
      contentType,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
