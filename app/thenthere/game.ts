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
const SCHEDULE_START = "2026-09-04";
const SCHEDULE_DAYS = 100;

type ScheduledLens = {
  name: string;
  note: string;
  includes: (event: ThenThereEvent) => boolean;
};

const fieldSet = (...fields: string[]) => new Set(fields);
const SCHEDULED_LENSES: ScheduledLens[] = [
  {
    name: "Wars and diplomacy",
    note: "States collide, bargain, and redraw the map.",
    includes: (event) =>
      fieldSet(
        "Military history",
        "Diplomacy",
        "Geopolitics",
        "Naval history",
      ).has(event.field),
  },
  {
    name: "Exploration and the map",
    note: "Routes, frontiers, voyages, and the changing shape of the known world.",
    includes: (event) =>
      fieldSet(
        "Exploration",
        "Cartography",
        "Colonial history",
        "Space exploration",
      ).has(event.field),
  },
  {
    name: "Ideas in motion",
    note: "Science, medicine, philosophy, and the institutions that carried them.",
    includes: (event) =>
      fieldSet(
        "Science",
        "Medicine",
        "Physics",
        "Chemistry",
        "Biology",
        "Mathematics",
        "Philosophy",
        "Political thought",
      ).has(event.field),
  },
  {
    name: "Revolutions and rights",
    note: "Power changes hands, and people claim a new political order.",
    includes: (event) =>
      fieldSet(
        "Revolution",
        "Civil rights",
        "Decolonization",
        "Women’s history",
        "Labor history",
        "Human rights",
      ).has(event.field),
  },
  {
    name: "The built world",
    note: "Architecture, infrastructure, engineering, and the systems beneath daily life.",
    includes: (event) =>
      fieldSet(
        "Architecture",
        "Engineering",
        "Infrastructure",
        "Technology",
        "Communications",
      ).has(event.field),
  },
  {
    name: "Empires and states",
    note: "Courts, law, religion, and the long work of organizing power.",
    includes: (event) =>
      fieldSet(
        "Imperial politics",
        "State formation",
        "Dynastic history",
        "Legal history",
        "Religious history",
        "Constitutional history",
      ).has(event.field),
  },
  {
    name: "Culture and expression",
    note: "Books, music, art, language, and public imagination.",
    includes: (event) =>
      fieldSet(
        "Literature",
        "Music",
        "Art",
        "Film",
        "Theater",
        "Linguistics",
        "Writing systems",
      ).has(event.field),
  },
  {
    name: "Crisis and recovery",
    note: "Disaster, disease, migration, and the difficult work of rebuilding.",
    includes: (event) =>
      fieldSet("Disaster", "Epidemics", "Migration", "Archaeology").has(
        event.field,
      ),
  },
  {
    name: "Sport and spectacle",
    note: "Competition, crowds, and the political life of play.",
    includes: (event) =>
      fieldSet(
        "Baseball",
        "Sport",
        "Tennis",
        "Cycling",
        "Football",
        "Olympics",
        "Athletics",
        "Boxing",
        "Hockey",
      ).has(event.field),
  },
  {
    name: "Markets and modern life",
    note: "Trade, computing, aviation, and the forces remaking the present.",
    includes: (event) =>
      fieldSet(
        "Economic history",
        "Trade",
        "Computing",
        "Aviation",
        "Political history",
      ).has(event.field),
  },
];

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function scheduledLens(date: string) {
  const start = Date.parse(`${SCHEDULE_START}T00:00:00.000Z`);
  const current = Date.parse(`${date}T00:00:00.000Z`);
  const offset = Math.round((current - start) / 86_400_000);
  if (!Number.isFinite(offset) || offset < 0 || offset >= SCHEDULE_DAYS)
    return null;
  return SCHEDULED_LENSES[offset % SCHEDULED_LENSES.length];
}

export function dailyGame(date = todayKey()): {
  focus: Focus | null;
  edition: Pick<ScheduledLens, "name" | "note"> | null;
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
  const edition = scheduledLens(date),
    focus = edition
      ? null
      : seed % 5 === 0
        ? FOCUSES[Math.floor(rand() * FOCUSES.length)]
        : null,
    themedDeck = edition ? EVENTS.filter(edition.includes) : EVENTS,
    deck =
      focus?.deck ||
      (themedDeck.length >= ROUNDS_PER_GAME ? themedDeck : EVENTS);
  return {
    focus,
    edition,
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
    // A miss should teach rather than end the round. Keep the same L2
    // relationship, but give a wider shoulder before the score falls away.
    points =
      Math.round((MAX_ROUND_POINTS / (1 + (metric / 1.2) ** 1.45)) * 10) / 10,
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
