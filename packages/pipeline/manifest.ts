import {
  MANIFEST_VERSION,
  type EpisodeManifest,
  type RawManifest,
  type SceneEntry,
} from "./types";

export { MANIFEST_VERSION };
export type { EpisodeManifest, SceneEntry };

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
    if (typeof sc.order !== "number")
      throw new Error(`Scene ${sc.id}: order must be a number.`);
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

export type ParseScriptOptions = {
  /** Episode slug used for output filename (e.g. "s01e01-the-pulse"). */
  slug: string;
  /** Optional script path stored in the manifest's `episode.scriptPath` field (relative to manifest dir). */
  scriptPath?: string;
};

export type ParseScriptResult = {
  manifest: RawManifest;
  scenes: { id: string; title: string; location: string; characters: string }[];
};

function parseTimestamp(ts: string): number {
  const parts = ts.split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function computeDurationSeconds(runtime: string): number {
  const match = runtime.match(/(\d+:\d+)\s*[–-]\s*(\d+:\d+)/);
  if (!match) return 0;
  return parseTimestamp(match[2]) - parseTimestamp(match[1]);
}

/**
 * Parse a Nova Force episode script's header + scene index table into a manifest.
 *
 * Pure: takes the script text, returns the manifest object. Caller writes to disk.
 */
export function parseScriptToManifest(
  scriptContent: string,
  opts: ParseScriptOptions
): ParseScriptResult {
  const headerMatch = scriptContent.match(
    /^## Season (\d+), Episode (\d+) — "(.+)"/m
  );
  if (!headerMatch) {
    throw new Error(
      `Could not parse episode header (expected: ## Season N, Episode N — "Title")`
    );
  }
  const season = Number(headerMatch[1]);
  const episodeNumber = Number(headerMatch[2]);
  const title = headerMatch[3];

  const runtimeMatch = scriptContent.match(/\*\*Runtime target:\*\* (\d+) minutes/);
  const targetRuntimeMinutes = runtimeMatch ? Number(runtimeMatch[1]) : undefined;

  const tableStart = scriptContent.indexOf("## SCENE INDEX");
  if (tableStart === -1) {
    throw new Error("Could not find ## SCENE INDEX section in script.");
  }

  const tableSection = scriptContent.slice(tableStart);
  const tableLines = tableSection
    .split("\n")
    .filter(
      (line) =>
        line.startsWith("|") &&
        !line.startsWith("| ---") &&
        !line.startsWith("| Scene ID")
    );

  if (tableLines.length === 0) {
    throw new Error("No scene rows found in the scene index table.");
  }

  const sceneRows = tableLines.map((line) => {
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cells.length < 5) {
      throw new Error(`Malformed table row: ${line}`);
    }
    return {
      id: cells[0],
      title: cells[1],
      location: cells[2],
      runtime: cells[3],
      characters: cells[4],
    };
  });

  const manifest: RawManifest = {
    manifestVersion: MANIFEST_VERSION,
    episode: {
      season,
      number: episodeNumber,
      title,
      ...(targetRuntimeMinutes != null && { targetRuntimeMinutes }),
      ...(opts.scriptPath ? { scriptPath: opts.scriptPath } : {}),
    },
    scenes: sceneRows.map((row, i) => ({
      id: row.id,
      order: i + 1,
      title: row.title,
      file: `scenes/${row.id}.mp4`,
      generation: {
        promptSummary: `${row.location} — ${row.characters}`,
        targetDurationSeconds: computeDurationSeconds(row.runtime),
      },
    })),
    output: {
      filename: `${opts.slug}-master.mp4`,
      reencode: false,
    },
  };

  return { manifest, scenes: sceneRows };
}
