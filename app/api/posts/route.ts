import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAllPosts, createPost } from "@/lib/posts";

export async function GET() {
  const posts = await getAllPosts(true);
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await request.json();
  const post = await createPost(data);
  return NextResponse.json(post);
}
