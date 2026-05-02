export const MANIFEST_VERSION = 1 as const;

export type SceneEntry = {
  id: string;
  order: number;
  title?: string;
  file: string;
};

export type EpisodeManifest = {
  manifestVersion: typeof MANIFEST_VERSION;
  episode: {
    season: number;
    number: number;
    title: string;
    targetRuntimeMinutes?: number;
    scriptPath?: string;
    notes?: string;
  };
  scenes: SceneEntry[];
  output: {
    filename: string;
    reencode: boolean;
  };
};

export type GenerationBlock = {
  provider?: string;
  model?: string;
  prompt?: string;
  promptSummary?: string;
  imageRef?: string;
  aspectRatio?: string;
  targetDurationSeconds?: number;
  seed?: number;
};

export type RawSceneWithGeneration = SceneEntry & {
  generation?: GenerationBlock;
};

export type RawManifest = Omit<EpisodeManifest, "scenes"> & {
  scenes: RawSceneWithGeneration[];
};
