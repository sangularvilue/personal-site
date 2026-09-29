export type BoardMember = { id: string; name: string };
export type RankedBoardRow = { name: string; score: number; rank: number };

export function boardMember(id: string, name: string) {
  return JSON.stringify({ id, name } satisfies BoardMember);
}

function parseBoardMember(value: unknown): BoardMember | null {
  let member: unknown = value;
  if (typeof value === "string") {
    try {
      member = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (!member || typeof member !== "object" || Array.isArray(member)) return null;
  const candidate = member as Partial<BoardMember>;
  return typeof candidate.id === "string" && typeof candidate.name === "string"
    ? { id: candidate.id, name: candidate.name }
    : null;
}

export function rankedRows(raw: unknown[], firstRank = 1): RankedBoardRow[] {
  const rows: RankedBoardRow[] = [];
  for (let i = 0; i + 1 < raw.length; i += 2) {
    const member = parseBoardMember(raw[i]);
    const scoreValue = raw[i + 1];
    const score =
      typeof scoreValue === "number"
        ? scoreValue
        : typeof scoreValue === "string" && scoreValue.trim()
          ? Number(scoreValue)
          : Number.NaN;
    if (!member || !Number.isFinite(score)) continue;
    rows.push({ name: member.name, score, rank: firstRank + i / 2 });
  }
  return rows;
}
