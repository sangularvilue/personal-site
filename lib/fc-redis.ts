import { getRedis } from "./redis";
import type {
  FCCategory,
  FCQuestion,
  FCCase,
  FCRule,
  FCUser,
  FCRatings,
  FCGameMode,
} from "./fc-types";
import { emptyRatings, FC_CATEGORIES } from "./fc-types";

const K = {
  user: (id: string) => `fc:user:${id}`,
  userByUsername: (u: string) => `fc:user-by-username:${u.toLowerCase()}`,
  question: (id: string) => `fc:q:${id}`,
  questionsByCat: (c: FCCategory) => `fc:q-by-cat:${c}`,
  case: (id: string) => `fc:case:${id}`,
  allCases: "fc:cases:all",
  rule: (id: string) => `fc:rule:${id}`,
  allRules: "fc:rules:all",
  ratings: (uid: string) => `fc:ratings:${uid}`,
  numAnswered: (uid: string, cat: FCCategory) =>
    `fc:num-answered:${uid}:${cat}`,
  recentSeen: (uid: string) => `fc:recent:${uid}`,
  answers: (uid: string) => `fc:answers:${uid}`,
  answersAll: "fc:answers:all",
  scoresLB: (game: FCGameMode, cat: string, window: string) =>
    `fc:lb:${game}:${cat}:${window}`,
  streak: (uid: string, game: FCGameMode) => `fc:streak:${uid}:${game}`,
  dailyHypo: (date: string) => `fc:daily-hypo:${date}`,
  dailyCase: (date: string) => `fc:daily-case:${date}`,
  dailySubmission: (uid: string, game: "daily-hypo" | "case-wordle", date: string) =>
    `fc:daily-sub:${uid}:${game}:${date}`,
};

// ====== USERS ======

export async function createUser(
  id: string,
  username: string,
  password_hash: string,
  display_name: string,
): Promise<FCUser> {
  const r = getRedis();
  const user: FCUser & { password_hash: string } = {
    id,
    username,
    display_name,
    created_at: Date.now(),
    password_hash,
  };
  await r.hset(K.user(id), user as unknown as Record<string, unknown>);
  await r.set(K.userByUsername(username), id);
  await r.hset(K.ratings(id), emptyRatings());
  return user;
}

export async function getUserById(id: string): Promise<(FCUser & { password_hash: string }) | null> {
  const r = getRedis();
  const data = await r.hgetall<FCUser & { password_hash: string }>(K.user(id));
  if (!data || !data.id) return null;
  return data;
}

export async function getUserByUsername(
  username: string,
): Promise<(FCUser & { password_hash: string }) | null> {
  const r = getRedis();
  const id = await r.get<string>(K.userByUsername(username));
  if (!id) return null;
  return getUserById(id);
}

// ====== QUESTIONS ======

export async function upsertQuestion(q: FCQuestion): Promise<void> {
  const r = getRedis();
  await r.hset(K.question(q.id), {
    ...q,
    tags: JSON.stringify(q.tags),
    daily_eligible: q.daily_eligible ? "1" : "0",
  });
  await r.sadd(K.questionsByCat(q.category), q.id);
}

export async function getQuestion(id: string): Promise<FCQuestion | null> {
  const r = getRedis();
  const data = await r.hgetall<Record<string, string>>(K.question(id));
  if (!data || !data.id) return null;
  return parseQuestionRow(data);
}

export async function getQuestionIdsByCategory(
  cat: FCCategory,
): Promise<string[]> {
  const r = getRedis();
  return (await r.smembers(K.questionsByCat(cat))) as string[];
}

export async function getQuestionsByIds(ids: string[]): Promise<FCQuestion[]> {
  const r = getRedis();
  const pipeline = r.pipeline();
  for (const id of ids) pipeline.hgetall(K.question(id));
  const results = (await pipeline.exec()) as Array<Record<string, string> | null>;
  return results
    .filter((d): d is Record<string, string> => d !== null && !!d.id)
    .map(parseQuestionRow);
}

function parseQuestionRow(d: Record<string, string>): FCQuestion {
  return {
    id: d.id,
    category: d.category as FCCategory,
    difficulty: parseInt(d.difficulty || "3", 10),
    rating: parseInt(d.rating || "1000", 10),
    num_answered: parseInt(d.num_answered || "0", 10),
    stem: d.stem,
    opt_a: d.opt_a,
    opt_b: d.opt_b,
    opt_c: d.opt_c,
    opt_d: d.opt_d,
    correct: d.correct as "a" | "b" | "c" | "d",
    case_cited: d.case_cited || undefined,
    rule_id: d.rule_id || undefined,
    prong: d.prong || undefined,
    explanation: d.explanation,
    tags: d.tags ? safeJSON<string[]>(d.tags, []) : [],
    daily_eligible: d.daily_eligible === "1" || d.daily_eligible === "true",
  };
}

function safeJSON<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

// ====== CASES ======

export async function upsertCase(c: FCCase): Promise<void> {
  const r = getRedis();
  await r.hset(K.case(c.id), c as unknown as Record<string, unknown>);
  await r.sadd(K.allCases, c.id);
}

export async function getCase(id: string): Promise<FCCase | null> {
  const r = getRedis();
  const d = await r.hgetall<Record<string, string>>(K.case(id));
  if (!d || !d.id) return null;
  return {
    id: d.id,
    name: d.name,
    year: parseInt(d.year || "0", 10),
    court: d.court,
    category: d.category as FCCategory,
    holding: d.holding,
    facts_one_liner: d.facts_one_liner,
    cluster: d.cluster || undefined,
    outline_section: d.outline_section || undefined,
    first_letter: d.first_letter || undefined,
    citation_hint: d.citation_hint || undefined,
  };
}

export async function getAllCaseIds(): Promise<string[]> {
  const r = getRedis();
  return (await r.smembers(K.allCases)) as string[];
}

// ====== RULES ======

export async function upsertRule(rule: FCRule): Promise<void> {
  const r = getRedis();
  await r.hset(K.rule(rule.id), {
    ...rule,
    elements: JSON.stringify(rule.elements),
    common_distractors: JSON.stringify(rule.common_distractors),
  });
  await r.sadd(K.allRules, rule.id);
}

export async function getRule(id: string): Promise<FCRule | null> {
  const r = getRedis();
  const d = await r.hgetall<Record<string, string>>(K.rule(id));
  if (!d || !d.id) return null;
  return {
    id: d.id,
    name: d.name,
    category: d.category as FCCategory,
    elements: safeJSON<string[]>(d.elements || "[]", []),
    source_case: d.source_case || undefined,
    when_applied: d.when_applied || undefined,
    common_distractors: safeJSON<string[]>(d.common_distractors || "[]", []),
  };
}

export async function getAllRuleIds(): Promise<string[]> {
  const r = getRedis();
  return (await r.smembers(K.allRules)) as string[];
}

// ====== RATINGS ======

export async function getUserRatings(uid: string): Promise<FCRatings> {
  const r = getRedis();
  const data = await r.hgetall<Record<string, string>>(K.ratings(uid));
  if (!data) return emptyRatings();
  const result = emptyRatings();
  for (const cat of FC_CATEGORIES) {
    if (data[cat]) result[cat] = parseInt(data[cat], 10);
  }
  return result;
}

export async function setUserRating(
  uid: string,
  cat: FCCategory,
  rating: number,
): Promise<void> {
  const r = getRedis();
  await r.hset(K.ratings(uid), { [cat]: rating });
}

// ====== ANSWER LOGGING + ELO ======

export type AnswerEvent = {
  user_id: string;
  question_id: string;
  game_mode: FCGameMode;
  session_id: string;
  selected: "a" | "b" | "c" | "d" | null;
  correct: boolean;
  ms_to_answer: number;
  answered_at: number;
  category: FCCategory;
};

export async function logAnswer(ev: AnswerEvent): Promise<void> {
  const r = getRedis();
  const json = JSON.stringify(ev);
  await Promise.all([
    r.lpush(K.answers(ev.user_id), json),
    r.lpush(K.answersAll, json),
    r.zadd(K.recentSeen(ev.user_id), { score: ev.answered_at, member: ev.question_id }),
  ]);
  // trim
  await r.ltrim(K.answers(ev.user_id), 0, 9999);
  await r.ltrim(K.answersAll, 0, 99999);
}

const K_USER = 24;
const K_Q = 16;

export function eloUpdate(
  userRating: number,
  qRating: number,
  correct: boolean,
): { newUser: number; newQ: number } {
  const expected = 1 / (1 + Math.pow(10, (qRating - userRating) / 400));
  const result = correct ? 1 : 0;
  const newUser = Math.round(userRating + K_USER * (result - expected));
  const newQ = Math.round(qRating + K_Q * (expected - result));
  return { newUser, newQ };
}

export async function applyEloUpdate(
  uid: string,
  question: FCQuestion,
  correct: boolean,
): Promise<{ newUserRating: number; newQRating: number }> {
  const r = getRedis();
  const ratings = await getUserRatings(uid);
  const userR = ratings[question.category];
  const { newUser, newQ } = eloUpdate(userR, question.rating, correct);
  await Promise.all([
    r.hset(K.ratings(uid), { [question.category]: newUser }),
    r.hset(K.question(question.id), {
      rating: newQ,
      num_answered: question.num_answered + 1,
    }),
    r.hincrby(K.numAnswered(uid, question.category), "n", 1),
  ]);
  return { newUserRating: newUser, newQRating: newQ };
}

// ====== LEADERBOARD ======

export async function postScore(
  game: FCGameMode,
  category: string | "all",
  uid: string,
  display_name: string,
  score: number,
  date_est: string,
): Promise<void> {
  const r = getRedis();
  const member = JSON.stringify({ uid, display_name });
  // post to all-time and daily/weekly windows
  await Promise.all([
    r.zadd(K.scoresLB(game, category, "all"), { score, member }),
    r.zadd(K.scoresLB(game, category, `d:${date_est}`), { score, member }),
    r.zadd(K.scoresLB(game, category, `w:${weekKey(date_est)}`), { score, member }),
  ]);
}

export async function getLeaderboard(
  game: FCGameMode,
  category: string,
  window: string,
  limit = 50,
): Promise<Array<{ uid: string; display_name: string; score: number }>> {
  const r = getRedis();
  const raw = await r.zrange<string[]>(K.scoresLB(game, category, window), 0, limit - 1, {
    rev: true,
    withScores: true,
  });
  const out: Array<{ uid: string; display_name: string; score: number }> = [];
  for (let i = 0; i < raw.length; i += 2) {
    try {
      const obj = JSON.parse(raw[i] as string);
      out.push({ ...obj, score: Number(raw[i + 1]) });
    } catch {
      // skip
    }
  }
  return out;
}

function weekKey(dateEst: string): string {
  // ISO week-ish: yyyy-Www
  const d = new Date(dateEst + "T00:00:00-05:00");
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
  );
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ====== STREAKS ======

export type Streak = { current: number; longest: number; last_played: string };

export async function getStreak(uid: string, game: FCGameMode): Promise<Streak> {
  const r = getRedis();
  const d = await r.hgetall<Record<string, string>>(K.streak(uid, game));
  return {
    current: parseInt(d?.current || "0", 10),
    longest: parseInt(d?.longest || "0", 10),
    last_played: d?.last_played || "",
  };
}

export async function updateStreak(
  uid: string,
  game: FCGameMode,
  correct: boolean,
  date_est: string,
): Promise<Streak> {
  const r = getRedis();
  const cur = await getStreak(uid, game);
  let newCurrent = 0;
  if (correct) {
    if (cur.last_played === prevDayEst(date_est) || cur.last_played === date_est) {
      newCurrent = cur.current + (cur.last_played === date_est ? 0 : 1);
    } else {
      newCurrent = 1;
    }
  }
  const newLongest = Math.max(cur.longest, newCurrent);
  await r.hset(K.streak(uid, game), {
    current: newCurrent,
    longest: newLongest,
    last_played: date_est,
  });
  return { current: newCurrent, longest: newLongest, last_played: date_est };
}

function prevDayEst(dateEst: string): string {
  const d = new Date(dateEst + "T00:00:00-05:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ====== DAILY ======

export async function getDailyHypo(date: string): Promise<string | null> {
  const r = getRedis();
  return (await r.get<string>(K.dailyHypo(date))) || null;
}

export async function setDailyHypo(date: string, qid: string): Promise<void> {
  const r = getRedis();
  await r.set(K.dailyHypo(date), qid);
}

export async function getDailyCase(date: string): Promise<string | null> {
  const r = getRedis();
  return (await r.get<string>(K.dailyCase(date))) || null;
}

export async function setDailyCase(date: string, caseId: string): Promise<void> {
  const r = getRedis();
  await r.set(K.dailyCase(date), caseId);
}

export async function getDailySubmission(
  uid: string,
  game: "daily-hypo" | "case-wordle",
  date: string,
): Promise<{ selected: string; correct: boolean; submitted_at: number } | null> {
  const r = getRedis();
  const d = await r.hgetall<Record<string, string>>(
    K.dailySubmission(uid, game, date),
  );
  if (!d || !d.selected) return null;
  return {
    selected: d.selected,
    correct: d.correct === "true",
    submitted_at: parseInt(d.submitted_at, 10),
  };
}

export async function setDailySubmission(
  uid: string,
  game: "daily-hypo" | "case-wordle",
  date: string,
  data: { selected: string; correct: boolean },
): Promise<void> {
  const r = getRedis();
  await r.hset(K.dailySubmission(uid, game, date), {
    ...data,
    submitted_at: Date.now(),
  });
}

// ====== EST DATE ======

export function todayEst(): string {
  const now = new Date();
  // EST = UTC-5; we use America/New_York for DST
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now); // YYYY-MM-DD
}
