"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { GlobePoint } from "./Globe";

type Event = GlobePoint & {
  title: string;
  year: number;
  place: string;
  field: string;
  weight: number;
  years?: [number, number];
  spaceScale?: number;
  timeScale?: number;
};
type Result = {
  points: number;
  distance: number;
  yearError: number;
  metric: number;
  eraScale: number;
  spaceScale: number;
};
type BoardRow = { name: string; score: number };
type Focus = {
  name: string;
  note: string;
  years: [number, number];
  view: GlobePoint & { distance: number };
  deck: Event[];
};

const EVENTS: Event[] = [
  [
    "Constantine wins the Battle of the Milvian Bridge.",
    312,
    41.94,
    12.47,
    "Rome, Italy",
    "Imperial politics",
    4,
  ],
  [
    "Pride and Prejudice is first published.",
    1813,
    51.51,
    -0.13,
    "London, England",
    "Literature",
    3,
  ],
  [
    "The Gutenberg Bible comes off the press.",
    1455,
    50,
    8.27,
    "Mainz, Germany",
    "Technology",
    4,
  ],
  [
    "Mansa Musa arrives in Cairo on his pilgrimage.",
    1324,
    30.04,
    31.24,
    "Cairo, Egypt",
    "Economic history",
    3,
  ],
  [
    "Mehmed II captures Constantinople.",
    1453,
    41.01,
    28.98,
    "Constantinople",
    "Military history",
    5,
  ],
  [
    "Haiti declares its independence.",
    1804,
    19.45,
    -72.68,
    "Gonaïves, Haiti",
    "Revolution",
    4,
  ],
  [
    "The Meiji Restoration is proclaimed.",
    1868,
    35.68,
    139.76,
    "Tokyo, Japan",
    "State formation",
    4,
  ],
  [
    "The Wright brothers make the first controlled powered flight.",
    1903,
    36.02,
    -75.67,
    "Kitty Hawk, USA",
    "Aviation",
    3,
  ],
  [
    "India becomes independent from British rule.",
    1947,
    28.61,
    77.21,
    "New Delhi, India",
    "Decolonization",
    5,
  ],
  [
    "The double-helix structure of DNA is published.",
    1953,
    52.21,
    0.12,
    "Cambridge, England",
    "Science",
    2,
  ],
  [
    "The Treaty of Tordesillas divides new lands between two crowns.",
    1494,
    41.5,
    -5,
    "Tordesillas, Spain",
    "Diplomacy",
    4,
  ],
  [
    "Hiram Bingham reaches Machu Picchu.",
    1911,
    -13.16,
    -72.55,
    "Cusco Region, Peru",
    "Archaeology",
    2,
  ],
  [
    "French soldiers uncover the Rosetta Stone.",
    1799,
    31.4,
    30.42,
    "Rashid, Egypt",
    "Linguistics",
    2,
  ],
  [
    "King John seals Magna Carta.",
    1215,
    51.44,
    -0.57,
    "Runnymede, England",
    "Legal history",
    4,
  ],
  [
    "The Zulu army defeats a British column at Isandlwana.",
    1879,
    -28.36,
    30.65,
    "Isandlwana, South Africa",
    "Colonial history",
    3,
  ],
  [
    "The Song dynasty is founded.",
    960,
    34.8,
    114.31,
    "Kaifeng, China",
    "Dynastic history",
    3,
  ],
  [
    "Ashoka conquers Kalinga.",
    -261,
    20.27,
    85.84,
    "Odisha, India",
    "Ancient history",
    3,
  ],
  [
    "Writing emerges in the city of Uruk.",
    -3200,
    31.32,
    45.64,
    "Uruk, Mesopotamia",
    "Writing systems",
    3,
  ],
  [
    "Akhenaten establishes a new capital at Amarna.",
    -1346,
    27.65,
    30.9,
    "Amarna, Egypt",
    "Religious history",
    2,
  ],
  [
    "The first modern Olympic Games open.",
    1896,
    37.98,
    23.73,
    "Athens, Greece",
    "Sport",
    2,
  ],
  [
    "The gold rush begins after discovery at Sutter’s Mill.",
    1848,
    38.8,
    -120.89,
    "Coloma, USA",
    "Migration",
    2,
  ],
  [
    "The Berlin Conference convenes to regulate European colonization.",
    1884,
    52.52,
    13.4,
    "Berlin, Germany",
    "Geopolitics",
    5,
  ],
  [
    "The first successful smallpox vaccination is administered.",
    1796,
    51.71,
    -2.5,
    "Berkeley, England",
    "Medicine",
    2,
  ],
  [
    "The Panama Canal opens to traffic.",
    1914,
    9.08,
    -79.68,
    "Panama",
    "Infrastructure",
    3,
  ],
].map(
  ([title, year, lat, lon, place, field, weight]) =>
    ({ title, year, lat, lon, place, field, weight }) as Event,
);

EVENTS.push(
  {
    title: "The first modern World Series begins.",
    year: 1903,
    lat: 42.35,
    lon: -71.1,
    place: "Boston, USA",
    field: "Baseball",
    weight: 2,
    years: [1800, 2026],
    spaceScale: 700,
    timeScale: 18,
  },
  {
    title: "Jackie Robinson makes his major-league debut.",
    year: 1947,
    lat: 40.67,
    lon: -73.97,
    place: "Brooklyn, USA",
    field: "Baseball",
    weight: 2,
    years: [1800, 2026],
    spaceScale: 500,
    timeScale: 12,
  },
  {
    title: "Babe Ruth hits his sixtieth home run of the season.",
    year: 1927,
    lat: 40.83,
    lon: -73.93,
    place: "New York, USA",
    field: "Baseball",
    weight: 1,
    years: [1800, 2026],
    spaceScale: 450,
    timeScale: 10,
  },
  {
    title: "The first international cricket match is played.",
    year: 1844,
    lat: 40.73,
    lon: -74,
    place: "New York, USA",
    field: "Sport",
    weight: 1,
    years: [1700, 2026],
    spaceScale: 800,
    timeScale: 20,
  },
);

const e = (
  title: string,
  year: number,
  lat: number,
  lon: number,
  place: string,
  field: string,
): Event => ({ title, year, lat, lon, place, field, weight: 3 });
const FOCUSES: Focus[] = [
  {
    name: "The Second World War",
    note: "A global war, fifteen years close",
    years: [1931, 1946],
    view: { lat: 45, lon: 25, distance: 2.65 },
    deck: [
      e(
        "Germany invades Poland.",
        1939,
        52.23,
        21.01,
        "Warsaw, Poland",
        "European theater",
      ),
      e(
        "The evacuation from Dunkirk begins.",
        1940,
        51.04,
        2.38,
        "Dunkirk, France",
        "European theater",
      ),
      e(
        "Japan attacks Pearl Harbor.",
        1941,
        21.36,
        -157.95,
        "Oahu, Hawaii",
        "Pacific theater",
      ),
      e(
        "The Battle of Stalingrad ends.",
        1943,
        48.71,
        44.51,
        "Stalingrad",
        "Eastern Front",
      ),
      e(
        "Allied forces land in Normandy.",
        1944,
        49.34,
        -0.62,
        "Normandy, France",
        "European theater",
      ),
      e(
        "An atomic bomb is dropped on Hiroshima.",
        1945,
        34.39,
        132.45,
        "Hiroshima, Japan",
        "Pacific theater",
      ),
      e(
        "Japan formally surrenders aboard the USS Missouri.",
        1945,
        35.29,
        139.67,
        "Tokyo Bay",
        "Pacific theater",
      ),
    ],
  },
  {
    name: "Japanese history",
    note: "An archipelago across twelve centuries",
    years: [700, 1950],
    view: { lat: 37, lon: 138, distance: 2.05 },
    deck: [
      e(
        "The imperial capital moves to Heian-kyō.",
        794,
        35.01,
        135.77,
        "Kyoto, Japan",
        "Heian period",
      ),
      e(
        "The Kamakura shogunate is established.",
        1192,
        35.32,
        139.55,
        "Kamakura, Japan",
        "Kamakura period",
      ),
      e(
        "The Battle of Sekigahara establishes Tokugawa dominance.",
        1600,
        35.37,
        136.46,
        "Sekigahara, Japan",
        "Sengoku period",
      ),
      e(
        "The Tokugawa shogunate is established.",
        1603,
        35.68,
        139.76,
        "Edo, Japan",
        "Edo period",
      ),
      e(
        "Commodore Perry enters Edo Bay.",
        1853,
        35.24,
        139.72,
        "Uraga, Japan",
        "Bakumatsu",
      ),
      e(
        "The Meiji Restoration is proclaimed.",
        1868,
        35.68,
        139.76,
        "Tokyo, Japan",
        "Meiji period",
      ),
      e(
        "The Great Kantō earthquake strikes.",
        1923,
        35.44,
        139.64,
        "Kantō, Japan",
        "Social history",
      ),
    ],
  },
  {
    name: "The Scientific Revolution",
    note: "Observation changes the world",
    years: [1450, 1750],
    view: { lat: 49, lon: 11, distance: 2.3 },
    deck: [
      e(
        "Copernicus’s De revolutionibus is published.",
        1543,
        54.35,
        18.65,
        "Gdańsk, Poland",
        "Astronomy",
      ),
      e(
        "Tycho Brahe begins building Uraniborg.",
        1576,
        55.91,
        12.69,
        "Hven, Denmark",
        "Astronomy",
      ),
      e(
        "Galileo demonstrates his telescope in Venice.",
        1609,
        45.44,
        12.33,
        "Venice, Italy",
        "Astronomy",
      ),
      e(
        "William Harvey publishes his account of blood circulation.",
        1628,
        50.11,
        8.68,
        "Frankfurt, Germany",
        "Medicine",
      ),
      e(
        "The Royal Society is founded.",
        1660,
        51.51,
        -0.12,
        "London, England",
        "Institutions",
      ),
      e(
        "Newton’s Principia is published.",
        1687,
        51.51,
        -0.12,
        "London, England",
        "Physics",
      ),
      e(
        "Leeuwenhoek reports microorganisms.",
        1676,
        52.01,
        4.36,
        "Delft, Netherlands",
        "Microscopy",
      ),
    ],
  },
];

const FALLBACK: BoardRow[] = [
  { name: "atlas_finch", score: 2468 },
  { name: "yearzero", score: 2312 },
  { name: "cicero_7", score: 2190 },
];
const ZOOM_SPANS = [6026, 1200, 240, 40, 4, 0.2],
  ZOOM_LABELS = [
    "millennia",
    "centuries",
    "decades",
    "years",
    "months",
    "days",
  ];
function dailyGame() {
  let seed =
    [...new Date().toISOString().slice(0, 10)].reduce(
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
      .slice(0, 6)
      .map((x) => x.event),
  };
}
function yearLabel(year: number, detailed = false) {
  if (detailed && Math.abs(year - Math.round(year)) > 0.005) {
    const whole = Math.floor(year),
      month = Math.max(1, Math.min(12, Math.round((year - whole) * 12 + 1)));
    return `${new Date(2000, month - 1).toLocaleString("en", { month: "short" })} ${Math.abs(whole)} ${whole < 0 ? "BC" : "AD"}`;
  }
  return `${Math.round(Math.abs(year))} ${year < 0 ? "BC" : "AD"}`;
}
function greatCircle(a: GlobePoint, b: GlobePoint) {
  const r = Math.PI / 180,
    dLat = (b.lat - a.lat) * r,
    dLon = (b.lon - a.lon) * r,
    h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function scoreGuess(guess: GlobePoint, year: number, event: Event): Result {
  const distance = greatCircle(guess, event),
    yearError = Math.abs(year - event.year),
    eraScale =
      event.timeScale ??
      Math.max(6, Math.min(140, (2026 - event.year) * 0.075)),
    spaceScale = event.spaceScale ?? 1800;
  const metric = Math.hypot(distance / spaceScale, yearError / eraScale),
    points = Math.round((500 / (1 + metric ** 1.65)) * 10) / 10;
  return { points, distance, yearError, metric, eraScale, spaceScale };
}

export default function ThenThere() {
  const daily = useMemo(dailyGame, []),
    questions = daily.questions,
    focus = daily.focus;
  const startYear = (item: Event) =>
    focus
      ? (focus.years[0] + focus.years[1]) / 2
      : item.years
        ? (item.years[0] + item.years[1]) / 2
        : 1000;
  const initialYear = startYear(questions[0]);
  const [round, setRound] = useState(0),
    [year, setYear] = useState(initialYear),
    [zoom, setZoom] = useState(0);
  const [guess, setGuess] = useState<GlobePoint | null>(null),
    [result, setResult] = useState<Result | null>(null),
    [total, setTotal] = useState(0),
    [finished, setFinished] = useState(false);
  const [name, setName] = useState(""),
    [board, setBoard] = useState<BoardRow[]>(FALLBACK),
    [posted, setPosted] = useState(false),
    hold = useRef<ReturnType<typeof setInterval> | null>(null);
  const event = questions[round],
    bounds: [number, number] = focus?.years || event.years || [-4000, 2026],
    span = Math.min(ZOOM_SPANS[zoom], bounds[1] - bounds[0]),
    min = Math.max(bounds[0], year - span / 2),
    max = Math.min(bounds[1], year + span / 2);
  const nudge =
    zoom >= 4 ? 1 : zoom === 3 ? 5 : zoom === 2 ? 20 : zoom === 1 ? 100 : 500;
  const nudgeYear = (amount: number) => {
    setYear((y) => Math.max(bounds[0], Math.min(bounds[1], y + amount)));
    setResult(null);
  };
  useEffect(() => {
    document.body.classList.add("then-there-mode");
    return () => document.body.classList.remove("then-there-mode");
  }, []);
  useEffect(() => {
    fetch("/api/thenthere/leaderboard")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setBoard(d.scores))
      .catch(() => {});
  }, []);
  const stopHold = useCallback(() => {
    if (hold.current) clearInterval(hold.current);
    hold.current = null;
  }, []);
  const startHold = () => {
    stopHold();
    hold.current = setInterval(
      () => setZoom((z) => Math.min(ZOOM_SPANS.length - 1, z + 1)),
      620,
    );
  };
  useEffect(() => stopHold, [stopHold]);
  const choose = (p: GlobePoint) => {
    if (!result) setGuess(p);
  };
  const lock = () => {
    if (!guess || result) return;
    const next = scoreGuess(guess, year, event);
    setResult(next);
    setTotal((t) => Math.round((t + next.points) * 10) / 10);
  };
  const advance = () => {
    if (round === 5) {
      setFinished(true);
      return;
    }
    setRound((r) => r + 1);
    setGuess(null);
    setResult(null);
    setYear(startYear(questions[round + 1]));
    setZoom(0);
  };
  const reset = () => {
    setRound(0);
    setYear(initialYear);
    setZoom(0);
    setGuess(null);
    setResult(null);
    setTotal(0);
    setFinished(false);
    setPosted(false);
    setName("");
  };
  const submit = async () => {
    if (!name.trim() || posted) return;
    try {
      const r = await fetch("/api/thenthere/leaderboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), score: Math.round(total) }),
      });
      if (r.ok) setBoard((await r.json()).scores);
    } catch {}
    setPosted(true);
  };
  if (finished)
    return (
      <main className="tt-shell">
        <Header total={total} />
        <section className="tt-end">
          <div className="tt-final">
            <p>Today’s expedition</p>
            <strong>{Math.round(total).toLocaleString()}</strong>
            <span>out of 3,000</span>
            <h1>
              {total > 2200
                ? "You knew where history stood."
                : total > 1400
                  ? "A respectable passage through time."
                  : "The map remembers. Try again tomorrow."}
            </h1>
            <button onClick={reset}>↻ Play again</button>
          </div>
          <aside className="tt-leader">
            <h2>♜ Today’s leaders</h2>
            <ol>
              {board.slice(0, 5).map((row, i) => (
                <li key={`${row.name}-${i}`}>
                  <span>{i + 1}</span>
                  <b>{row.name}</b>
                  <strong>{row.score.toLocaleString()}</strong>
                </li>
              ))}
            </ol>
            <label>Post your score</label>
            <div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 18))}
                placeholder="your name"
                disabled={posted}
              />
              <button onClick={submit} disabled={!name.trim() || posted}>
                {posted ? "Posted" : "Join board"}
              </button>
            </div>
          </aside>
        </section>
      </main>
    );
  return (
    <main className="tt-shell">
      <Header total={total} round={round} />
      <section className="tt-play">
        <div className="tt-prompt">
          <div>
            {focus && (
              <div className="tt-focus">
                <b>Today’s focus</b>
                <span>{focus.name}</span>
                <em>{focus.note}</em>
              </div>
            )}
            <p className="tt-kicker">
              Round {round + 1} of 6 <span>{event.field}</span>
            </p>
            <h1>{event.title}</h1>
            <p className="tt-instruction">Place it in space and time.</p>
          </div>
          <div className="tt-globe-wrap">
            <Globe
              guess={guess}
              answer={result ? event : null}
              locked={!!result}
              onGuess={choose}
              view={focus?.view}
            />
            {!guess && (
              <p className="tt-globe-hint">Drag to rotate · click to mark</p>
            )}
            <div className="tt-globe-key">
              <span className="guess-dot" />
              guess{" "}
              {result && (
                <>
                  <span className="answer-dot" />
                  answer
                </>
              )}
            </div>
          </div>
        </div>
        <aside className="tt-time">
          <div className="tt-year">
            <p>Your year</p>
            <strong>
              {yearLabel(year, zoom > 3).replace(/ (BC|AD)$/, "")}
            </strong>
            <span>{year < 0 ? "BC" : "AD"}</span>
          </div>
          <div className="tt-zoom">
            <button
              onClick={() => setZoom((z) => Math.max(0, z - 1))}
              disabled={zoom === 0}
              aria-label="Zoom timeline out"
            >
              −
            </button>
            <span>
              <small>Timeline scale</small>
              {ZOOM_LABELS[zoom]}
            </span>
            <div className="tt-zoom-bars">
              {ZOOM_LABELS.map((_, i) => (
                <i key={i} className={i <= zoom ? "on" : ""} />
              ))}
            </div>
            <button
              onClick={() =>
                setZoom((z) => Math.min(ZOOM_SPANS.length - 1, z + 1))
              }
              disabled={zoom === ZOOM_SPANS.length - 1}
              aria-label="Zoom timeline in"
            >
              +
            </button>
          </div>
          <div className="tt-window">
            <button onClick={() => nudgeYear(-nudge)}>← {nudge}y</button>
            <span>
              Available: {yearLabel(bounds[0])}–{yearLabel(bounds[1])}
            </span>
            <button onClick={() => nudgeYear(nudge)}>{nudge}y →</button>
          </div>
          <div
            className="tt-timeline"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerCancel={stopHold}
            onPointerLeave={stopHold}
          >
            <input
              type="range"
              aria-label="Choose a year"
              min={min}
              max={max}
              step={zoom === 5 ? 1 / 365 : zoom === 4 ? 1 / 12 : 1}
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value));
                setResult(null);
              }}
            />
            <div>
              <span>{yearLabel(min)}</span>
              <span>{yearLabel((min + max) / 2)}</span>
              <span>{yearLabel(max)}</span>
            </div>
          </div>
          <p className="tt-note">
            Drag the date. Use +/− for deliberate zoom, or press and hold the
            slider to zoom continuously.
          </p>
          {result ? (
            <div className="tt-result">
              <div>
                <span>+ {result.points.toFixed(1)}</span> points
              </div>
              <p>
                <b>{event.place}</b> · {yearLabel(event.year)}
              </p>
              <ul>
                <li>{Math.round(result.distance).toLocaleString()} km away</li>
                <li>
                  {Math.round(result.yearError).toLocaleString()} years off
                </li>
                <li>L² distance {result.metric.toFixed(2)}</li>
              </ul>
              <button onClick={advance}>
                {round === 5 ? "See today’s score" : "Next event"} →
              </button>
            </div>
          ) : (
            <>
              <button className="tt-lock" onClick={lock} disabled={!guess}>
                Lock in this guess
              </button>
              <p className="tt-ready">
                {guess
                  ? "Location marked. Adjust the year, then lock it in."
                  : "Rotate the globe and mark a location."}
              </p>
            </>
          )}
          <div className="tt-rule">
            <span>Surface-distance scale</span>
            <b>{(event.spaceScale ?? 1800).toLocaleString()} km</b>
            <span>Date scale</span>
            <b>
              {event.timeScale ? `${event.timeScale} years` : "Era-adjusted"}
            </b>
            <span>Distance</span>
            <b>L²</b>
            <span>Perfect round</span>
            <b>500 pts</b>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Header({ total, round }: { total: number; round?: number }) {
  return (
    <header className="tt-top">
      <a href="/" className="tt-mark">
        <span>then</span>
        <i>/</i>
        <span>there</span>
      </a>
      {round !== undefined ? (
        <div className="tt-rounds">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={i === round ? "active" : i < round ? "done" : ""}
            >
              {i < round ? "✓" : i + 1}
            </span>
          ))}
        </div>
      ) : (
        <div />
      )}
      <div className="tt-score">{Math.round(total).toLocaleString()} pts</div>
    </header>
  );
}
