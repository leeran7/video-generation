export type DraftCharacter = {
  id: string;
  name: string;
  codename: string;
  type: "hero" | "antagonist" | "supporting";
  role: string;
  ability: string;
  brief: string;
};

export type WizardState = {
  // Step 0 — Concept
  title: string;
  slug: string;
  logline: string;
  genres: string[];
  tones: string[];
  // Step 1 — Format
  videoScope: VideoScope;
  episodeSeconds: number;
  totalEpisodes: number;   // ignored when videoScope === "single"
  platform: string;
  // Step 2 — World
  settingDescription: string;
  worldRules: string;
  visualStyle: string;
  thematicFocus: string;
  // Step 3 — Style
  designStyleId: string;
  // Step 4 — Cast
  castCount: number;
  characters: DraftCharacter[];
  // Step 6 — Plan
  scenesPerEpisode: number;
};

export const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy",
  "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller",
  "Slice of Life", "Historical", "Supernatural", "Sports",
  "Musical", "Political", "Psychological", "Western",
];

export const TONES = [
  "Epic", "Dark", "Gritty", "Light-hearted", "Whimsical",
  "Tense", "Uplifting", "Satirical", "Surreal", "Melancholic",
  "Hopeful", "Intense", "Absurdist", "Cinematic",
];

export const PLATFORMS = [
  "YouTube", "TikTok", "Reels", "Instagram", "X", "Other",
];

/** How many videos will be produced in total */
export type VideoScope = "single" | "series";

export const STEPS = [
  { label: "Start" },
  { label: "Concept" },
  { label: "Format" },
  { label: "World" },
  { label: "Style" },
  { label: "Cast" },
  { label: "Plan" },
];

export const INITIAL: WizardState = {
  title: "",
  slug: "",
  logline: "",
  genres: [],
  tones: [],
  videoScope: "series",
  episodeSeconds: 90,
  totalEpisodes: 12,
  platform: "YouTube",
  settingDescription: "",
  worldRules: "",
  visualStyle: "",
  thematicFocus: "",
  designStyleId: "animated-series",
  castCount: 5,
  characters: [],
  scenesPerEpisode: 4,
};

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

export function formatTotalTime(seconds: number): string {
  if (seconds < 3600) {
    const m = Math.round(seconds / 60);
    return `${m} min total`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m total` : `${h}h total`;
}

export function emptyCharacter(): DraftCharacter {
  return { id: uid(), name: "", codename: "", type: "hero", role: "", ability: "", brief: "" };
}
