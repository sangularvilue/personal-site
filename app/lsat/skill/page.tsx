"use client";
import { useState } from "react";
import DrillLoader from "../components/DrillLoader";
import {
  LSAT_SKILLS,
  LSAT_SKILL_LABELS,
  type LSATSkill,
} from "@/lib/lsat-types";

export default function SkillPage() {
  const [skill, setSkill] = useState<LSATSkill | null>(null);

  if (skill) {
    return (
      <DrillLoader
        gameMode="skill-focus"
        apiQuery={`?skill=${skill}&n=15`}
        skillFilter={skill}
        heading={LSAT_SKILL_LABELS[skill]}
        subheading="Fifteen of this skill, drawn at your level."
      />
    );
  }

  return (
    <div>
      <h1 className="lsat-h1">
        By <em>Skill</em>.
      </h1>
      <p className="lsat-sub">Choose one of the eight.</p>

      <div className="lsat-fleuron" aria-hidden>
        <span>❦</span>
      </div>

      <div className="lsat-pill-row">
        {LSAT_SKILLS.map((s) => (
          <button key={s} className="lsat-pill" onClick={() => setSkill(s)}>
            {LSAT_SKILL_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  );
}
