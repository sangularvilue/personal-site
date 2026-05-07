import { getPassageText } from "../lib/lsat-redis";

async function main() {
  const ids = process.argv.slice(2);
  if (ids.length === 0) {
    console.error("Usage: tsx scripts/check-passage.ts <passage_id> [<passage_id> ...]");
    process.exit(1);
  }
  for (const id of ids) {
    const t = await getPassageText(id);
    if (t === null) {
      console.log(`${id}: <not in Redis>`);
    } else {
      console.log(`${id}: ${t.length} chars: ${JSON.stringify(t.slice(0, 200))}…`);
    }
  }
}
main();
