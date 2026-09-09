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
// Day 0 of the question rotation. Editions used to be themed, one subject per
// day; now every day draws from the whole bank so the six questions feel
// unrelated to each other.
const ROTATION_START = "2026-09-04";

// A focus day -- a restricted map and timeline around one subject -- is a
// deliberate change of pace, so it lands on a fixed cadence rather than at
// random. One day in fourteen.
const FOCUS_EVERY = 14;

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dayIndex(date: string) {
  const start = Date.parse(`${ROTATION_START}T00:00:00.000Z`);
  const current = Date.parse(`${date}T00:00:00.000Z`);
  const offset = Math.round((current - start) / 86_400_000);
  return Number.isFinite(offset) ? offset : 0;
}

/**
 * A deterministic shuffle of 0..n-1, fixed for the lifetime of the bank.
 *
 * The schedule needs two things that pull against each other: a day's six
 * questions should look unrelated, and no question should come round again
 * soon. Drawing six at random each day satisfies the first and fails the
 * second -- with 453 events, repeats inside a fortnight are common.
 *
 * So instead the whole bank is shuffled once and dealt out six a day,
 * wrapping round at the end. Every event appears once per pass, which with
 * 453 events is a gap of roughly seventy-five days.
 */
function permutation(n: number) {
  let seed = (Math.imul(1, 2654435761) ^ 0x9e3779b9) >>> 0;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function dailyGame(date = todayKey()): {
  focus: Focus | null;
  questions: ThenThereEvent[];
} {
  const index = dayIndex(date);

  // Focus days are the exception: a fixed deck on a restricted map, cycling
  // through the available subjects.
  if (FOCUSES.length && index % FOCUS_EVERY === 0) {
    const focus =
      FOCUSES[
        ((Math.floor(index / FOCUS_EVERY) % FOCUSES.length) + FOCUSES.length) %
          FOCUSES.length
      ];
    if (focus.deck.length >= ROUNDS_PER_GAME) {
      let seed = (Math.imul(index + 7, 2246822519) ^ 0x85ebca6b) >>> 0;
      const rand = () => {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        return (seed >>> 0) / 4294967296;
      };
      return {
        focus,
        questions: [...focus.deck]
          .map((event) => ({ event, rank: rand() }))
          .sort((a, b) => a.rank - b.rank)
          .slice(0, ROUNDS_PER_GAME)
          .map((x) => x.event),
      };
    }
  }

  // One fixed shuffle of the whole bank, dealt six a day and wrapping round.
  //
  // A per-epoch reshuffle looked tidier but had a hole at the seam: an event
  // dealt on the last day of one shuffle could be dealt again on the first day
  // of the next, which in practice produced repeats four days apart. Dealing
  // cyclically from a single permutation removes the seam, so the gap between
  // one appearance and the next is always about a full pass of the bank.
  const order = permutation(EVENTS.length);
  const n = order.length;
  const from = (((index * ROUNDS_PER_GAME) % n) + n) % n;
  return {
    focus: null,
    questions: Array.from(
      { length: ROUNDS_PER_GAME },
      (_, k) => EVENTS[order[(from + k) % n]],
    ),
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
