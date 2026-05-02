#!/usr/bin/env node
/**
 * Stitch ordered scene videos into one episode file using FFmpeg concat demuxer.
 * Requires `ffmpeg` on PATH (or FFMPEG_PATH set). See production/pipeline/README.md.
 *
 * Usage:
 *   pnpm pipeline:stitch -- production/pipeline/examples/s01e01-signal-lost/manifest.json
 *   pnpm pipeline:stitch -- --reencode <manifest.json>
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { validateManifest } from "../../packages/pipeline/manifest";
import { stitchEpisode } from "../../packages/pipeline/stitch";

async function main(): Promise<void> {
  const { manifestPath, forceReencode } = parseArgs(
    process.argv.slice(2).filter((a) => a !== "--")
  );

  const raw = readFileSync(manifestPath, "utf8");
  let data: unknown;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    console.error("Invalid JSON:", manifestPath);
    process.exit(1);
  }

  const manifest = validateManifest(data);
  const manifestDir = path.dirname(path.resolve(manifestPath));
  const sorted = [...manifest.scenes].sort((a, b) => a.order - b.order);

  const scenePaths = sorted.map((s) => path.resolve(manifestDir, s.file));
  const outputPath = path.join(manifestDir, manifest.output.filename);
  const reencode = forceReencode || manifest.output.reencode;

  try {
    const result = await stitchEpisode({
      scenePaths,
      outputPath,
      reencode,
    });
    console.log(`Done: ${result.outputPath}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

function parseArgs(argv: string[]): {
  manifestPath: string;
  forceReencode: boolean;
} {
  let forceReencode = false;
  const rest: string[] = [];
  for (const a of argv) {
    if (a === "--reencode") forceReencode = true;
    else rest.push(a);
  }
  if (rest.length !== 1) {
    console.error(
      "Usage: pnpm pipeline:stitch -- [--reencode] <path/to/manifest.json>"
    );
    process.exit(1);
  }
  return { manifestPath: path.resolve(rest[0]), forceReencode };
}

main();
