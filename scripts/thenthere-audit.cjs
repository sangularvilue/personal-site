/**
 * Then There question-bank audit. Run: node scripts/thenthere-audit.cjs
 *
 * Checks five classes of defect that have each bitten this bank before:
 *   1. place leaks     -- the clue names its own answer location
 *   2. unwinnable      -- the answer year falls outside the timeline window the
 *                         picker offers, so the player cannot reach it
 *   3. oblique actors  -- the clue says "a Khmer king" instead of Suryavarman II
 *   4. duplicate titles
 *   5. orphaned keys   -- QUESTION_RULES / EVENT_CONTEXT keyed by a title that
 *                         no longer exists, silently detaching its calibration
 *
 * Exits non-zero if 1, 2, 4 or 5 regress. Oblique actors are reported for
 * review rather than enforced, because some events genuinely have no individual
 * actor (an earthquake, a smog, the invention of writing).
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../app/thenthere/events.ts");
const src = fs.readFileSync(file, "utf8");

function rowsOf(name) {
  const s = src.indexOf(`const ${name}: Row[] = [`);
  if (s < 0) return [];
  const e = src.indexOf("\n];", s);
  return eval(
    src.slice(src.indexOf("[", s), e + 2).replace(/PRESENT/g, "2026"),
  );
}
const rows = [
  ...rowsOf("ROWS"),
  ...rowsOf("EXPANDED_ROWS"),
  ...rowsOf("ADDED_ROWS"),
];

function tableOf(decl) {
  const at = src.indexOf(decl);
  if (at < 0) return {};
  const open = src.indexOf("{", at);
  const close = src.indexOf("\n};", at);
  return eval(
    "(" + src.slice(open, close + 2).replace(/PRESENT/g, "2026") + ")",
  );
}
const FIELD_RULES = tableOf(
  "export const FIELD_RULES: Record<string, Calibration>",
);
const QUESTION_RULES = tableOf(
  "const QUESTION_RULES: Record<string, Calibration>",
);

const effective = (title, field, calibration) => ({
  ...FIELD_RULES[field],
  ...calibration,
  ...QUESTION_RULES[title],
});

// ── 1. place leaks ────────────────────────────────────────────────────────
// Country and region names are fair game as knowledge tests; a city or site
// name in its own clue is not.
const REGIONAL = new Set(
  (
    "the of near off and new usa england france italy china india japan egypt germany spain " +
    "russia greece turkey iraq poland mexico brazil israel ghana rwanda cuba iran vietnam " +
    "scotland ireland wales canada australia zealand africa south north east west netherlands " +
    "switzerland belgium austria portugal colombia argentina uruguay sweden morocco ethiopia " +
    "tanzania kazakhstan indonesia bangladesh cambodia mongolia moravia bohemia prussia sicily " +
    "crimea ukraine tunisia zaire arabia bengal virginia massachusetts jersey york hampshire " +
    "maryland florida nevada arizona utah hubei kong mesopotamia islands pole everest " +
    // Generic geographic and facility nouns: they appear in place labels like
    // "Challenger Deep, Pacific Ocean" or "Space Launch Complex 41" without
    // themselves identifying anywhere.
    "mount mountain launch complex space station centre center airport harbour harbor " +
    "ocean pacific atlantic indian arctic sea strait bay cape gulf lake river delta deep trench " +
    "island isle peninsula desert valley plain coast summit point site field park"
  ).split(" "),
);

// Naming the figure takes priority over hiding the place. Where a person's own
// name contains their country the two rules genuinely conflict; this records
// which way it was settled rather than quietly weakening the check.
const ACCEPTED_LEAKS = new Set([
  // "Kenyatta" contains "Kenya". Naming him is required, and the city is
  // still what the player actually has to place.
  "Jomo Kenyatta becomes his newly independent country’s first leader.",
]);

const leaks = [];
for (const [title, year, , , place] of rows) {
  if (ACCEPTED_LEAKS.has(title)) continue;
  const hits = place
    .split(/[^A-Za-zÀ-ÿ’]+/)
    .filter((t) => t.length > 3 && !REGIONAL.has(t.toLowerCase()))
    .filter((t) =>
      new RegExp("\\b" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(
        title,
      ),
    );
  if (hits.length) leaks.push({ hits, title, place, year });
}

// ── 2. unwinnable windows ─────────────────────────────────────────────────
// The window comes from FIELD_RULES for the event's field unless the row
// overrides it. Filing an event under a field whose window predates or
// postdates the event makes the correct year unreachable in the picker.
const unwinnable = [];
for (const [title, year, , , , field, , calibration] of rows) {
  const [lo, hi] = effective(title, field, calibration).years || [-4000, 2026];
  if (year < lo || year > hi) unwinnable.push({ title, year, field, lo, hi });
}

// ── 3. oblique actors ─────────────────────────────────────────────────────
const WEAK = new Set(
  (
    "the a an of and in on at to for from with by into over under out off up as is are was were " +
    "african american arab asian australian austrian basque belgian bohemian brazilian british " +
    "byzantine cambodian canadian chinese christian christendom dutch egyptian english european " +
    "french frankish german greek haitian indian iranian iraqi irish islamic israeli italian " +
    "japanese jewish khmer korean malian mexica mexican mongol moroccan muslim norse ottoman " +
    "persian polish portuguese prussian roman russian scottish soviet spanish sumerian swedish " +
    "swiss turkish ukrainian vietnamese welsh zulu allied allies nazi union confederate"
  ).split(" "),
);
const oblique = rows.filter(
  ([title]) =>
    !title
      .split(/[\s,.;:'’"“”()-]+/)
      .filter(Boolean)
      .some((w) => /^[A-ZÀ-Ý]/.test(w) && !WEAK.has(w.toLowerCase())),
);

// ── 4. duplicates ─────────────────────────────────────────────────────────
const seen = new Map();
for (const [title] of rows) seen.set(title, (seen.get(title) || 0) + 1);
const dupes = [...seen].filter(([, n]) => n > 1);

// ── 5. orphaned lookup keys ───────────────────────────────────────────────
const titles = new Set(rows.map((r) => r[0]));
const orphans = [];
for (const table of ["QUESTION_RULES", "EVENT_CONTEXT"]) {
  const at = src.indexOf(table);
  if (at < 0) continue;
  const seg = src.slice(src.indexOf("{", at), src.indexOf("\n};", at));
  const re = /^\s{2}"((?:[^"]|"")*)":/gm;
  let m;
  while ((m = re.exec(seg)))
    if (!titles.has(m[1])) orphans.push(`${table}: ${m[1]}`);
}

// ── report ────────────────────────────────────────────────────────────────
console.log(`events: ${rows.length}`);
console.log(`place leaks: ${leaks.length}`);
leaks.forEach((l) =>
  console.log(`  [${l.hits.join(",")}] ${l.title}  (${l.place})`),
);
console.log(`unwinnable (year outside window): ${unwinnable.length}`);
unwinnable.forEach((u) =>
  console.log(`  ${u.year} outside ${u.lo}..${u.hi}  [${u.field}]  ${u.title}`),
);
console.log(`duplicate titles: ${dupes.length}`);
dupes.forEach(([t]) => console.log(`  ${t}`));
console.log(`orphaned lookup keys: ${orphans.length}`);
orphans.forEach((o) => console.log(`  ${o}`));
console.log(`oblique actors (review only): ${oblique.length}`);
oblique.forEach((r) => console.log(`  ${r[1]}  ${r[0]}`));

const failures =
  leaks.length + unwinnable.length + dupes.length + orphans.length;
if (failures) {
  console.error(`\nFAIL: ${failures} enforced issue(s).`);
  process.exit(1);
}
console.log("\nOK");
