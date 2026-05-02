"use client";
import DrillLoader from "../components/DrillLoader";

export default function MarathonPage() {
  return (
    <DrillLoader
      gameMode="marathon"
      apiQuery="?adaptive=1&n=25"
      heading="Marathon"
      subheading="Twenty-five questions, untimed. For stamina, not for speed."
    />
  );
}
