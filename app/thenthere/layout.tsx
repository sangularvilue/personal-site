import type { Metadata } from "next";
import "./then-there.css";

export const metadata: Metadata = {
  title: "Then / There — A Daily History Game",
  description: "Place six historical events on a globe and a timeline.",
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
