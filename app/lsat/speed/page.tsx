"use client";
import DrillLoader from "../components/DrillLoader";

export default function SpeedPage() {
  return (
    <DrillLoader
      gameMode="speed"
      apiQuery="?n=10"
      timeLimitSec={60}
      heading="Speed Drill"
      subheading="Ten questions, sixty seconds each. Score is accuracy × time × streak."
    />
  );
}
