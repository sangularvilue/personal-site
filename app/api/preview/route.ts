import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { renderMarkdown } from "@/lib/markdown";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { content } = await request.json();
  const html = await renderMarkdown(content);
  return NextResponse.json({ html });
}
