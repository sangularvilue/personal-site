import { NextRequest, NextResponse } from "next/server";
import {
  dailyGame,
  makeRoundRecord,
  ROUNDS_PER_GAME,
  todayKey,
  type Guess,
  type HistoryRun,
} from "@/app/thenthere/game";
import { getRedis } from "@/lib/redis";

type BoardRow = { name: string; score: number };

const PLAYER_COOKIE = "then-there-player";
const RETENTION_SECONDS = 60 * 60 * 24 * 370;
const boardKey = (date: string) => `then-there:leaderboard:${date}`;
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
      [savedBoard, submission] = await Promise.all([
        redis.get<unknown>(boardKey(date)),
        redis.get(submissionKey(date, id)),
      ]),
      response = NextResponse.json({
        scores: cleanBoard(savedBoard),
        submitted: !!submission,
      });
    return setPlayerCookie(response, request, id);
  } catch {
    return NextResponse.json({ scores: [], submitted: false });
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

    const game = dailyGame(date),
      rounds = game.questions.map((event, index) =>
        makeRoundRecord(guesses[index], event),
      ),
      score = Math.round(
        rounds.reduce((total, round) => total + round.points, 0),
      ),
      run: HistoryRun = { date, score, rounds },
      oldBoard = cleanBoard(await redis.get<unknown>(boardKey(date))),
      scores = [...oldBoard, { name, score }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 20),
      oldHistory = await redis.get<HistoryRun[]>(historyKey(id)),
      history = [run, ...(Array.isArray(oldHistory) ? oldHistory : [])]
        .filter(
          (entry, index, all) =>
            all.findIndex((other) => other.date === entry.date) === index,
        )
        .slice(0, 370);

    await Promise.all([
      redis.set(boardKey(date), scores, { ex: 60 * 60 * 24 * 3 }),
      redis.set(
        submissionKey(date, id),
        { name, score },
        { ex: RETENTION_SECONDS },
      ),
      redis.set(historyKey(id), history, { ex: RETENTION_SECONDS }),
    ]);
    return setPlayerCookie(
      NextResponse.json({ scores, score, submitted: true }),
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
