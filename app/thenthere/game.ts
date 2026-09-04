import {
  EVENTS,
  FOCUSES,
  type Event as ThenThereEvent,
  type Focus,
} from "./events";

export type Guess = { lat: number; lon: number; year: number };

export type ScoreResult = {
  points: number;
  distance: number;
  yearError: number;
  metric: number;
  eraScale: number;
  spaceScale: number;
  spaceLoss: number;
  timeLoss: number;
};

export type RoundRecord = ScoreResult & {
  field: string;
  title: string;
  guess: Guess;
  answer: Guess;
};

export type HistoryRun = {
  date: string;
  score: number;
  rounds: RoundRecord[];
};

export const ROUNDS_PER_GAME = 6;
export const MAX_ROUND_POINTS = 500;

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function dailyGame(date = todayKey()): {
  focus: Focus | null;
  questions: ThenThereEvent[];
} {
  let seed =
    [...date].reduce(
      (n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619),
      2166136261,
    ) >>> 0;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const focus =
      seed % 5 === 0 ? FOCUSES[Math.floor(rand() * FOCUSES.length)] : null,
    deck = focus?.deck || EVENTS;
  return {
    focus,
    questions: [...deck]
      .map((event) => ({ event, rank: rand() / event.weight }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, ROUNDS_PER_GAME)
      .map((x) => x.event),
  };
}

export function greatCircle(
  a: Pick<Guess, "lat" | "lon">,
  b: Pick<Guess, "lat" | "lon">,
) {
  const r = Math.PI / 180,
    dLat = (b.lat - a.lat) * r,
    dLon = (b.lon - a.lon) * r,
    h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function scoreGuess(guess: Guess, event: ThenThereEvent): ScoreResult {
  const distance = greatCircle(guess, event),
    yearError = Math.abs(guess.year - event.year),
    eraScale =
      event.timeScale ??
      Math.max(6, Math.min(140, (2026 - event.year) * 0.075)),
    spaceScale = event.spaceScale ?? 1800,
    spaceError = distance / spaceScale,
    timeError = yearError / eraScale,
    metric = Math.hypot(spaceError, timeError),
    points = Math.round((MAX_ROUND_POINTS / (1 + metric ** 1.65)) * 10) / 10,
    loss = MAX_ROUND_POINTS - points,
    spaceShare = metric ? spaceError ** 2 / metric ** 2 : 0.5,
    spaceLoss = Math.round(loss * spaceShare * 10) / 10,
    timeLoss = Math.round((loss - spaceLoss) * 10) / 10;
  return {
    points,
    distance,
    yearError,
    metric,
    eraScale,
    spaceScale,
    spaceLoss,
    timeLoss,
  };
}

export function makeRoundRecord(
  guess: Guess,
  event: ThenThereEvent,
): RoundRecord {
  return {
    ...scoreGuess(guess, event),
    field: event.field,
    title: event.title,
    guess,
    answer: { lat: event.lat, lon: event.lon, year: event.year },
  };
}
