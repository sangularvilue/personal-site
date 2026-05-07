import { getRedis } from "../lib/redis";

async function main() {
  const qid = process.argv[2];
  if (!qid) {
    console.error("Usage: tsx scripts/check-index.ts <question_id>");
    process.exit(1);
  }
  const r = getRedis();
  const inAll = await r.sismember("lsat:q-all", qid);
  const inLG = await r.sismember("lsat:q-by-section:LG", qid);
  const inLR = await r.sismember("lsat:q-by-section:LR", qid);
  const inRC = await r.sismember("lsat:q-by-section:RC", qid);
  console.log(`${qid} in lsat:q-all          → ${inAll}`);
  console.log(`${qid} in lsat:q-by-section:LG → ${inLG}`);
  console.log(`${qid} in lsat:q-by-section:LR → ${inLR}`);
  console.log(`${qid} in lsat:q-by-section:RC → ${inRC}`);
  for (const skill of [
    "main_point",
    "inference",
    "strengthen_weaken",
    "assumption",
    "flaw_method",
    "principle_parallel",
    "detail_function",
    "authors_voice",
  ]) {
    const inSkill = await r.sismember(`lsat:q-by-skill:${skill}`, qid);
    if (inSkill) console.log(`${qid} in lsat:q-by-skill:${skill}`);
  }
}
main();
