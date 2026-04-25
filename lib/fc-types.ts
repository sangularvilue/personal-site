export type FCCategory =
  | "just"
  | "cong"
  | "fqj"
  | "scsr"
  | "erie"
  | "roa"
  | "imm"
  | "hab";

export const FC_CATEGORIES: FCCategory[] = [
  "just",
  "cong",
  "fqj",
  "scsr",
  "erie",
  "roa",
  "imm",
  "hab",
];

export const FC_CATEGORY_LABELS: Record<FCCategory, string> = {
  just: "Justiciability",
  cong: "Congressional Control",
  fqj: "Federal Question",
  scsr: "SCOTUS Review",
  erie: "Erie / Federal Common Law",
  roa: "Rights of Action",
  imm: "Immunities & § 1983",
  hab: "Habeas Corpus",
};

export const FC_CATEGORY_SHORT: Record<FCCategory, string> = {
  just: "Just.",
  cong: "Cong.",
  fqj: "Fed Q",
  scsr: "SCOTUS",
  erie: "Erie",
  roa: "RoA",
  imm: "Imm.",
  hab: "Habeas",
};

export type FCGameMode =
  | "speed-drill"
  | "drills"
  | "which-prong"
  | "case-match"
  | "rule-builder"
  | "daily-hypo"
  | "case-wordle";

export type FCQuestion = {
  id: string;
  category: FCCategory;
  difficulty: number;
  rating: number;
  num_answered: number;
  stem: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  correct: "a" | "b" | "c" | "d";
  case_cited?: string;
  rule_id?: string;
  prong?: string;
  explanation: string;
  tags: string[];
  daily_eligible: boolean;
};

export type FCCase = {
  id: string;
  name: string;
  year: number;
  court: string;
  category: FCCategory;
  holding: string;
  facts_one_liner: string;
  cluster?: string;
  outline_section?: string;
  first_letter?: string;
  citation_hint?: string;
};

export type FCRule = {
  id: string;
  name: string;
  category: FCCategory;
  elements: string[];
  source_case?: string;
  when_applied?: string;
  common_distractors: string[];
};

export type FCUser = {
  id: string;
  username: string;
  display_name: string;
  created_at: number;
};

export type FCRatings = Record<FCCategory, number>;

export function emptyRatings(): FCRatings {
  return {
    just: 1000,
    cong: 1000,
    fqj: 1000,
    scsr: 1000,
    erie: 1000,
    roa: 1000,
    imm: 1000,
    hab: 1000,
  };
}

export function ratingTier(r: number): string {
  if (r < 900) return "Novice";
  if (r < 1050) return "Developing";
  if (r < 1200) return "Competent";
  if (r < 1350) return "Advanced";
  return "Expert";
}
