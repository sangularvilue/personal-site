export type LSATSkill =
  | "main_point"
  | "inference"
  | "strengthen_weaken"
  | "assumption"
  | "flaw_method"
  | "principle_parallel"
  | "detail_function"
  | "authors_voice";

export const LSAT_SKILLS: LSATSkill[] = [
  "main_point",
  "inference",
  "strengthen_weaken",
  "assumption",
  "flaw_method",
  "principle_parallel",
  "detail_function",
  "authors_voice",
];

export const LSAT_SKILL_LABELS: Record<LSATSkill, string> = {
  main_point: "Main Point",
  inference: "Inference",
  strengthen_weaken: "Strengthen / Weaken",
  assumption: "Assumption",
  flaw_method: "Flaw / Method",
  principle_parallel: "Principle / Parallel",
  detail_function: "Detail / Function",
  authors_voice: "Author's Voice",
};

export const LSAT_SKILL_SHORT: Record<LSATSkill, string> = {
  main_point: "Main Pt",
  inference: "Infer",
  strengthen_weaken: "S/W",
  assumption: "Assume",
  flaw_method: "Flaw",
  principle_parallel: "Princ.",
  detail_function: "Detail",
  authors_voice: "Voice",
};

export type LSATSectionType = "RC" | "LR" | "LG";

export const LSAT_SECTION_LABELS: Record<LSATSectionType, string> = {
  RC: "Reading Comprehension",
  LR: "Logical Reasoning",
  LG: "Logic Games",
};

export type LSATGameMode =
  | "drill"
  | "speed"
  | "skill-focus"
  | "section-focus"
  | "marathon";

export type LSATAnswerLetter = "a" | "b" | "c" | "d" | "e";

export const LSAT_LETTERS: LSATAnswerLetter[] = ["a", "b", "c", "d", "e"];

export type LSATQuestion = {
  id: string;
  pt: number;
  section_num: number;
  section_type: LSATSectionType;
  question_num: number;
  passage_id?: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  choice_e: string;
  correct: LSATAnswerLetter;
  skill: LSATSkill;
  rating: number;
  num_answered: number;
};

export type LSATUser = {
  id: string;
  username: string;
  display_name: string;
  created_at: number;
};

export type LSATRatings = Record<LSATSkill, number>;

export function emptyRatings(): LSATRatings {
  return {
    main_point: 1000,
    inference: 1000,
    strengthen_weaken: 1000,
    assumption: 1000,
    flaw_method: 1000,
    principle_parallel: 1000,
    detail_function: 1000,
    authors_voice: 1000,
  };
}

export function ratingTier(r: number): string {
  if (r < 900) return "Novice";
  if (r < 1050) return "Developing";
  if (r < 1200) return "Competent";
  if (r < 1350) return "Advanced";
  return "Expert";
}

// Roman-numeral tier (I-V), used as a marginal flourish on the bookplate.
export function ratingTierRoman(r: number): string {
  if (r < 900) return "I";
  if (r < 1050) return "II";
  if (r < 1200) return "III";
  if (r < 1350) return "IV";
  return "V";
}

export function arabicToRoman(n: number): string {
  const map: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let v = Math.max(0, Math.floor(n));
  for (const [val, sym] of map) {
    while (v >= val) {
      out += sym;
      v -= val;
    }
  }
  return out || "0";
}

// Per-question per-user attempt history.
export type LSATAttempt = {
  question_id: string;
  selected: LSATAnswerLetter | null;
  correct: boolean;
  ms_to_answer: number;
  answered_at: number;
  game_mode: LSATGameMode;
  session_id: string;
  skill: LSATSkill;
  shuffle_key?: string;
};
