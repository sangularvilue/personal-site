#!/usr/bin/env node
// Seed two example Currents (one with 1 Ballad, one with 2) and tag them so the
// teardown script can find and remove just the demo content.
//
//   node --env-file=.env.local scripts/fountain-seed.mjs        # insert demo
//   node --env-file=.env.local scripts/fountain-seed.mjs --undo # remove only the demo entries

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const SEED_TAG = "__fountain_seed__";

const CURRENTS_KEY = "fountain:currents";
const currentKey = (id) => `fountain:current:${id}`;
const currentBalladsKey = (id) => `fountain:current:${id}:ballads`;
const balladKey = (id) => `fountain:ballad:${id}`;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getAllCurrents() {
  const ids = await redis.zrange(CURRENTS_KEY, 0, -1);
  if (!ids.length) return [];
  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.get(currentKey(id));
  const results = await pipeline.exec();
  return results.filter(Boolean).sort((a, b) => a.order - b.order);
}

async function createCurrent(name, openingVerse) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const existing = await getAllCurrents();
  const order = existing.length;
  const current = {
    id,
    slug: slugify(name),
    name,
    openingVerse: openingVerse || "",
    order,
    createdAt: now,
    updatedAt: now,
    [SEED_TAG]: true,
  };
  await redis.set(currentKey(id), current);
  await redis.zadd(CURRENTS_KEY, { score: order, member: id });
  return current;
}

async function createBallad(currentId, title, content) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const siblings = await redis.zrange(currentBalladsKey(currentId), 0, -1);
  const order = siblings.length;
  const ballad = {
    id,
    currentId,
    slug: slugify(title),
    title,
    content: content || "",
    order,
    createdAt: now,
    updatedAt: now,
    [SEED_TAG]: true,
  };
  await redis.set(balladKey(id), ballad);
  await redis.zadd(currentBalladsKey(currentId), { score: order, member: id });
  return ballad;
}

async function seed() {
  const arrival = await createCurrent(
    "Arrival",
    "A short opening verse, set apart from any ballad — it sounds the key of the current."
  );
  await createBallad(
    arrival.id,
    "Donald Mendelson",
    "He arrived on a tuesday with a suitcase full of weather,\nand a name no one in the town had heard before.\nThe wind blew east. The dog watched from the porch.\nThe river kept its counsel, as rivers do."
  );

  const departure = await createCurrent(
    "Departure",
    "Another verse. Departures rhyme with arrivals — but only sometimes, and never exactly."
  );
  await createBallad(
    departure.id,
    "Mira Halloway",
    "She left in march, on the first thaw,\nwith a notebook of names she had not yet earned.\nThe road took her west. The hills did not.\nWhat we keep, we keep by leaving."
  );
  await createBallad(
    departure.id,
    "The Lighthouse Keeper",
    "He kept the light, and the light kept him,\nthrough seventy winters and one quiet spring.\nWhen the boats stopped coming he kept it still,\nfor the boats that had not yet decided to come."
  );

  console.log("Seeded:");
  console.log("  - The Current of Arrival");
  console.log("      The Ballad of Donald Mendelson");
  console.log("  - The Current of Departure");
  console.log("      The Ballad of Mira Halloway");
  console.log("      The Ballad of The Lighthouse Keeper");
}

async function undo() {
  const currentIds = await redis.zrange(CURRENTS_KEY, 0, -1);
  let removed = 0;

  for (const cid of currentIds) {
    const current = await redis.get(currentKey(cid));
    if (!current?.[SEED_TAG]) continue;

    const balladIds = await redis.zrange(currentBalladsKey(cid), 0, -1);
    const pipeline = redis.pipeline();
    for (const bid of balladIds) pipeline.del(balladKey(bid));
    pipeline.del(currentBalladsKey(cid));
    pipeline.del(currentKey(cid));
    pipeline.zrem(CURRENTS_KEY, cid);
    await pipeline.exec();
    removed += 1 + balladIds.length;
  }

  // Re-pack remaining currents' orders so the sequence stays clean
  const remaining = await getAllCurrents();
  const pipeline = redis.pipeline();
  remaining.forEach((c, i) => {
    if (c.order !== i) {
      pipeline.set(currentKey(c.id), { ...c, order: i, updatedAt: Date.now() });
      pipeline.zadd(CURRENTS_KEY, { score: i, member: c.id });
    }
  });
  await pipeline.exec();

  console.log(`Removed ${removed} seed records.`);
}

const mode = process.argv.includes("--undo") ? "undo" : "seed";
if (mode === "seed") await seed();
else await undo();
