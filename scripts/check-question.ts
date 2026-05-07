import { getPassageText, getQuestion } from "../lib/lsat-redis";

async function main() {
  const ids = process.argv.slice(2);
  if (ids.length === 0) {
    console.error("Usage: tsx scripts/check-question.ts <question_id> [<question_id> ...]");
    process.exit(1);
  }
  for (const id of ids) {
    const q = await getQuestion(id);
    if (!q) {
      console.log(`${id}: <not in Redis>`);
      continue;
    }
    console.log(`\n${id}:`);
    console.log(`  pt=${q.pt} s=${q.section_num} q=${q.question_num} type=${q.section_type}`);
    console.log(`  passage_id=${q.passage_id || "(none)"}`);
    console.log(`  stem (${q.stem.length} chars): ${JSON.stringify(q.stem.slice(0, 120))}`);
    console.log(`  correct=${q.correct}`);
    if (q.passage_id) {
      const pt = await getPassageText(q.passage_id);
      if (pt === null) console.log(`  passage TEXT: <not in Redis>`);
      else console.log(`  passage TEXT (${pt.length} chars): ${JSON.stringify(pt.slice(0, 120))}`);
    }
  }
}
main();
