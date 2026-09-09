/**
 * Coverage report for the Then There question bank: spread by era, region and
 * subject. Run: node scripts/thenthere-coverage.cjs
 *
 * Days are no longer themed -- each draws six questions from the whole bank --
 * so this is about whether the bank itself is lopsided, not about whether any
 * single themed deck can be filled.
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(
  path.join(__dirname, "../app/thenthere/events.ts"),
  "utf8",
);

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

const bar = (n, max, width = 34) =>
  "#".repeat(Math.max(1, Math.round((n / max) * width)));

console.log(`events: ${rows.length}\n`);

console.log("ERA SPREAD");
const eras = [
  ["pre-1000 BC", -9999, -1000],
  ["1000-500 BC", -1000, -500],
  ["500 BC-1 AD", -500, 1],
  ["1-500", 1, 500],
  ["500-1000", 500, 1000],
  ["1000-1500", 1000, 1500],
  ["1500-1700", 1500, 1700],
  ["1700-1800", 1700, 1800],
  ["1800-1900", 1800, 1900],
  ["1900-1950", 1900, 1950],
  ["1950-2000", 1950, 2000],
  ["2000-", 2000, 9999],
];
const eraCounts = eras.map(([l, lo, hi]) => [
  l,
  rows.filter((r) => r[1] >= lo && r[1] < hi).length,
]);
const eraMax = Math.max(...eraCounts.map(([, n]) => n));
for (const [label, n] of eraCounts)
  console.log(
    `  ${String(n).padStart(3)}  ${label.padEnd(12)} ${bar(n, eraMax)}`,
  );

console.log("\nREGION SPREAD (rough lat/lon boxes)");
const box = (lat, lon) =>
  lat > 34 && lon > -25 && lon < 45
    ? "Europe"
    : lat <= 40 && lon > -20 && lon < 52
      ? "Africa / Near East"
      : lon >= 45 && lon < 150 && lat > -10
        ? "Asia"
        : lat > 12 && lon >= -170 && lon <= -50
          ? "N America"
          : lat <= 12 && lon >= -95 && lon <= -34
            ? "Latin America"
            : lon >= 110 && lat < -10
              ? "Oceania"
              : "other / ocean";
const cont = {};
for (const r of rows) {
  const k = box(r[2], r[3]);
  cont[k] = (cont[k] || 0) + 1;
}
const contMax = Math.max(...Object.values(cont));
for (const [k, v] of Object.entries(cont).sort((a, b) => b[1] - a[1]))
  console.log(`  ${String(v).padStart(3)}  ${k.padEnd(18)} ${bar(v, contMax)}`);

console.log("\nTHINNEST SUBJECTS (fewer than 4 events)");
const fields = {};
for (const r of rows) fields[r[5]] = (fields[r[5]] || 0) + 1;
const thin = Object.entries(fields)
  .filter(([, n]) => n < 4)
  .sort((a, b) => a[1] - b[1]);
console.log(
  thin.length ? thin.map(([f, n]) => `  ${n}  ${f}`).join("\n") : "  (none)",
);
console.log(`\ndistinct subjects: ${Object.keys(fields).length}`);
