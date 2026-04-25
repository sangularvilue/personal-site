// Repair questions.csv:
//   1. Shuffle which option is correct (A/B/C/D balanced)
//   2. Replace garbage distractors ("Bivens", "Erie", "Same as X", "Pure X",
//      single-word distractors) with substantive plausible-but-wrong
//      distractors from a category-keyed pool.
//
// Run:  node --import tsx scripts/fix-questions.ts

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

type FCCategory = "just" | "cong" | "fqj" | "scsr" | "erie" | "roa" | "imm" | "hab";

// ----- Pool of substantive plausible-but-wrong distractors, per category -----
const POOL: Record<FCCategory, string[]> = {
  just: [
    "The injury is shared in substantially equal measure with the public at large",
    "Plaintiff has alleged a procedural injury without an underlying concrete interest",
    "The chain of causation runs through independent third-party choices",
    "The harm is too speculative to be 'certainly impending' under Clapper",
    "The case is moot because voluntary cessation makes recurrence unlikely",
    "Pre-enforcement review is unripe absent a credible threat of prosecution",
    "The political question doctrine bars judicial resolution",
    "Congress cannot manufacture standing absent an Article III injury",
    "Standing was forfeited by failure to raise it below",
    "Plaintiff seeks an advisory opinion barred by Article III",
    "The remedy sought would not redress the alleged injury",
    "The injury fails the concreteness requirement under TransUnion",
    "The plaintiff lacks third-party standing to assert another's rights",
    "Generalized grievance bars federal jurisdiction",
    "The harm depends on speculation about future government enforcement",
  ],
  cong: [
    "Congress's Article I commerce power does not reach this conduct",
    "The Exceptions Clause permits Congress to strip appellate jurisdiction here",
    "Article III's vesting clause requires the case to land somewhere in the federal courts",
    "Public-rights doctrine permits non-Article III adjudication",
    "Litigant consent saves the Article I structure under Wellness",
    "Magistrate adjunct theory requires de novo Article III review",
    "The bankruptcy court lacked authority to enter final judgment",
    "Klein bars Congress from manipulating jurisdiction to dictate outcome",
    "The Suspension Clause limits Congress's habeas-stripping power",
    "Schor's multi-factor balancing weighs against this assignment",
    "Sheldon v. Sill permits any limit on inferior-court jurisdiction",
    "The essential attributes of judicial power must remain in Article III courts",
    "Stern's narrow rule applies to state-law counterclaims",
    "Crowell's jurisdictional-fact doctrine no longer bars this",
  ],
  fqj: [
    "The Holmes rule places this within § 1331",
    "Mottley's well-pleaded complaint rule bars federal jurisdiction",
    "All four Grable factors are not satisfied",
    "Supplemental jurisdiction under § 1367(a) covers the state claim",
    "Complete diversity is destroyed by the joinder",
    "Complete preemption permits removal despite the well-pleaded complaint",
    "The federal issue is not actually disputed under Grable",
    "Smith v. Kansas City Title's embedded-federal-question route applies",
    "§ 1367(b) bars supplemental jurisdiction in this diversity posture",
    "Shoshone Mining defeats FQJ even though federal law creates the claim",
    "Verlinden-style protective jurisdiction is unavailable",
    "Skelly Oil extends Mottley to declaratory-judgment plaintiffs",
    "Owen v. Kroger forbids destruction of complete diversity",
    "The federal question is insubstantial under Bell v. Hood",
  ],
  scsr: [
    "The state-court judgment rests on adequate and independent state grounds",
    "Michigan v. Long's presumption authorizes Supreme Court review",
    "The federal issue was not raised below and is therefore unreviewable",
    "Murdock v. Memphis limits review to federal-law questions only",
    "The state procedural ground is novel and inadequate to bar review",
    "An antecedent state-law issue may be reviewed where it determines a federal right",
    "Testa v. Katt requires state courts to enforce the federal claim",
    "Felder v. Casey preempts the discriminatory state procedural rule",
    "Dice v. Akron requires federal procedural law to govern",
    "The state's neutral excuse is insufficient under Howlett v. Rose",
    "The state court's interpretation of state law is not reviewable",
    "Fox Films bars review where state ground supports the result",
  ],
  erie: [
    "Erie commands application of forum-state substantive law",
    "Federal common law fills a gap left by the comprehensive federal scheme",
    "Clearfield Trust's federal-interest test displaces state law here",
    "Kimbell Foods directs adoption of state law as the federal rule",
    "Boyle's three-prong contractor defense preempts state tort law",
    "Hanna's twin aims point toward applying the federal rule",
    "The Rules Enabling Act limits this rule to procedure",
    "Sabbatino's act-of-state doctrine controls",
    "Lincoln Mills authorizes federal common-law development under § 301",
    "Texas Industries forecloses an implied federal right of contribution",
    "Miree v. DeKalb directs application of state law where federal interest is incidental",
    "Erie's positivism rationale precludes federal general common law",
  ],
  roa: [
    "Sandoval requires rights-creating language and statutory structure",
    "Cort v. Ash's four-factor analysis is no longer controlling",
    "The comprehensive remedial scheme forecloses an implied private right",
    "Bivens cannot be extended where any rational reason favors Congress",
    "FTCA provides an adequate alternative remedy that defeats Bivens",
    "Special factors counsel hesitation under Ziglar v. Abbasi",
    "Davis v. Passman remains a narrow exception for Title VII gaps",
    "Carlson v. Green's 8A holding preserves only the original context",
    "Egbert effectively bars any new Bivens context",
    "Hernandez's foreign-relations special factor controls",
    "Touche Ross's narrowing of implied PROAs governs",
    "The text and structure show Congress declined to create a private right",
    "Malesko bars Bivens against private-corporation defendants",
    "Wilkie's unworkability concern defeats this Bivens extension",
  ],
  imm: [
    "Ex parte Young permits prospective injunctive relief against the officer",
    "Section 5 of the Fourteenth Amendment abrogates state sovereign immunity",
    "Plan-of-convention waiver controls under Katz/Torres",
    "Seminole Tribe forecloses Article I abrogation of SSI",
    "Qualified immunity defeats the damages claim under Harlow",
    "Absolute prosecutorial immunity covers advocacy functions",
    "§ 1983 personal-capacity suits escape Eleventh Amendment SSI",
    "Monell requires policy or custom, not respondeat superior",
    "Canton's deliberate-indifference standard governs failure-to-train",
    "Will v. Michigan State Police bars suit against the state itself",
    "Pennhurst forbids Young from enforcing state law against the state",
    "Fitzpatrick v. Bitzer authorizes congressional abrogation under § 5",
    "Edelman v. Jordan limits Young to prospective relief",
    "Connick narrows Canton failure-to-train to require pattern",
    "Stump v. Sparkman extends judicial immunity to outrageous orders",
    "Pearson v. Callahan permits courts to skip the constitutional question",
  ],
  hab: [
    "AEDPA § 2254(d)(1) deference forecloses relief absent unreasonable application",
    "Wainwright's cause-and-prejudice standard governs procedural default",
    "Teague's anti-retroactivity rule bars new procedural rules",
    "The petitioner failed to exhaust state remedies",
    "Cullen v. Pinholster limits review to the state-court record",
    "Stone v. Powell bars Fourth Amendment habeas claims",
    "Coleman v. Thompson holds collateral attorney error is not cause",
    "Martinez v. Ryan recognizes IATC at initial-review collateral as cause",
    "Shinn v. Ramirez restricts new-evidence development",
    "McQuiggin's actual-innocence gateway excuses untimely petitions",
    "Boumediene's Suspension Clause holding controls jurisdictional questions",
    "Felker upholds AEDPA's bar on second petitions",
    "Williams v. Taylor distinguishes 'contrary to' from 'unreasonable application'",
    "The state court adjudicated on the merits, triggering AEDPA deference",
  ],
};

// ----- Bad-distractor detection -----
const TRASH_PATTERNS = [
  /^Same as /i,
  /^Pure /i,
  /^Article (I|II|III|VI|V) ?(only)?$/i,
  /^Diversity$/i,
  /^Bivens$/i,
  /^Erie$/i,
  /^Mottley$/i,
  /^FTCA$/i,
  /^FCL$/i,
  /^Common law$/i,
  /^Civil rights$/i,
  /^None of (the )?above/i,
  /^All of (the )?above/i,
  /^Both [a-d] and [a-d]/i,
  /^Bivens applied$/i,
  /^Erie precluded?$/i,
  /^Erie applies?$/i,
  /^Bivens applies?$/i,
  /^States? waived?$/i,
  /^Government coercion is presumed/i,
  /^Pure constitutional$/i,
  /^Ripeness fails$/i,
  /^The plaintiff is made whole$/i,
];

function isTrash(s: string): boolean {
  if (!s || s.length < 14) return true;
  return TRASH_PATTERNS.some((rx) => rx.test(s.trim()));
}

// ----- CSV parsing/writing -----

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(field); field = ""; }
      else if (ch === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (ch === "\r") { /* skip */ }
      else field += ch;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].length > 0));
}

function csvEscape(s: string): string {
  if (s == null) return "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ----- Main -----

function pickN<T>(arr: T[], n: number, exclude: Set<T>): T[] {
  const pool = arr.filter((x) => !exclude.has(x));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

function shufflePos<T>(arr: T[]): { shuffled: T[]; mapping: number[] } {
  const idx = arr.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return { shuffled: idx.map((i) => arr[i]), mapping: idx };
}

const path = join(process.cwd(), "fedcourts/content/questions.csv");
const text = readFileSync(path, "utf8");
const rows = parseCSV(text);
const headers = rows.shift()!;
const idx = (h: string) => headers.indexOf(h);

let trashFixed = 0;
let positionsShuffled = 0;
const correctCounts: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };

const newRows: string[][] = rows.map((row) => {
  const cat = (row[idx("category")] || "just") as FCCategory;
  const correctLetter = (row[idx("correct")] || "a").toLowerCase() as "a" | "b" | "c" | "d";
  const letterToIdx = { a: idx("opt_a"), b: idx("opt_b"), c: idx("opt_c"), d: idx("opt_d") };
  const opts: [string, string, string, string] = [
    row[letterToIdx.a],
    row[letterToIdx.b],
    row[letterToIdx.c],
    row[letterToIdx.d],
  ];
  const correctText = opts[{ a: 0, b: 1, c: 2, d: 3 }[correctLetter]];

  // Replace trash distractors with pool draws.
  const exclude = new Set<string>([correctText]);
  const usedReplacements = new Set<string>();
  for (let i = 0; i < 4; i++) {
    if (i === { a: 0, b: 1, c: 2, d: 3 }[correctLetter]) continue;
    if (isTrash(opts[i])) {
      const pool = POOL[cat] ?? POOL.just;
      const candidates = pool.filter(
        (p) => !exclude.has(p) && !usedReplacements.has(p) && p !== correctText,
      );
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        opts[i] = pick;
        usedReplacements.add(pick);
        trashFixed++;
      }
    } else {
      exclude.add(opts[i]);
    }
  }

  // Shuffle position.
  const { shuffled, mapping } = shufflePos(opts);
  const newCorrectIdx = mapping.indexOf({ a: 0, b: 1, c: 2, d: 3 }[correctLetter]);
  const newCorrectLetter = (["a", "b", "c", "d"] as const)[newCorrectIdx];
  if (newCorrectLetter !== correctLetter) positionsShuffled++;
  correctCounts[newCorrectLetter]++;

  const out = [...row];
  out[letterToIdx.a] = shuffled[0];
  out[letterToIdx.b] = shuffled[1];
  out[letterToIdx.c] = shuffled[2];
  out[letterToIdx.d] = shuffled[3];
  out[idx("correct")] = newCorrectLetter;
  return out;
});

// Write back.
const lines = [headers.join(",")];
for (const r of newRows) lines.push(r.map(csvEscape).join(","));
writeFileSync(path, lines.join("\n") + "\n");

console.log(`Trash distractors replaced: ${trashFixed}`);
console.log(`Positions changed: ${positionsShuffled} / ${newRows.length}`);
console.log(`New correct distribution:`, correctCounts);
