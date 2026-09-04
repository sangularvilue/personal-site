// Audit: does a question's title give away its own answer (place or year)?
const fs = require("fs");
const src = fs.readFileSync(require("path").join(__dirname, "../app/thenthere/events.ts"), "utf8");

// Grab the ROWS array body and eval it in a sandbox where PRESENT is defined.
const start = src.indexOf("const ROWS: Row[] = [");
const end = src.indexOf("\n];", start);
let body = src.slice(src.indexOf("[", start), end + 2);
body = body.replace(/PRESENT/g, "2026");
const rows = eval(body);

const stop = new Set([
  "the","of","near","off","and","new","usa","england","france","italy","china",
  "india","japan","egypt","germany","spain","russia","greece","turkey","iraq",
  "poland","mexico","brazil","israel","ghana","rwanda","cuba","iran","vietnam",
  "scotland","ireland","wales","canada","australia","zealand","africa","south",
  "north","east","west","netherlands","switzerland","belgium","austria",
  "portugal","colombia","argentina","uruguay","sweden","morocco","ethiopia",
  "tanzania","kazakhstan","indonesia","bangladesh","cambodia","mongolia",
  "moravia","bohemia","prussia","sicily","crimea","ukraine","tunisia","zaire",
  "arabia","bengal","virginia","massachusetts","jersey","york","hampshire",
  "maryland","florida","nevada","arizona","utah","hubei","kong",
  "mount",
]);

const leaks = [];
for (const [title, year, , , place] of rows) {
  const toks = place
    .split(/[^A-Za-zÀ-ÿ’]+/)
    .filter((t) => t.length > 3 && !stop.has(t.toLowerCase()));
  const hit = toks.filter((t) =>
    new RegExp("\\b" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(title),
  );
  if (hit.length) leaks.push({ hit: hit.join(","), title, place, year });
}

console.log("total rows:", rows.length);
const seen = new Map();
for (const [title] of rows) seen.set(title, (seen.get(title) || 0) + 1);
const dupes = [...seen].filter(([, n]) => n > 1);
console.log("duplicate titles:", dupes.length, dupes.map(([t]) => t).join(" | "));
console.log("place-name leaks:", leaks.length);
for (const l of leaks) console.log(`  [${l.hit}] ${l.title}   (${l.place})`);
