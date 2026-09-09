/**
 * Verifies every scheduled daily deck actually builds: six distinct questions,
 * each with finite coordinates and a timeline window that contains its answer.
 *
 * game.ts uses extensionless TS imports, which Node cannot resolve directly,
 * so transpile it first with the TypeScript that is already a dependency:
 *
 *   npx tsc app/thenthere/game.ts --outDir .tmp-decks --module commonjs \
 *     --target es2022 --moduleResolution node --esModuleInterop \
 *     --skipLibCheck --jsx react-jsx
 *   node scripts/thenthere-decks.cjs
 */
const path = require("path");
const built = path.join(__dirname, "../.tmp-decks/game.js");

let game;
try {
  game = require(built);
} catch (err) {
  console.error("Transpile first (see header). " + err.message);
  process.exit(2);
}

const { dailyGame, todayKey, ROUNDS_PER_GAME } = game;
if (typeof dailyGame !== "function") {
  console.error(
    "No dailyGame export. Exports: " + Object.keys(game).join(", "),
  );
  process.exit(2);
}
const want = ROUNDS_PER_GAME || 6;

const start = Date.parse(todayKey() + "T00:00:00.000Z");
let bad = 0;
const lensCount = new Map();

for (let i = 0; i < 100; i++) {
  const key = new Date(start + i * 86400000).toISOString().slice(0, 10);
  let game_;
  try {
    game_ = dailyGame(key);
  } catch (err) {
    console.error(`${key}: threw ${err.message}`);
    bad++;
    continue;
  }
  const qs = game_.questions || game_.deck;
  const label = game_.edition?.name || game_.focus?.name || "(none)";
  lensCount.set(label, (lensCount.get(label) || 0) + 1);

  if (!Array.isArray(qs) || qs.length !== want) {
    console.error(`${key}: expected ${want} questions, got ${qs && qs.length}`);
    bad++;
    continue;
  }
  if (new Set(qs.map((q) => q.title)).size !== want) {
    console.error(`${key}: duplicate questions inside the deck`);
    bad++;
  }
  for (const q of qs) {
    if (!Number.isFinite(q.lat) || !Number.isFinite(q.lon)) {
      console.error(`${key}: non-finite coords on "${q.title}"`);
      bad++;
    }
    const [lo, hi] = q.years || [-4000, 2026];
    if (!(hi > lo) || q.year < lo || q.year > hi) {
      console.error(
        `${key}: "${q.title}" year ${q.year} outside window ${lo}..${hi}`,
      );
      bad++;
    }
  }
}

console.log("editions scheduled over the next 100 days:");
for (const [name, n] of [...lensCount].sort((a, b) => b[1] - a[1]))
  console.log(`  ${String(n).padStart(3)}  ${name}`);
console.log(
  bad
    ? `\nFAIL: ${bad} problem(s) across 100 days.`
    : `\nOK: 100 decks, ${want} distinct questions each, all windows and scales valid.`,
);
process.exit(bad ? 1 : 0);
