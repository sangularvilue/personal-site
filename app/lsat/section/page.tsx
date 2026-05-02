"use client";
import { useState } from "react";
import DrillLoader from "../components/DrillLoader";
import {
  LSAT_SECTION_LABELS,
  type LSATSectionType,
} from "@/lib/lsat-types";

const SECTIONS: LSATSectionType[] = ["LR", "RC", "LG"];

export default function SectionPage() {
  const [section, setSection] = useState<LSATSectionType | null>(null);

  if (section) {
    return (
      <DrillLoader
        gameMode="section-focus"
        apiQuery={`?section=${section}&n=15`}
        heading={`Section · ${LSAT_SECTION_LABELS[section]}`}
        subheading="Fifteen questions, all from this section type."
      />
    );
  }

  return (
    <div>
      <h1 className="lsat-h1">Section Focus</h1>
      <p className="lsat-sub">Pick a section type to drill.</p>
      <div className="lsat-pill-row">
        {SECTIONS.map((s) => (
          <button
            key={s}
            className="lsat-pill"
            onClick={() => setSection(s)}
          >
            {LSAT_SECTION_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  );
}
