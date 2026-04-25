// One-off: schedule daily hypos + case wordles for the next N days.
// npx tsx scripts/schedule-daily-fedcourts.ts [days=30]

import { FC_CATEGORIES } from "../lib/fc-types";
import {
  getQuestionIdsByCategory,
  getQuestionsByIds,
  getAllCaseIds,
  setDailyHypo,
  setDailyCase,
  todayEst,
} from "../lib/fc-redis";

function shuffle<T>(a: T[]): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

function addDays(dateEst: string, n: number): string {
  const d = new Date(dateEst + "T00:00:00-05:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const days = parseInt(process.argv[2] || "30", 10);

  const allQids: string[] = [];
  for (const c of FC_CATEGORIES) allQids.push(...(await getQuestionIdsByCategory(c)));
  const all = await getQuestionsByIds(allQids);
  const eligible = all.filter((q) => q.daily_eligible).map((q) => q.id);
  const fallback = all.filter((q) => q.difficulty >= 4).map((q) => q.id);
  const pool = shuffle(eligible.length >= days ? eligible : [...eligible, ...fallback]);

  const allCases = shuffle(await getAllCaseIds());

  const start = todayEst();
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    if (pool[i % pool.length]) await setDailyHypo(date, pool[i % pool.length]);
    if (allCases[i % allCases.length]) await setDailyCase(date, allCases[i % allCases.length]);
    console.log(`${date}: hypo=${pool[i % pool.length]} case=${allCases[i % allCases.length]}`);
  }
  console.log(`Scheduled ${days} days starting ${start}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
