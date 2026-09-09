// Coverage report: events per scheduled lens, per field, and per era.
// Shows where the bank is too thin for a 6-question deck to feel varied.
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "../app/thenthere");
const src = fs.readFileSync(path.join(dir, "events.ts"), "utf8");
const game = fs.readFileSync(path.join(dir, "game.ts"), "utf8");

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

// Pull each lens name and the field list it gates on.
const lenses = [];
const re =
  /name:\s*"([^"]+)",\s*\n\s*note:[\s\S]*?fieldSet\(([\s\S]*?)\)\.has/g;
let m;
while ((m = re.exec(game))) {
  const fields = [...m[2].matchAll(/"([^"]+)"/g)].map((f) => f[1]);
  lenses.push({ name: m[1], fields: new Set(fields) });
}

console.log(`events: ${rows.length}\n`);
console.log("LENS COVERAGE (a deck needs 6)");
for (const l of lenses) {
  const hits = rows.filter((r) => l.fields.has(r[5]));
  const flag = hits.length < 18 ? "  <-- thin" : "";
  console.log(`  ${String(hits.length).padStart(3)}  ${l.name}${flag}`);
}

const covered = new Set(lenses.flatMap((l) => [...l.fields]));
const orphanFields = [...new Set(rows.map((r) => r[5]))].filter(
  (f) => !covered.has(f),
);
console.log(
  `\nfields in no lens (${orphanFields.length}): ${orphanFields.join(", ")}`,
);

console.log("\nERA SPREAD");
const eras = [
  ["pre-500 BC", -9999, -500],
  ["500 BC-500 AD", -500, 500],
  ["500-1000", 500, 1000],
  ["1000-1500", 1000, 1500],
  ["1500-1700", 1500, 1700],
  ["1700-1800", 1700, 1800],
  ["1800-1900", 1800, 1900],
  ["1900-1950", 1900, 1950],
  ["1950-2000", 1950, 2000],
  ["2000-", 2000, 9999],
];
for (const [label, lo, hi] of eras) {
  const n = rows.filter((r) => r[1] >= lo && r[1] < hi).length;
  console.log(`  ${String(n).padStart(3)}  ${label}`);
}

console.log("\nCONTINENT SPREAD (rough, by lon/lat box)");
const box = (lat, lon) =>
  lat > 5 && lon > -25 && lon < 45
    ? "Europe"
    : lat <= 37 && lon > -20 && lon < 52
      ? "Africa"
      : lon >= 45 && lon < 150 && lat > -10
        ? "Asia"
        : lat > 12 && lon >= -170 && lon <= -50
          ? "N America"
          : lat <= 12 && lon >= -85 && lon <= -34
            ? "S America"
            : lon >= 110 && lat < -10
              ? "Oceania"
              : "other";
const cont = {};
for (const r of rows) cont[box(r[2], r[3])] = (cont[box(r[2], r[3])] || 0) + 1;
for (const [k, v] of Object.entries(cont).sort((a, b) => b[1] - a[1]))
  console.log(`  ${String(v).padStart(3)}  ${k}`);
