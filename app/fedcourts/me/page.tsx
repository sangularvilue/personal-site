import { redirect } from "next/navigation";
import { currentUser } from "@/lib/fc-auth";
import { getUserRatings } from "@/lib/fc-redis";
import {
  FC_CATEGORIES,
  FC_CATEGORY_LABELS,
  ratingTier,
} from "@/lib/fc-types";
import RadarChart from "../components/RadarChart";

export default async function MePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const ratings = await getUserRatings(user.id);

  return (
    <div>
      <h1 className="fc-h1">{user.display_name}</h1>
      <p className="fc-sub">@{user.username} · joined {new Date(user.created_at).toLocaleDateString()}</p>

      <div className="fc-profile-grid">
        <div className="fc-radar-wrap">
          <RadarChart ratings={ratings} size={400} />
        </div>
        <div>
          <h2 className="fc-h2" style={{ fontSize: "1.3rem" }}>Skills</h2>
          <div className="fc-stat-grid">
            {FC_CATEGORIES.map((c) => (
              <div key={c} className="fc-stat-cell">
                <div className="fc-stat-label">{FC_CATEGORY_LABELS[c]}</div>
                <div className="fc-stat-value">{ratings[c]}</div>
                <div className="fc-stat-tier">{ratingTier(ratings[c])}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
