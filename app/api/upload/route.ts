import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { jwtVerify } from "jose";

export const runtime = "edge";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_SECRET || "change-me-in-production"
);

export async function POST(request: NextRequest) {
  // Auth
  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No auth cookie" }, { status: 401 });
  }
  try {
    await jwtVerify(token, SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const filename = request.headers.get("x-filename") || "upload";
  const contentType = request.headers.get("content-type") || "image/png";

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN not set" },
      { status: 500 }
    );
  }

  if (!request.body) {
    return NextResponse.json({ error: "No body" }, { status: 400 });
  }

  try {
    const blob = await put(filename, request.body, {
      access: "public",
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? `${err.name}: ${err.message}`
        : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
