import { redirect } from "next/navigation";
import { currentUser } from "@/lib/fc-auth";
import {
  getDailyCase,
  getCase,
  getAllCaseIds,
  todayEst,
} from "@/lib/fc-redis";
import CaseWordleClient from "./CaseWordleClient";

export const dynamic = "force-dynamic";

export default async function CaseWordlePage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const date = todayEst();
  const caseId = await getDailyCase(date);
  if (!caseId) {
    return <div className="fc-empty">No Case Wordle scheduled for today yet.</div>;
  }
  const c = await getCase(caseId);
  if (!c) return <div className="fc-empty">Case not found.</div>;

  // candidate list = all case ids (their names will be fetched on the client)
  const allIds = await getAllCaseIds();
  // For UX: we need a list of candidate case names. Fetching all server-side is fine for ~80 cases.
  // To keep this server-only, we'll embed minimal info.
  // We can't easily fetch all from the server in one batch here without extending fc-redis;
  // the client will hit /api/fc/cases to get the picker list.

  return (
    <CaseWordleClient
      date={date}
      caseId={c.id}
      clues={[
        c.holding,
        c.facts_one_liner,
        `${c.year} · ${c.court}`,
        c.cluster ? c.cluster : (c.outline_section ?? "—"),
        c.first_letter ? `Name starts with "${c.first_letter}"` : (c.citation_hint ?? "—"),
      ]}
      caseCount={allIds.length}
    />
  );
}
