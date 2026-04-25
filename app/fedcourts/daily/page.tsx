import { redirect } from "next/navigation";
import { currentUser } from "@/lib/fc-auth";
import {
  getDailyHypo,
  getDailySubmission,
  getQuestion,
  todayEst,
} from "@/lib/fc-redis";
import DailyHypoClient from "./DailyHypoClient";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const date = todayEst();
  const qid = await getDailyHypo(date);
  if (!qid) {
    return (
      <div className="fc-daily-card">
        <h1 className="fc-h1">Daily Hypo</h1>
        <p className="fc-sub">No hypo scheduled for today yet. Check back later.</p>
      </div>
    );
  }
  const q = await getQuestion(qid);
  if (!q) return <div className="fc-empty">Question not found.</div>;

  const sub = await getDailySubmission(user.id, "daily-hypo", date);

  // Shuffle options once per render so display position varies between reloads.
  const opts = [q.opt_a, q.opt_b, q.opt_c, q.opt_d];
  const idx = [0, 1, 2, 3];
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const LETTERS = ["a", "b", "c", "d"] as const;
  const shuffleKey = idx.map((i) => LETTERS[i]).join("");
  const correctCanonicalIdx = LETTERS.indexOf(q.correct);
  const correctDisplayIdx = idx.indexOf(correctCanonicalIdx);
  const correctDisplay = LETTERS[correctDisplayIdx];

  const safeQ = {
    id: q.id,
    stem: q.stem,
    opt_a: opts[idx[0]],
    opt_b: opts[idx[1]],
    opt_c: opts[idx[2]],
    opt_d: opts[idx[3]],
    case_cited: q.case_cited,
    explanation: q.explanation,
    correct: correctDisplay,
    shuffle_key: shuffleKey,
  };

  return <DailyHypoClient date={date} question={safeQ} alreadyAnswered={sub} />;
}
