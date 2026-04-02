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

export function validateManifest(data: unknown): EpisodeManifest {
  if (data === null || typeof data !== "object") {
    throw new Error("Manifest must be a JSON object.");
  }
  const o = data as Record<string, unknown>;
  if (o.manifestVersion !== MANIFEST_VERSION) {
    throw new Error(`Expected manifestVersion ${MANIFEST_VERSION}.`);
  }
  if (!o.episode || typeof o.episode !== "object") {
    throw new Error("Missing episode.");
  }
  if (!Array.isArray(o.scenes) || o.scenes.length === 0) {
    throw new Error("scenes must be a non-empty array.");
  }
  if (!o.output || typeof o.output !== "object") {
    throw new Error("Missing output.");
  }

  const episode = o.episode as Record<string, unknown>;
  for (const key of ["season", "number", "title"] as const) {
    if (episode[key] === undefined) {
      throw new Error(`episode.${key} is required.`);
    }
  }

  const scenes: SceneEntry[] = [];
  for (const s of o.scenes) {
    if (!s || typeof s !== "object") throw new Error("Invalid scene entry.");
    const sc = s as Record<string, unknown>;
    if (typeof sc.id !== "string" || !sc.id) throw new Error("Scene id required.");
    if (typeof sc.order !== "number") throw new Error(`Scene ${sc.id}: order must be a number.`);
    if (typeof sc.file !== "string" || !sc.file) {
      throw new Error(`Scene ${sc.id}: file required.`);
    }
    scenes.push({
      id: sc.id,
      order: sc.order,
      title: typeof sc.title === "string" ? sc.title : undefined,
      file: sc.file,
    });
  }

  const out = o.output as Record<string, unknown>;
  if (typeof out.filename !== "string" || !out.filename) {
    throw new Error("output.filename is required.");
  }

  return {
    manifestVersion: MANIFEST_VERSION,
    episode: {
      season: Number(episode.season),
      number: Number(episode.number),
      title: String(episode.title),
      targetRuntimeMinutes:
        typeof episode.targetRuntimeMinutes === "number"
          ? episode.targetRuntimeMinutes
          : undefined,
      scriptPath:
        typeof episode.scriptPath === "string" ? episode.scriptPath : undefined,
      notes: typeof episode.notes === "string" ? episode.notes : undefined,
    },
    scenes,
    output: {
      filename: out.filename,
      reencode: out.reencode === true,
    },
  };
}
