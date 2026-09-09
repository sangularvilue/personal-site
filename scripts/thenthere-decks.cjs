/**
 * Verifies the daily schedule. Checks that each day yields six distinct,
 * answerable questions, that questions do not repeat inside a rotation, and
 * that a day's six are drawn from across the bank rather than one subject.
 *
 * game.ts uses extensionless TS imports, which Node cannot resolve directly,
 * so transpile first with the TypeScript already in the project:
 *
 *   npx tsc app/thenthere/game.ts --outDir .tmp-decks --module commonjs \
 *     --target es2022 --moduleResolution node --esModuleInterop \
 *     --skipLibCheck --jsx react-jsx
 *   node scripts/thenthere-decks.cjs [days]
 *
 * scoreGuess supplies its own scale fallbacks, so a missing spaceScale or
 * timeScale is not an error here; an unreachable answer year is.
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
const want = ROUNDS_PER_GAME || 6;
const DAYS = Number(process.argv[2]) || 400;

const start = Date.parse(todayKey() + "T00:00:00.000Z");
let bad = 0;
let focusDays = 0;
const lastSeen = new Map();
const gaps = [];
const fieldsPerDay = [];

for (let i = 0; i < DAYS; i++) {
  const key = new Date(start + i * 86400000).toISOString().slice(0, 10);
  let day;
  try {
    day = dailyGame(key);
  } catch (err) {
    console.error(`${key}: threw ${err.message}`);
    bad++;
    continue;
  }
  const qs = day.questions;
  if (day.focus) focusDays++;

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

  if (!day.focus) {
    // How many days between repeat appearances of the same question?
    for (const q of qs) {
      if (lastSeen.has(q.title)) gaps.push(i - lastSeen.get(q.title));
      lastSeen.set(q.title, i);
    }
    fieldsPerDay.push(new Set(qs.map((q) => q.field)).size);
  }
}

const minGap = gaps.length ? Math.min(...gaps) : Infinity;
const avgFields =
  fieldsPerDay.reduce((a, b) => a + b, 0) / (fieldsPerDay.length || 1);
const singleSubjectDays = fieldsPerDay.filter((n) => n <= 2).length;

console.log(`days checked: ${DAYS}`);
console.log(`focus days: ${focusDays} (1 in ${Math.round(DAYS / (focusDays || 1))})`);
console.log(
  `distinct fields per day: ${avgFields.toFixed(2)} of ${want} on average`,
);
console.log(`days with 2 or fewer distinct fields: ${singleSubjectDays}`);
console.log(
  gaps.length
    ? `closest repeat of any question: ${minGap} days apart`
    : "no question repeated in the window checked",
);

if (minGap < 60) {
  console.error(`\nFAIL: a question came round again after only ${minGap} days.`);
  bad++;
}
if (avgFields < want - 1.5) {
  console.error(
    `\nFAIL: days look themed (${avgFields.toFixed(2)} distinct fields of ${want}).`,
  );
  bad++;
}
console.log(bad ? `\nFAIL: ${bad} problem(s).` : "\nOK");
process.exit(bad ? 1 : 0);
