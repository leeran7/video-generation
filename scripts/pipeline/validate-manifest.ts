#!/usr/bin/env node
/**
 * Validate an episode manifest (structure + scene file paths).
 *
 * Usage:
 *   pnpm pipeline:validate -- production/pipeline/examples/s01e01-signal-lost/manifest.json
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { validateManifest } from "./manifest.js";

main();

function main(): void {
  const manifestPath = parseArgs(filterArgv(process.argv.slice(2)));
  const raw = readFileSync(manifestPath, "utf8");
  let data: unknown;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    console.error("Invalid JSON:", manifestPath);
    process.exit(1);
  }

  const manifestDir = path.dirname(path.resolve(manifestPath));
  try {
    validateManifest(data);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const m = data as {
    scenes: Array<{ id: string; file: string }>;
    episode: { title: string };
  };

  console.log(
    `Manifest OK: ${m.episode.title} — ${m.scenes.length} scene(s) listed.`,
  );

  let missing = 0;
  for (const scene of m.scenes) {
    const abs = path.resolve(manifestDir, scene.file);
    if (!existsSync(abs)) {
      console.warn(`Missing file: ${scene.id} → ${abs}`);
      missing += 1;
    }
  }

  if (missing > 0) {
    console.warn(
      `${missing} scene file(s) missing (add AI outputs, then stitch). Exit 2.`,
    );
    process.exit(2);
  }

  console.log("All scene files present.");
}

function filterArgv(argv: string[]): string[] {
  return argv.filter((a) => a !== "--");
}

function parseArgs(argv: string[]): string {
  if (argv.length !== 1) {
    console.error("Usage: pnpm pipeline:validate -- <path/to/manifest.json>");
    process.exit(1);
  }
  return path.resolve(argv[0]);
}
