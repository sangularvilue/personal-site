import { getRedis } from "./redis";

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

const POSTS_KEY = "blog:posts";
const postKey = (id: string) => `blog:post:${id}`;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getAllPosts(includeUnpublished = false): Promise<Post[]> {
  const redis = getRedis();
  const ids = await redis.zrange(POSTS_KEY, 0, -1, { rev: true });
  if (!ids.length) return [];

  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.get(postKey(id as string));
  const results = await pipeline.exec();

  const posts = results.filter(Boolean) as Post[];
  return includeUnpublished ? posts : posts.filter((p) => p.published);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getPostById(id: string): Promise<Post | null> {
  const redis = getRedis();
  return redis.get<Post>(postKey(id));
}

export async function createPost(
  data: Pick<Post, "title" | "content" | "excerpt" | "coverImage" | "tags" | "published">
): Promise<Post> {
  const redis = getRedis();
  const id = crypto.randomUUID();
  const now = Date.now();
  const post: Post = {
    id,
    slug: slugify(data.title),
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    coverImage: data.coverImage || "",
    tags: data.tags,
    published: data.published,
    createdAt: now,
    updatedAt: now,
  };
  await redis.set(postKey(id), post);
  await redis.zadd(POSTS_KEY, { score: now, member: id });
  return post;
}

export async function updatePost(
  id: string,
  data: Partial<Pick<Post, "title" | "content" | "excerpt" | "coverImage" | "tags" | "published">>
): Promise<Post | null> {
  const redis = getRedis();
  const existing = await redis.get<Post>(postKey(id));
  if (!existing) return null;

  const updated: Post = {
    ...existing,
    ...data,
    slug: data.title ? slugify(data.title) : existing.slug,
    updatedAt: Date.now(),
  };
  await redis.set(postKey(id), updated);
  return updated;
}

export async function deletePost(id: string): Promise<void> {
  const redis = getRedis();
  await redis.del(postKey(id));
  await redis.zrem(POSTS_KEY, id);
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const posts = await getAllPosts();
  const counts: Record<string, number> = {};
  for (const post of posts) {
    for (const tag of post.tags) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
