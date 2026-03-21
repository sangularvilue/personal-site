import { getRedis } from "./redis";

export interface Craft {
  id: string;
  name: string;
  tag: string;
  desc: string;
  href: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

const CRAFTS_KEY = "crafts:list";
const craftKey = (id: string) => `crafts:item:${id}`;

export async function getAllCrafts(): Promise<Craft[]> {
  const redis = getRedis();
  const ids = await redis.zrange(CRAFTS_KEY, 0, -1);
  if (!ids.length) return [];

  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.get(craftKey(id as string));
  const results = await pipeline.exec();

  return results.filter(Boolean) as Craft[];
}

export async function getCraftById(id: string): Promise<Craft | null> {
  const redis = getRedis();
  return redis.get<Craft>(craftKey(id));
}

export async function createCraft(
  data: Pick<Craft, "name" | "tag" | "desc" | "href"> & { order?: number }
): Promise<Craft> {
  const redis = getRedis();
  const id = crypto.randomUUID();
  const now = Date.now();
  const existing = await getAllCrafts();
  const craft: Craft = {
    id,
    name: data.name,
    tag: data.tag,
    desc: data.desc,
    href: data.href,
    order: data.order ?? existing.length,
    createdAt: now,
    updatedAt: now,
  };
  await redis.set(craftKey(id), craft);
  await redis.zadd(CRAFTS_KEY, { score: craft.order, member: id });
  return craft;
}

export async function updateCraft(
  id: string,
  data: Partial<Pick<Craft, "name" | "tag" | "desc" | "href" | "order">>
): Promise<Craft | null> {
  const redis = getRedis();
  const existing = await redis.get<Craft>(craftKey(id));
  if (!existing) return null;

  const updated: Craft = {
    ...existing,
    ...data,
    updatedAt: Date.now(),
  };
  await redis.set(craftKey(id), updated);
  if (data.order !== undefined) {
    await redis.zadd(CRAFTS_KEY, { score: data.order, member: id });
  }
  return updated;
}

export async function deleteCraft(id: string): Promise<void> {
  const redis = getRedis();
  await redis.del(craftKey(id));
  await redis.zrem(CRAFTS_KEY, id);
}

// Seeds default crafts into Redis if none exist
export async function seedCraftsIfEmpty(): Promise<Craft[]> {
  const existing = await getAllCrafts();
  if (existing.length > 0) return existing;

  const defaults = [
    { name: "ForkLift", tag: "ios · swift", desc: "Workout tracker for iOS. Log sets, reps, and weight with minimal taps. Tracks personal records, visualizes progress over time, and builds routines you can reuse.", href: "https://apps.apple.com/us/app/forklift-workout-tracker/id6760603494" },
    { name: "Connections²", tag: "next.js · react 19", desc: "A new spin on the word puzzle format.", href: "https://connections.grannis.xyz" },
    { name: "Willymarket", tag: "next.js · redis · vercel", desc: "Family prediction exchange. Three market types, real-time order matching, position tracking, and margin calculations.", href: "https://willymarket.grannis.xyz" },
    { name: "Railroad Tiles", tag: "python · fastapi · websockets", desc: "Online multiplayer Railroad Tiles. Real-time tile placement, rotation, scoring, and an in-app rules reference.", href: "https://rrt.grannis.xyz" },
    { name: "Hyper Tic Tac Toe", tag: "firebase · multiplayer", desc: "Ultimate tic tac toe with online multiplayer. Create or join a game and play a friend over the internet.", href: "https://tictactoe.grannis.xyz" },
    { name: "Even Backgammon", tag: "vite · even g2 smart glasses", desc: "Backgammon for the Even G2 smart glasses. Full game logic with AI opponent, rendered on a waveguide display.", href: "https://github.com/sangularvilue/Even-Backgammon" },
    { name: "Waveguide World", tag: "vite · even g2 smart glasses", desc: "Platformer game built for the Even G2 waveguide display. Pixel art, physics, and level design on a heads-up screen.", href: "https://github.com/sangularvilue/Waveguide-World" },
    { name: "Even LotH", tag: "express · even g2 smart glasses", desc: "Liturgy of the Hours on Even G2 smart glasses. Scrapes daily prayers and displays them on the waveguide.", href: "https://github.com/sangularvilue/Even-LotH" },
    { name: "Battleship", tag: "vite · even g2 smart glasses", desc: "Classic Battleship for the Even G2 smart glasses.", href: "https://github.com/sangularvilue/Battleship" },
  ];

  const crafts: Craft[] = [];
  for (let i = 0; i < defaults.length; i++) {
    const craft = await createCraft({ ...defaults[i], order: i });
    crafts.push(craft);
  }
  return crafts;
}
