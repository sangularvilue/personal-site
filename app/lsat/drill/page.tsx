"use client";
import DrillLoader from "../components/DrillLoader";

export default function DrillPage() {
  return (
    <DrillLoader
      gameMode="drill"
      apiQuery="?adaptive=1&n=15"
      heading="Adaptive Drill"
      subheading="Fifteen questions, weighted toward the skills that need work."
    />
  );
}
