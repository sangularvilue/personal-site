import { getRedis } from "./redis";
import type {
  LSATSkill,
  LSATQuestion,
  LSATUser,
  LSATRatings,
  LSATGameMode,
  LSATAttempt,
  LSATAnswerLetter,
  LSATSectionType,
} from "./lsat-types";
import { emptyRatings, LSAT_SKILLS } from "./lsat-types";

const K = {
  user: (id: string) => `lsat:user:${id}`,
  userByUsername: (u: string) => `lsat:user-by-username:${u.toLowerCase()}`,
  question: (id: string) => `lsat:q:${id}`,
  questionsBySkill: (s: LSATSkill) => `lsat:q-by-skill:${s}`,
  questionsBySection: (st: LSATSectionType) => `lsat:q-by-section:${st}`,
  questionsAll: "lsat:q-all",
  passage: (id: string) => `lsat:passage:${id}`,
  ratings: (uid: string) => `lsat:ratings:${uid}`,
  recentSeen: (uid: string) => `lsat:recent:${uid}`,
  attempts: (uid: string) => `lsat:attempts:${uid}`,
  attemptsByQ: (uid: string, qid: string) => `lsat:attempts-q:${uid}:${qid}`,
  attemptsAll: "lsat:attempts:all",
  scoresLB: (game: LSATGameMode, skill: string, window: string) =>
    `lsat:lb:${game}:${skill}:${window}`,
  numAnswered: (uid: string, skill: LSATSkill) =>
    `lsat:num-answered:${uid}:${skill}`,
  // Skill Spotter — stem-only classification game.
  spotterAttempts: (uid: string) => `lsat:spotter:${uid}`,
  spotterBest: (uid: string) => `lsat:spotter-best:${uid}`,
  // Streak — endurance run; longest correct chain.
  streakBest: (uid: string) => `lsat:streak-best:${uid}`,
  // Daily Edition — fixed set of 5 questions per day.
  dailySet: (date: string) => `lsat:daily:${date}`,
  dailySubmission: (uid: string, date: string) => `lsat:daily-sub:${uid}:${date}`,
};

// ====== USERS ======

export async function createUser(
  id: string,
  username: string,
  password_hash: string,
  display_name: string,
): Promise<LSATUser> {
  const r = getRedis();
  const user: LSATUser & { password_hash: string } = {
    id,
    username,
    display_name,
    created_at: Date.now(),
    password_hash,
  };
  await r.hset(K.user(id), user as unknown as Record<string, unknown>);
  await r.set(K.userByUsername(username), id);
  await r.hset(K.ratings(id), emptyRatings() as unknown as Record<string, unknown>);
  return user;
}

export async function getUserById(
  id: string,
): Promise<(LSATUser & { password_hash: string }) | null> {
  const r = getRedis();
  const data = await r.hgetall<LSATUser & { password_hash: string }>(K.user(id));
  if (!data || !data.id) return null;
  return data;
}

export async function getUserByUsername(
  username: string,
): Promise<(LSATUser & { password_hash: string }) | null> {
  const r = getRedis();
  const id = await r.get<string>(K.userByUsername(username));
  if (!id) return null;
  return getUserById(id);
}

// ====== QUESTIONS ======

export async function upsertQuestion(q: LSATQuestion): Promise<void> {
  const r = getRedis();
  await r.hset(K.question(q.id), {
    id: q.id,
    pt: q.pt,
    section_num: q.section_num,
    section_type: q.section_type,
    question_num: q.question_num,
    passage_id: q.passage_id ?? "",
    stem: q.stem,
    choice_a: q.choice_a,
    choice_b: q.choice_b,
    choice_c: q.choice_c,
    choice_d: q.choice_d,
    choice_e: q.choice_e,
    correct: q.correct,
    skill: q.skill,
    rating: q.rating,
    num_answered: q.num_answered,
  });
  await r.sadd(K.questionsBySkill(q.skill), q.id);
  await r.sadd(K.questionsBySection(q.section_type), q.id);
  await r.sadd(K.questionsAll, q.id);
}

export async function updateQuestionContent(
  id: string,
  patch: Partial<
    Pick<
      LSATQuestion,
      | "stem"
      | "choice_a"
      | "choice_b"
      | "choice_c"
      | "choice_d"
      | "choice_e"
      | "correct"
      | "skill"
    >
  >,
): Promise<void> {
  const r = getRedis();
  const existing = await getQuestion(id);
  if (!existing) throw new Error(`Question not found: ${id}`);
  // If skill changed, fix the skill-index sets.
  if (patch.skill && patch.skill !== existing.skill) {
    await r.srem(K.questionsBySkill(existing.skill), id);
    await r.sadd(K.questionsBySkill(patch.skill), id);
  }
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) fields[k] = v;
  }
  if (Object.keys(fields).length > 0) {
    await r.hset(K.question(id), fields);
  }
}

export async function getQuestion(id: string): Promise<LSATQuestion | null> {
  const r = getRedis();
  const data = await r.hgetall<Record<string, unknown>>(K.question(id));
  if (!data || !data.id) return null;
  return parseQuestionRow(data);
}

export async function getQuestionIdsBySkill(s: LSATSkill): Promise<string[]> {
  const r = getRedis();
  return (await r.smembers(K.questionsBySkill(s))) as string[];
}

export async function getQuestionIdsBySection(
  st: LSATSectionType,
): Promise<string[]> {
  const r = getRedis();
  return (await r.smembers(K.questionsBySection(st))) as string[];
}

export async function getAllQuestionIds(): Promise<string[]> {
  const r = getRedis();
  return (await r.smembers(K.questionsAll)) as string[];
}

export async function getQuestionsByIds(
  ids: string[],
): Promise<LSATQuestion[]> {
  const r = getRedis();
  if (ids.length === 0) return [];
  // Pipeline in chunks to avoid huge requests.
  const out: LSATQuestion[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const pipeline = r.pipeline();
    for (const id of chunk) pipeline.hgetall(K.question(id));
    const results = (await pipeline.exec()) as Array<
      Record<string, unknown> | null
    >;
    for (const d of results) {
      if (d && d.id) out.push(parseQuestionRow(d));
    }
  }
  return out;
}

function parseQuestionRow(d: Record<string, unknown>): LSATQuestion {
  const s = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
  const n = (k: string, def = 0) => {
    const v = d[k];
    if (typeof v === "number") return v;
    if (typeof v === "string") return parseInt(v, 10) || def;
    return def;
  };
  return {
    id: s("id"),
    pt: n("pt"),
    section_num: n("section_num"),
    section_type: s("section_type") as LSATSectionType,
    question_num: n("question_num"),
    passage_id: s("passage_id") || undefined,
    stem: s("stem"),
    choice_a: s("choice_a"),
    choice_b: s("choice_b"),
    choice_c: s("choice_c"),
    choice_d: s("choice_d"),
    choice_e: s("choice_e"),
    correct: (s("correct").toLowerCase() || "a") as LSATQuestion["correct"],
    skill: s("skill") as LSATSkill,
    rating: n("rating", 1000),
    num_answered: n("num_answered", 0),
  };
}

// ====== PASSAGES (RC) ======

export async function setPassageText(
  passageId: string,
  text: string,
): Promise<void> {
  const r = getRedis();
  await r.set(K.passage(passageId), text);
}

export async function getPassageText(
  passageId: string,
): Promise<string | null> {
  const r = getRedis();
  return (await r.get<string>(K.passage(passageId))) || null;
}

// ====== RATINGS ======

export async function getUserRatings(uid: string): Promise<LSATRatings> {
  const r = getRedis();
  const data = await r.hgetall<Record<string, string>>(K.ratings(uid));
  if (!data) return emptyRatings();
  const result = emptyRatings();
  for (const sk of LSAT_SKILLS) {
    if (data[sk]) result[sk] = parseInt(data[sk], 10);
  }
  return result;
}

// ====== ATTEMPTS / ELO ======

export async function logAttempt(
  uid: string,
  attempt: LSATAttempt,
): Promise<void> {
  const r = getRedis();
  const json = JSON.stringify(attempt);
  await Promise.all([
    r.lpush(K.attempts(uid), json),
    r.lpush(K.attemptsByQ(uid, attempt.question_id), json),
    r.lpush(K.attemptsAll, json),
    r.zadd(K.recentSeen(uid), {
      score: attempt.answered_at,
      member: attempt.question_id,
    }),
  ]);
  await r.ltrim(K.attempts(uid), 0, 9999);
  await r.ltrim(K.attemptsByQ(uid, attempt.question_id), 0, 49);
  await r.ltrim(K.attemptsAll, 0, 99999);
}

export async function getUserAttempts(
  uid: string,
  limit = 200,
): Promise<LSATAttempt[]> {
  const r = getRedis();
  const raw = (await r.lrange<string>(K.attempts(uid), 0, limit - 1)) as Array<
    string | LSATAttempt
  >;
  return raw
    .map((x) => {
      if (typeof x === "string") {
        try {
          return JSON.parse(x) as LSATAttempt;
        } catch {
          return null;
        }
      }
      return x;
    })
    .filter((x): x is LSATAttempt => x !== null);
}

export async function getQuestionAttemptsForUser(
  uid: string,
  qid: string,
): Promise<LSATAttempt[]> {
  const r = getRedis();
  const raw = (await r.lrange<string>(
    K.attemptsByQ(uid, qid),
    0,
    49,
  )) as Array<string | LSATAttempt>;
  return raw
    .map((x) => {
      if (typeof x === "string") {
        try {
          return JSON.parse(x) as LSATAttempt;
        } catch {
          return null;
        }
      }
      return x;
    })
    .filter((x): x is LSATAttempt => x !== null);
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
  question: LSATQuestion,
  correct: boolean,
): Promise<{ newUserRating: number; newQRating: number }> {
  const r = getRedis();
  const ratings = await getUserRatings(uid);
  const userR = ratings[question.skill] ?? 1000;
  const { newUser, newQ } = eloUpdate(userR, question.rating, correct);
  await Promise.all([
    r.hset(K.ratings(uid), { [question.skill]: newUser }),
    r.hset(K.question(question.id), {
      rating: newQ,
      num_answered: question.num_answered + 1,
    }),
    r.hincrby(K.numAnswered(uid, question.skill), "n", 1),
  ]);
  return { newUserRating: newUser, newQRating: newQ };
}

// ====== LEADERBOARD ======

export async function postScore(
  game: LSATGameMode,
  skill: string | "all",
  uid: string,
  display_name: string,
  score: number,
  date_est: string,
): Promise<void> {
  const r = getRedis();
  const member = JSON.stringify({ uid, display_name });
  await Promise.all([
    r.zadd(K.scoresLB(game, skill, "all"), { score, member }),
    r.zadd(K.scoresLB(game, skill, `d:${date_est}`), { score, member }),
    r.zadd(K.scoresLB(game, skill, `w:${weekKey(date_est)}`), {
      score,
      member,
    }),
  ]);
}

export async function getLeaderboard(
  game: LSATGameMode,
  skill: string,
  window: string,
  limit = 50,
): Promise<Array<{ uid: string; display_name: string; score: number }>> {
  const r = getRedis();
  const raw = await r.zrange<string[]>(
    K.scoresLB(game, skill, window),
    0,
    limit - 1,
    { rev: true, withScores: true },
  );
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
  const d = new Date(dateEst + "T00:00:00-05:00");
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
  );
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function todayEst(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}

// ====== SKILL SPOTTER ======

export type SpotterAttempt = {
  question_id: string;
  predicted: LSATSkill;
  actual: LSATSkill;
  correct: boolean;
  ms_to_answer: number;
  answered_at: number;
  session_id: string;
};

export async function logSpotterAttempt(
  uid: string,
  attempt: SpotterAttempt,
): Promise<void> {
  const r = getRedis();
  await r.lpush(K.spotterAttempts(uid), JSON.stringify(attempt));
  await r.ltrim(K.spotterAttempts(uid), 0, 4999);
}

export async function getSpotterBest(uid: string): Promise<number> {
  const r = getRedis();
  const v = await r.get<string | number>(K.spotterBest(uid));
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseInt(v, 10) || 0;
  return 0;
}

export async function setSpotterBest(uid: string, score: number): Promise<void> {
  const r = getRedis();
  const cur = await getSpotterBest(uid);
  if (score > cur) await r.set(K.spotterBest(uid), score);
}

// ====== STREAK ======

export async function getStreakBest(uid: string): Promise<number> {
  const r = getRedis();
  const v = await r.get<string | number>(K.streakBest(uid));
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseInt(v, 10) || 0;
  return 0;
}

export async function setStreakBest(uid: string, n: number): Promise<void> {
  const r = getRedis();
  const cur = await getStreakBest(uid);
  if (n > cur) await r.set(K.streakBest(uid), n);
}

// ====== DAILY EDITION ======

// Pick 5 question ids deterministically per date. Uses a hash-based seed so the
// same date always maps to the same set, but varies day-to-day.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function dateSeed(dateEst: string): number {
  let h = 0;
  for (let i = 0; i < dateEst.length; i++) {
    h = (h * 31 + dateEst.charCodeAt(i)) >>> 0;
  }
  return h;
}

export async function getDailySet(date: string): Promise<string[]> {
  const r = getRedis();
  const cached = await r.get<string | string[]>(K.dailySet(date));
  if (cached) {
    if (Array.isArray(cached)) return cached.filter((x): x is string => typeof x === "string");
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  // Compute fresh: pick 5 ids deterministically from the full pool.
  const all = await getAllQuestionIds();
  if (all.length === 0) return [];
  const shuffled = seededShuffle(all, dateSeed(date));
  const picked = shuffled.slice(0, 5);
  await r.set(K.dailySet(date), JSON.stringify(picked));
  return picked;
}

export type DailySubmission = {
  date: string;
  picks: Record<string, LSATAnswerLetter | null>; // qid -> selected letter
  correct_count: number;
  score: number;
  submitted_at: number;
};

export async function getDailySubmission(
  uid: string,
  date: string,
): Promise<DailySubmission | null> {
  const r = getRedis();
  const v = await r.get<string | DailySubmission>(K.dailySubmission(uid, date));
  if (!v) return null;
  if (typeof v === "object") return v as DailySubmission;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export async function setDailySubmission(
  uid: string,
  date: string,
  sub: DailySubmission,
): Promise<void> {
  const r = getRedis();
  await r.set(K.dailySubmission(uid, date), JSON.stringify(sub));
}

