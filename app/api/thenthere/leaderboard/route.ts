import { NextRequest, NextResponse } from "next/server";
import {
  dailyGame,
  makeRoundRecord,
  ROUNDS_PER_GAME,
  todayKey,
  type Guess,
  type HistoryRun,
} from "@/app/thenthere/game";
import {
  boardMember,
  rankedRows,
  type RankedBoardRow,
} from "@/app/thenthere/leaderboard-rows";
import { getRedis } from "@/lib/redis";

type BoardRow = { name: string; score: number };
type PlayerPlacement = { rank: number; total: number; scores: RankedBoardRow[] };

const PLAYER_COOKIE = "then-there-player";
const RETENTION_SECONDS = 60 * 60 * 24 * 370;
const BOARD_RETENTION_SECONDS = 60 * 60 * 24 * 3;
// A fresh namespace intentionally leaves the former client-trusted board
// behind; every row here has been recomputed by this route.
const boardKey = (date: string) => `then-there:verified-leaderboard:${date}`;
const boardIndexKey = (date: string) => `then-there:verified-leaderboard-index:${date}`;
const submissionKey = (date: string, playerId: string) =>
  `then-there:submission:${date}:${playerId}`;
const historyKey = (playerId: string) => `then-there:history:${playerId}`;
const attemptKey = (date: string, playerId: string) =>
  `then-there:attempts:${date}:${playerId}`;
const seededNames = new Set(["atlas_finch", "yearzero", "cicero_7"]);

function playerId(request: NextRequest) {
  return request.cookies.get(PLAYER_COOKIE)?.value || crypto.randomUUID();
}

function setPlayerCookie(
  response: NextResponse,
  request: NextRequest,
  id: string,
) {
  if (!request.cookies.get(PLAYER_COOKIE)?.value) {
    response.cookies.set(PLAYER_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: RETENTION_SECONDS,
      path: "/",
    });
  }
  return response;
}

function cleanBoard(value: unknown): BoardRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (row): row is BoardRow =>
        !!row &&
        typeof row.name === "string" &&
        typeof row.score === "number" &&
        Number.isFinite(row.score) &&
        !seededNames.has(row.name),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

async function ensureBoardIndex(date: string, redis: ReturnType<typeof getRedis>) {
  const key = boardIndexKey(date);
  if (await redis.zcard(key)) return;

  // Import the previous top-20 snapshot once. The old store discarded lower
  // ranks, so new submissions are indexed individually from this deployment on.
  const oldBoard = cleanBoard(await redis.get<unknown>(boardKey(date)));
  await Promise.all(
    oldBoard.map((row, index) =>
      redis.zadd(key, {
        score: row.score,
        member: boardMember(`legacy:${index}`, row.name),
      }),
    ),
  );
  await redis.expire(key, BOARD_RETENTION_SECONDS);
}

async function ensurePlayerIndexed(
  date: string,
  redis: ReturnType<typeof getRedis>,
  id: string,
  submission: BoardRow,
) {
  const key = boardIndexKey(date);
  const member = boardMember(id, submission.name);
  if ((await redis.zrevrank(key, member)) !== null) return;

  // Replace this player's legacy top-20 row when it can be identified by its
  // saved submission. Older runs outside that snapshot were not retained.
  const oldBoard = cleanBoard(await redis.get<unknown>(boardKey(date)));
  for (let index = 0; index < oldBoard.length; index++) {
    const row = oldBoard[index]!;
    if (row.name !== submission.name || row.score !== submission.score) continue;
    const legacy = boardMember(`legacy:${index}`, row.name);
    if ((await redis.zrevrank(key, legacy)) !== null) {
      await redis.zrem(key, legacy);
      break;
    }
  }
  await redis.zadd(key, { score: submission.score, member });
}

async function boardView(
  date: string,
  redis: ReturnType<typeof getRedis>,
  id: string,
) {
  await ensureBoardIndex(date, redis);
  const submission = await redis.get<BoardRow>(submissionKey(date, id));
  const hasSubmission =
    !!submission &&
    typeof submission.name === "string" &&
    typeof submission.score === "number" &&
    Number.isFinite(submission.score);

  if (hasSubmission) await ensurePlayerIndexed(date, redis, id, submission);
  await redis.expire(boardIndexKey(date), BOARD_RETENTION_SECONDS);

  const [top, total] = await Promise.all([
    redis.zrange<unknown[]>(boardIndexKey(date), 0, 19, {
      rev: true,
      withScores: true,
    }),
    redis.zcard(boardIndexKey(date)),
  ]);
  const scores = rankedRows(top).map(({ name, score }) => ({ name, score }));

  let player: PlayerPlacement | null = null;
  if (hasSubmission) {
    const rankIndex = await redis.zrevrank(
      boardIndexKey(date),
      boardMember(id, submission.name),
    );
    if (rankIndex !== null) {
      const firstIndex = Math.max(0, rankIndex - 1);
      const nearby = await redis.zrange<unknown[]>(
        boardIndexKey(date),
        firstIndex,
        rankIndex + 1,
        { rev: true, withScores: true },
      );
      player = {
        rank: rankIndex + 1,
        total,
        scores: rankedRows(nearby, firstIndex + 1),
      };
    }
  }

  return { scores, player };
}

function parseGuesses(value: unknown): Guess[] | null {
  if (!Array.isArray(value) || value.length !== ROUNDS_PER_GAME) return null;
  const guesses: Guess[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const { lat, lon, year } = entry as Record<string, unknown>;
    if (
      typeof lat !== "number" ||
      typeof lon !== "number" ||
      typeof year !== "number" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      !Number.isFinite(year) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180 ||
      year < -4000 ||
      year > 2026
    ) {
      return null;
    }
    guesses.push({ lat, lon, year });
  }
  return guesses;
}

export async function GET(request: NextRequest) {
  try {
    const date = todayKey(),
      id = playerId(request),
      redis = getRedis(),
      { scores, player } = await boardView(date, redis, id),
      response = NextResponse.json({
        scores,
        player,
        submitted: !!(await redis.get(submissionKey(date, id))),
      });
    return setPlayerCookie(response, request, id);
  } catch {
    return NextResponse.json(
      { error: "Leaderboard unavailable.", scores: [], player: null, submitted: false },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(),
      name = String(body.name || "")
        .trim()
        .replace(/[^a-zA-Z0-9 _.-]/g, "")
        .slice(0, 18),
      guesses = parseGuesses(body.answers);
    if (!name || !guesses) {
      return NextResponse.json(
        { error: "Invalid verified run." },
        { status: 400 },
      );
    }

    const date = todayKey(),
      id = playerId(request),
      redis = getRedis();
    if (await redis.get(submissionKey(date, id))) {
      return setPlayerCookie(
        NextResponse.json(
          { error: "This browser has already submitted today’s run." },
          { status: 409 },
        ),
        request,
        id,
      );
    }

    // This is deliberately gentle: it prevents a broken client or casual
    // automation from hammering the write endpoint without getting in the way
    // of someone correcting an ordinary network hiccup.
    const attempts = await redis.incr(attemptKey(date, id));
    if (attempts === 1) await redis.expire(attemptKey(date, id), 60 * 10);
    if (attempts > 5) {
      return setPlayerCookie(
        NextResponse.json(
          { error: "Please wait a few minutes before trying again." },
          { status: 429 },
        ),
        request,
        id,
      );
    }

    await ensureBoardIndex(date, redis);

    const game = dailyGame(date),
      rounds = game.questions.map((event, index) =>
        makeRoundRecord(guesses[index], event),
      ),
      score = Math.round(
        rounds.reduce((total, round) => total + round.points, 0),
      ),
      run: HistoryRun = { date, score, rounds },
      oldHistory = await redis.get<HistoryRun[]>(historyKey(id)),
      history = [run, ...(Array.isArray(oldHistory) ? oldHistory : [])]
        .filter(
          (entry, index, all) =>
            all.findIndex((other) => other.date === entry.date) === index,
        )
        .slice(0, 370);

    await Promise.all([
      redis.zadd(boardIndexKey(date), {
        score,
        member: boardMember(id, name),
      }),
      redis.expire(boardIndexKey(date), BOARD_RETENTION_SECONDS),
      redis.set(
        submissionKey(date, id),
        { name, score },
        { ex: RETENTION_SECONDS },
      ),
      redis.set(historyKey(id), history, { ex: RETENTION_SECONDS }),
    ]);
    const { scores, player } = await boardView(date, redis, id);
    return setPlayerCookie(
      NextResponse.json({ scores, score, player, submitted: true }),
      request,
      id,
    );
  } catch {
    return NextResponse.json(
      { error: "Could not verify this run." },
      { status: 500 },
    );
  }
}
