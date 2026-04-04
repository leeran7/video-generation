/**
 * generate-manifest.ts
 *
 * Parses an episode script markdown file and generates a pipeline manifest.json
 * from the header metadata and scene index table.
 *
 * Usage:
 *   pnpm pipeline:manifest -- <path/to/script.md>
 *   pnpm pipeline:manifest -- --dry-run <path/to/script.md>
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, relative, basename } from "node:path";
import { MANIFEST_VERSION } from "./manifest.js";

// ---------------------------------------------------------------------------
// 1. Parse CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2).filter((a) => a !== "--");
const dryRun = args.includes("--dry-run");
const scriptArg = args.find((a) => !a.startsWith("--"));

if (!scriptArg) {
  console.error("Usage: generate-manifest [--dry-run] <path/to/script.md>");
  process.exit(1);
}

const scriptPath = resolve(scriptArg);
const scriptContent = readFileSync(scriptPath, "utf-8");

// ---------------------------------------------------------------------------
// 2. Parse header metadata
// ---------------------------------------------------------------------------

const headerMatch = scriptContent.match(
  /^## Season (\d+), Episode (\d+) — "(.+)"/m,
);
if (!headerMatch) {
  console.error("Could not parse episode header (expected: ## Season N, Episode N — \"Title\")");
  process.exit(1);
}

const season = Number(headerMatch[1]);
const episodeNumber = Number(headerMatch[2]);
const title = headerMatch[3];

const runtimeMatch = scriptContent.match(
  /\*\*Runtime target:\*\* (\d+) minutes/,
);
const targetRuntimeMinutes = runtimeMatch ? Number(runtimeMatch[1]) : undefined;

// ---------------------------------------------------------------------------
// 3. Parse scene index table
// ---------------------------------------------------------------------------

const tableStart = scriptContent.indexOf("## SCENE INDEX");
if (tableStart === -1) {
  console.error("Could not find ## SCENE INDEX section in script.");
  process.exit(1);
}

const tableSection = scriptContent.slice(tableStart);
const tableLines = tableSection
  .split("\n")
  .filter((line) => line.startsWith("|") && !line.startsWith("| ---") && !line.startsWith("| Scene ID"));

if (tableLines.length === 0) {
  console.error("No scene rows found in the scene index table.");
  process.exit(1);
}

type SceneRow = {
  id: string;
  title: string;
  location: string;
  runtime: string;
  characters: string;
};

const sceneRows: SceneRow[] = tableLines.map((line) => {
  const cells = line
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  if (cells.length < 5) {
    console.error(`Malformed table row: ${line}`);
    process.exit(1);
  }

  return {
    id: cells[0],
    title: cells[1],
    location: cells[2],
    runtime: cells[3],
    characters: cells[4],
  };
});

// ---------------------------------------------------------------------------
// 4. Compute duration from runtime ranges
// ---------------------------------------------------------------------------

function parseTimestamp(ts: string): number {
  // "1:30" → 90 seconds, "10:00" → 600 seconds
  const parts = ts.split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function computeDurationSeconds(runtime: string): number {
  // "0:00–1:00" → 60 seconds
  const match = runtime.match(/(\d+:\d+)\s*[–-]\s*(\d+:\d+)/);
  if (!match) return 0;
  return parseTimestamp(match[2]) - parseTimestamp(match[1]);
}

// ---------------------------------------------------------------------------
// 5. Build manifest
// ---------------------------------------------------------------------------

const slug = basename(scriptPath, ".md"); // e.g. "s01e01-signal-lost"
const manifestDir = resolve("production/pipeline/examples", slug);
const manifestPath = resolve(manifestDir, "manifest.json");
const relativeScriptPath = relative(manifestDir, scriptPath);

const manifest = {
  manifestVersion: MANIFEST_VERSION,
  episode: {
    season,
    number: episodeNumber,
    title,
    ...(targetRuntimeMinutes != null && { targetRuntimeMinutes }),
    scriptPath: relativeScriptPath,
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
    filename: `${slug}-master.mp4`,
    reencode: false,
  },
};

// ---------------------------------------------------------------------------
// 6. Output
// ---------------------------------------------------------------------------

const json = JSON.stringify(manifest, null, 2) + "\n";

if (dryRun) {
  console.log(json);
  console.log(`(dry run — would write to ${manifestPath})`);
} else {
  mkdirSync(resolve(manifestDir, "scenes"), { recursive: true });
  writeFileSync(manifestPath, json, "utf-8");
  console.log(`Manifest written: ${manifestPath}`);
  console.log(`  ${manifest.scenes.length} scenes, ${targetRuntimeMinutes ?? "?"} min target`);
}
