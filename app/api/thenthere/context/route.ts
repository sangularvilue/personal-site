import { NextRequest, NextResponse } from "next/server";
import { EVENTS, FOCUSES } from "@/app/thenthere/events";

export const runtime = "edge";

const WIKIPEDIA_TITLES: Record<string, string> = {
  "A Khmer king begins what will become the largest religious monument on earth.":
    "Angkor Wat",
  "A Malian emperor’s pilgrimage caravan arrives in the Egyptian capital.":
    "Mansa Musa",
  "At a televised press conference, Günter Schabowski mistakenly says new travel rules take effect immediately.":
    "Fall of the Berlin Wall",
  "Ibn Battuta, a 21-year-old jurist, begins a pilgrimage that will become a thirty-year journey.":
    "Ibn Battuta",
  "Hannibal leads an army across a mountain range during the Second Punic War.":
    "Hannibal's crossing of the Alps",
  "The earliest known writing emerges in a Mesopotamian city.": "Cuneiform",
};

type WikipediaPage = {
  title?: string;
  extract?: string;
  fullurl?: string;
};

const allEvents = [...EVENTS, ...FOCUSES.flatMap((focus) => focus.deck)];

function toThreeSentences(text: string) {
  const normalized = text
    .replace(/(\d)\.\s+(\d)/g, "$1.$2")
    .replace(/\s+/g, " ")
    .trim();
  const sentences = Array.from(
    new Intl.Segmenter("en", { granularity: "sentence" }).segment(normalized),
    ({ segment }) => segment.trim(),
  ).filter(Boolean);
  return (sentences.slice(0, 3).join(" ") || normalized).slice(0, 1000);
}

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title")?.trim();
  const event = allEvents.find((candidate) => candidate.title === title);
  if (!title || !event) {
    return NextResponse.json({ error: "Unknown event" }, { status: 404 });
  }

  const query = WIKIPEDIA_TITLES[title] ?? `${event.title} ${event.place}`;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "0",
    gsrlimit: "1",
    prop: "extracts|info",
    inprop: "url",
    explaintext: "1",
    exchars: "1300",
    redirects: "1",
  });

  try {
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?${params.toString()}`,
      {
        next: { revalidate: 60 * 60 * 24 * 7 },
        headers: { "User-Agent": "ThenThere history game" },
      },
    );
    if (!response.ok) throw new Error("Wikipedia request failed");
    const data = (await response.json()) as {
      query?: { pages?: WikipediaPage[] };
    };
    const page = data.query?.pages?.[0];
    if (!page?.title || !page.extract)
      throw new Error("Wikipedia page missing");
    return NextResponse.json(
      {
        title: page.title,
        summary: toThreeSentences(page.extract),
        url:
          page.fullurl ??
          `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=604800, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Context temporarily unavailable" },
      { status: 502 },
    );
  }
}
