import { getRedis } from "./redis";

export interface Current {
  id: string;
  slug: string;
  name: string;
  openingVerse: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Ballad {
  id: string;
  currentId: string;
  slug: string;
  title: string;
  content: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

const CURRENTS_KEY = "fountain:currents";
const currentKey = (id: string) => `fountain:current:${id}`;
const currentBalladsKey = (id: string) => `fountain:current:${id}:ballads`;
const balladKey = (id: string) => `fountain:ballad:${id}`;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getAllCurrents(): Promise<Current[]> {
  const redis = getRedis();
  const ids = await redis.zrange(CURRENTS_KEY, 0, -1);
  if (!ids.length) return [];
  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.get(currentKey(id as string));
  const results = await pipeline.exec();
  return (results.filter(Boolean) as Current[]).sort((a, b) => a.order - b.order);
}

export async function getCurrentById(id: string): Promise<Current | null> {
  const redis = getRedis();
  return redis.get<Current>(currentKey(id));
}

export async function getCurrentBySlug(slug: string): Promise<Current | null> {
  const currents = await getAllCurrents();
  return currents.find((c) => c.slug === slug) ?? null;
}

export async function getBalladsByCurrentId(currentId: string): Promise<Ballad[]> {
  const redis = getRedis();
  const ids = await redis.zrange(currentBalladsKey(currentId), 0, -1);
  if (!ids.length) return [];
  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.get(balladKey(id as string));
  const results = await pipeline.exec();
  return (results.filter(Boolean) as Ballad[]).sort((a, b) => a.order - b.order);
}

export async function getBalladById(id: string): Promise<Ballad | null> {
  const redis = getRedis();
  return redis.get<Ballad>(balladKey(id));
}

export async function getBalladBySlug(
  slug: string
): Promise<{ ballad: Ballad; current: Current } | null> {
  const currents = await getAllCurrents();
  for (const current of currents) {
    const ballads = await getBalladsByCurrentId(current.id);
    const ballad = ballads.find((b) => b.slug === slug);
    if (ballad) return { ballad, current };
  }
  return null;
}

export async function getAllBallads(): Promise<Ballad[]> {
  const currents = await getAllCurrents();
  const all: Ballad[] = [];
  for (const c of currents) {
    const ballads = await getBalladsByCurrentId(c.id);
    all.push(...ballads);
  }
  return all;
}

export async function getFountainTree(): Promise<
  Array<Current & { ballads: Ballad[] }>
> {
  const currents = await getAllCurrents();
  const tree = await Promise.all(
    currents.map(async (c) => ({
      ...c,
      ballads: await getBalladsByCurrentId(c.id),
    }))
  );
  return tree;
}

export async function createCurrent(
  data: Pick<Current, "name" | "openingVerse">
): Promise<Current> {
  const redis = getRedis();
  const id = crypto.randomUUID();
  const now = Date.now();
  const existing = await getAllCurrents();
  const order = existing.length;
  const current: Current = {
    id,
    slug: slugify(data.name),
    name: data.name,
    openingVerse: data.openingVerse || "",
    order,
    createdAt: now,
    updatedAt: now,
  };
  await redis.set(currentKey(id), current);
  await redis.zadd(CURRENTS_KEY, { score: order, member: id });
  return current;
}

export async function updateCurrent(
  id: string,
  data: Partial<Pick<Current, "name" | "openingVerse">>
): Promise<Current | null> {
  const redis = getRedis();
  const existing = await redis.get<Current>(currentKey(id));
  if (!existing) return null;
  const updated: Current = {
    ...existing,
    ...data,
    slug: data.name ? slugify(data.name) : existing.slug,
    updatedAt: Date.now(),
  };
  await redis.set(currentKey(id), updated);
  return updated;
}

export async function deleteCurrent(id: string): Promise<void> {
  const redis = getRedis();
  const ballads = await getBalladsByCurrentId(id);
  const pipeline = redis.pipeline();
  for (const b of ballads) pipeline.del(balladKey(b.id));
  pipeline.del(currentBalladsKey(id));
  pipeline.del(currentKey(id));
  pipeline.zrem(CURRENTS_KEY, id);
  await pipeline.exec();
  await renumberCurrents();
}

async function renumberCurrents(): Promise<void> {
  const redis = getRedis();
  const currents = await getAllCurrents();
  const pipeline = redis.pipeline();
  currents.forEach((c, i) => {
    if (c.order !== i) {
      const updated = { ...c, order: i, updatedAt: Date.now() };
      pipeline.set(currentKey(c.id), updated);
      pipeline.zadd(CURRENTS_KEY, { score: i, member: c.id });
    }
  });
  await pipeline.exec();
}

async function renumberBallads(currentId: string): Promise<void> {
  const redis = getRedis();
  const ballads = await getBalladsByCurrentId(currentId);
  const pipeline = redis.pipeline();
  ballads.forEach((b, i) => {
    if (b.order !== i) {
      const updated = { ...b, order: i, updatedAt: Date.now() };
      pipeline.set(balladKey(b.id), updated);
      pipeline.zadd(currentBalladsKey(currentId), { score: i, member: b.id });
    }
  });
  await pipeline.exec();
}

export async function moveCurrent(
  id: string,
  direction: "up" | "down"
): Promise<void> {
  const redis = getRedis();
  const currents = await getAllCurrents();
  const idx = currents.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= currents.length) return;
  const a = currents[idx];
  const b = currents[swap];
  const now = Date.now();
  const aUpdated = { ...a, order: b.order, updatedAt: now };
  const bUpdated = { ...b, order: a.order, updatedAt: now };
  const pipeline = redis.pipeline();
  pipeline.set(currentKey(a.id), aUpdated);
  pipeline.set(currentKey(b.id), bUpdated);
  pipeline.zadd(CURRENTS_KEY, { score: aUpdated.order, member: a.id });
  pipeline.zadd(CURRENTS_KEY, { score: bUpdated.order, member: b.id });
  await pipeline.exec();
}

export async function createBallad(
  data: Pick<Ballad, "currentId" | "title" | "content">
): Promise<Ballad | null> {
  const redis = getRedis();
  const current = await getCurrentById(data.currentId);
  if (!current) return null;
  const id = crypto.randomUUID();
  const now = Date.now();
  const existing = await getBalladsByCurrentId(data.currentId);
  const order = existing.length;
  const ballad: Ballad = {
    id,
    currentId: data.currentId,
    slug: slugify(data.title),
    title: data.title,
    content: data.content || "",
    order,
    createdAt: now,
    updatedAt: now,
  };
  await redis.set(balladKey(id), ballad);
  await redis.zadd(currentBalladsKey(data.currentId), {
    score: order,
    member: id,
  });
  return ballad;
}

export async function updateBallad(
  id: string,
  data: Partial<Pick<Ballad, "title" | "content" | "currentId">>
): Promise<Ballad | null> {
  const redis = getRedis();
  const existing = await redis.get<Ballad>(balladKey(id));
  if (!existing) return null;

  const movingCurrent =
    data.currentId !== undefined && data.currentId !== existing.currentId;

  let order = existing.order;
  if (movingCurrent) {
    await redis.zrem(currentBalladsKey(existing.currentId), id);
    const siblings = await getBalladsByCurrentId(data.currentId!);
    order = siblings.length;
    await redis.zadd(currentBalladsKey(data.currentId!), {
      score: order,
      member: id,
    });
  }

  const updated: Ballad = {
    ...existing,
    ...data,
    slug: data.title ? slugify(data.title) : existing.slug,
    order,
    updatedAt: Date.now(),
  };
  await redis.set(balladKey(id), updated);
  if (movingCurrent) {
    await renumberBallads(existing.currentId);
  }
  return updated;
}

export async function deleteBallad(id: string): Promise<void> {
  const redis = getRedis();
  const existing = await redis.get<Ballad>(balladKey(id));
  if (!existing) return;
  await redis.del(balladKey(id));
  await redis.zrem(currentBalladsKey(existing.currentId), id);
  await renumberBallads(existing.currentId);
}

export async function moveBallad(
  id: string,
  direction: "up" | "down"
): Promise<void> {
  const redis = getRedis();
  const existing = await redis.get<Ballad>(balladKey(id));
  if (!existing) return;
  const ballads = await getBalladsByCurrentId(existing.currentId);
  const idx = ballads.findIndex((b) => b.id === id);
  if (idx < 0) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= ballads.length) return;
  const a = ballads[idx];
  const b = ballads[swap];
  const now = Date.now();
  const aUpdated = { ...a, order: b.order, updatedAt: now };
  const bUpdated = { ...b, order: a.order, updatedAt: now };
  const pipeline = redis.pipeline();
  pipeline.set(balladKey(a.id), aUpdated);
  pipeline.set(balladKey(b.id), bUpdated);
  pipeline.zadd(currentBalladsKey(existing.currentId), {
    score: aUpdated.order,
    member: a.id,
  });
  pipeline.zadd(currentBalladsKey(existing.currentId), {
    score: bUpdated.order,
    member: b.id,
  });
  await pipeline.exec();
}
