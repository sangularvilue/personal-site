/**
 * Export all posts and crafts from Redis to local JSON files.
 *
 * Usage:
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... npx tsx scripts/backup.ts
 *
 * Or with .env.local:
 *   npx tsx --env-file=.env.local scripts/backup.ts
 */

import { Redis } from "@upstash/redis";
import { writeFileSync, mkdirSync } from "fs";
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

async function main() {
  mkdirSync(BACKUP_DIR, { recursive: true });

  // Export posts
  const postIds = await redis.zrange(POSTS_KEY, 0, -1, { rev: true });
  const posts = [];
  for (const id of postIds) {
    const post = await redis.get(postKey(id as string));
    if (post) posts.push(post);
  }
  const postsPath = join(BACKUP_DIR, "posts.json");
  writeFileSync(postsPath, JSON.stringify(posts, null, 2));
  console.log(`Backed up ${posts.length} posts → ${postsPath}`);

  // Export crafts
  const craftIds = await redis.zrange(CRAFTS_KEY, 0, -1);
  const crafts = [];
  for (const id of craftIds) {
    const craft = await redis.get(craftKey(id as string));
    if (craft) crafts.push(craft);
  }
  const craftsPath = join(BACKUP_DIR, "crafts.json");
  writeFileSync(craftsPath, JSON.stringify(crafts, null, 2));
  console.log(`Backed up ${crafts.length} crafts → ${craftsPath}`);

  console.log("\nDone. Commit the backup files to git to preserve them.");
}

main().catch(console.error);
