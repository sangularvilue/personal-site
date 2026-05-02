import { redirect } from "next/navigation";
import { currentUser, isAdminUser } from "@/lib/lsat-auth";
import { getUserAttempts, getUserRatings } from "@/lib/lsat-redis";
import {
  LSAT_SKILLS,
  LSAT_SKILL_LABELS,
  LSAT_SKILL_SHORT,
  ratingTier,
} from "@/lib/lsat-types";

export default async function MePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const admin = isAdminUser(user);
  const [ratings, attempts] = await Promise.all([
    getUserRatings(user.id),
    getUserAttempts(user.id, 100),
  ]);

  const totalAttempts = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const accuracy = totalAttempts ? Math.round((correct / totalAttempts) * 100) : 0;

  return (
    <div>
      <h1 className="lsat-h1">{user.display_name}</h1>
      <p className="lsat-sub">
        @{user.username} · joined{" "}
        {new Date(user.created_at).toLocaleDateString()}
        {admin && " · admin"}
      </p>

      <h2 className="lsat-h2" style={{ fontSize: "1.2rem" }}>
        Skill ratings
      </h2>
      <div className="lsat-stat-grid">
        {LSAT_SKILLS.map((s) => (
          <div key={s} className="lsat-stat-cell">
            <div className="lsat-stat-label">{LSAT_SKILL_LABELS[s]}</div>
            <div className="lsat-stat-value">{ratings[s]}</div>
            <div className="lsat-stat-tier">{ratingTier(ratings[s])}</div>
          </div>
        ))}
      </div>

      <h2 className="lsat-h2" style={{ fontSize: "1.2rem" }}>
        At a glance
      </h2>
      <div className="lsat-stat-grid">
        <div className="lsat-stat-cell">
          <div className="lsat-stat-label">Recent attempts</div>
          <div className="lsat-stat-value">{totalAttempts}</div>
        </div>
        <div className="lsat-stat-cell">
          <div className="lsat-stat-label">Accuracy</div>
          <div className="lsat-stat-value">{accuracy}%</div>
        </div>
        <div className="lsat-stat-cell">
          <div className="lsat-stat-label">Right / wrong</div>
          <div className="lsat-stat-value">
            {correct} / {totalAttempts - correct}
          </div>
        </div>
      </div>

      <h2 className="lsat-h2" style={{ fontSize: "1.2rem" }}>
        Recent answers
      </h2>
      {totalAttempts === 0 ? (
        <p className="lsat-empty">No attempts yet — pick a mode and start.</p>
      ) : (
        <div>
          {attempts.slice(0, 50).map((a, i) => (
            <div key={i} className="lsat-history-row">
              <span className={`badge ${a.correct ? "ok" : "no"}`}>
                {a.correct ? "✓" : "✗"}
              </span>
              <span>
                <strong style={{ fontFamily: "var(--lsat-mono)" }}>
                  {a.question_id}
                </strong>{" "}
                · {LSAT_SKILL_SHORT[a.skill]} · {a.game_mode} ·{" "}
                {(a.ms_to_answer / 1000).toFixed(1)}s
              </span>
              <span style={{ color: "var(--lsat-ink-soft)", fontSize: "0.8rem" }}>
                {new Date(a.answered_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
