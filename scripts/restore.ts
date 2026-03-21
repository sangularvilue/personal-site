/**
 * Restore all posts and crafts from local JSON backup into Redis.
 * This will overwrite any existing data with the same IDs.
 *
 * Usage:
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... npx tsx scripts/restore.ts
 *
 * Or with .env.local:
 *   npx tsx --env-file=.env.local scripts/restore.ts
 */

import { Redis } from "@upstash/redis";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const POSTS_KEY = "blog:posts";
const CRAFTS_KEY = "crafts:list";
const postKey = (id: string) => `blog:post:${id}`;
const craftKey = (id: string) => `crafts:item:${id}`;

const BACKUP_DIR = join(__dirname, "..", "content", "backup");

interface Post {
  id: string;
  createdAt: number;
  [key: string]: unknown;
}

interface Craft {
  id: string;
  order: number;
  [key: string]: unknown;
}

async function main() {
  // Restore posts
  const postsPath = join(BACKUP_DIR, "posts.json");
  if (existsSync(postsPath)) {
    const posts: Post[] = JSON.parse(readFileSync(postsPath, "utf-8"));
    for (const post of posts) {
      await redis.set(postKey(post.id), post);
      await redis.zadd(POSTS_KEY, { score: post.createdAt, member: post.id });
    }
    console.log(`Restored ${posts.length} posts`);
  } else {
    console.log("No posts backup found, skipping");
  }

  // Restore crafts
  const craftsPath = join(BACKUP_DIR, "crafts.json");
  if (existsSync(craftsPath)) {
    const crafts: Craft[] = JSON.parse(readFileSync(craftsPath, "utf-8"));
    for (const craft of crafts) {
      await redis.set(craftKey(craft.id), craft);
      await redis.zadd(CRAFTS_KEY, { score: craft.order, member: craft.id });
    }
    console.log(`Restored ${crafts.length} crafts`);
  } else {
    console.log("No crafts backup found, skipping");
  }

  console.log("\nDone.");
}

main().catch(console.error);
