import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_SECRET || "change-me-in-production"
);

// Returns a signed upload token that the client uses to upload directly to Blob
export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No auth cookie" }, { status: 401 });
  }
  try {
    await jwtVerify(token, SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Just return the blob token — client uploads directly to Vercel Blob
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN not set" },
      { status: 500 }
    );
  }

  return NextResponse.json({ token: blobToken });
}
