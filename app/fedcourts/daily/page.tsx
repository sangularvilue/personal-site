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
  // strip correct from initial render
  const safeQ = {
    id: q.id,
    stem: q.stem,
    opt_a: q.opt_a,
    opt_b: q.opt_b,
    opt_c: q.opt_c,
    opt_d: q.opt_d,
    case_cited: q.case_cited,
    explanation: q.explanation,
    correct: q.correct,
  };

  return <DailyHypoClient date={date} question={safeQ} alreadyAnswered={sub} />;
}
