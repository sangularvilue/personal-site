import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { jwtVerify } from "jose";

export const runtime = "edge";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_SECRET || "change-me-in-production"
);

export async function POST(request: NextRequest) {
  // Auth: read cookie directly from request (edge runtime can't use next/headers cookies())
  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await jwtVerify(token, SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
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
