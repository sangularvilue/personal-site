import { redirect } from "next/navigation";
import { currentUser, isAdminUser } from "@/lib/lsat-auth";
import { getUserAttempts, getUserRatings } from "@/lib/lsat-redis";
import {
  LSAT_SKILLS,
  LSAT_SKILL_LABELS,
  ratingTier,
  ratingTierRoman,
} from "@/lib/lsat-types";
import Ribbon from "../components/Ribbon";

export default async function MePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const admin = isAdminUser(user);
  const [ratings, attempts] = await Promise.all([
    getUserRatings(user.id),
    getUserAttempts(user.id, 240),
  ]);

  const totalAttempts = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const accuracy = totalAttempts ? Math.round((correct / totalAttempts) * 100) : 0;
  // Recent ribbons — newest on the left.
  const recentRibbons = attempts.slice(0, 80);

  return (
    <div>
      <div className="lsat-bookplate">
        <div className="lsat-bookplate-corner lsat-bookplate-corner--tl">❦</div>
        <div className="lsat-bookplate-corner lsat-bookplate-corner--tr">❦</div>
        <div className="lsat-bookplate-corner lsat-bookplate-corner--bl">❦</div>
        <div className="lsat-bookplate-corner lsat-bookplate-corner--br">❦</div>
        <div className="lsat-ex-libris">Ex Libris</div>
        <div className="lsat-bookplate-name">{user.display_name}</div>
        <div className="lsat-bookplate-username">
          @{user.username} · joined{" "}
          {new Date(user.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          {admin && " · editor"}
        </div>
      </div>

      <div className="lsat-fleuron" aria-hidden>
        <span>⁂</span>
      </div>

      <h2 className="lsat-h2" style={{ fontSize: "1.4rem" }}>
        The Eight Skills
      </h2>
      <div className="lsat-stat-grid">
        {LSAT_SKILLS.map((s) => (
          <div key={s} className="lsat-stat-cell">
            <div className="lsat-stat-label">{LSAT_SKILL_LABELS[s]}</div>
            <div className="lsat-stat-value">{ratings[s]}</div>
            <div className="lsat-stat-tier">
              Tier {ratingTierRoman(ratings[s])} · {ratingTier(ratings[s])}
            </div>
          </div>
        ))}
      </div>

      <div className="lsat-fleuron" aria-hidden>
        <span>❧</span>
      </div>

      <h2 className="lsat-h2" style={{ fontSize: "1.4rem" }}>
        At a Glance
      </h2>
      <div className="lsat-stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="lsat-stat-cell">
          <div className="lsat-stat-label">Recent attempts</div>
          <div className="lsat-stat-value">{totalAttempts}</div>
        </div>
        <div className="lsat-stat-cell">
          <div className="lsat-stat-label">Accuracy</div>
          <div className="lsat-stat-value">{accuracy}<span style={{fontSize: "1.2rem", marginLeft: 2, color: "var(--lsat-ink-soft)"}}>%</span></div>
        </div>
        <div className="lsat-stat-cell">
          <div className="lsat-stat-label">Right · wrong</div>
          <div className="lsat-stat-value">
            {correct}
            <span style={{ color: "var(--lsat-ink-soft)", margin: "0 0.3rem" }}>·</span>
            {totalAttempts - correct}
          </div>
        </div>
      </div>

      {recentRibbons.length > 0 && (
        <>
          <div className="lsat-fleuron" aria-hidden>
            <span>❦</span>
          </div>
          <h2 className="lsat-h2" style={{ fontSize: "1.4rem" }}>
            The Ribbon Stack
          </h2>
          <p
            className="lsat-footnote"
            style={{ marginTop: "-0.5rem", marginBottom: "0.4rem" }}
          >
            Each ribbon is one answer kept in this book. Newest first.
          </p>
          <div className="lsat-ribbon-stack" aria-label="Recent ribbons">
            {recentRibbons.map((a, i) => (
              <Ribbon
                key={i}
                variant={a.correct ? "correct" : "wrong"}
                width={14}
                height={36}
                className="lsat-ribbon-stack-item"
                ariaLabel={a.correct ? "correct" : "wrong"}
                style={{ transform: `rotate(${(i % 5) - 2}deg)` }}
              />
            ))}
          </div>
        </>
      )}

      <div className="lsat-fleuron" aria-hidden>
        <span>※</span>
      </div>

      <h2 className="lsat-h2" style={{ fontSize: "1.4rem" }}>
        Recent Marginalia
      </h2>
      {totalAttempts === 0 ? (
        <p className="lsat-empty">No attempts yet — pick a chapter and begin.</p>
      ) : (
        <div>
          {attempts.slice(0, 40).map((a, i) => (
            <div key={i} className="lsat-history-row">
              <span className={`badge ${a.correct ? "ok" : "no"}`}>
                {a.correct ? "✓" : "✗"}
              </span>
              <span>
                <span
                  style={{
                    fontFamily: "var(--lsat-display)",
                    fontStyle: "italic",
                    color: "var(--lsat-ribbon-deep)",
                    marginRight: "0.5rem",
                  }}
                >
                  {LSAT_SKILL_LABELS[a.skill]}
                </span>
                <span style={{ color: "var(--lsat-ink-soft)" }}>
                  {a.question_id} · {a.game_mode} · {(a.ms_to_answer / 1000).toFixed(1)}s
                </span>
              </span>
              <span className="meta">
                {new Date(a.answered_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
