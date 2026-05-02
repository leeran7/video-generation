const ACCENT_COLORS = [
  "#00f0ff",
  "#ff4060",
  "#a855f7",
  "#22c55e",
  "#f59e0b",
] as const;

export function accentForRoster(rosterNumber: number): string {
  return ACCENT_COLORS[rosterNumber - 1] ?? ACCENT_COLORS[0];
}

/** Matches `characters/antagonists/*.json` field order and shape. */
export interface Antagonist {
  show: string;
  season: number;
  name: string;
  type: string;
  affiliation: string;
  episodes: number[];
  designSheet?: string;
  imageUrl?: string;
  visualHook: string;
  roleInPlot: string;
  outcome: string;
  lockStatus?: string;
}

export const ANTAGONIST_ACCENT = "#ef4444";

/** Matches `characters/*.json` field order and shape. */
export interface Character {
  show: string;
  season: number;
  rosterNumber: number;
  codename: string;
  icon: string;
  realName: string;
  age: number;
  personality: string;
  traits: string[];
  mindset: string;
  designSheet?: string;
  imageUrl?: string;
  visualDistinctions: string;
  powers: string;
  powersSpec: string;
  role: string;
  signatureColor: string;
  seasonOneArc: { act: number; episodes: number[]; description: string }[];
  voiceCadence: string;
  humanizingDetails: string;
  influencesAndTwist: string;
  animationCraftNotes: string;
}
