#!/usr/bin/env node
/**
 * Stitch ordered scene videos into one episode file using FFmpeg concat demuxer.
 * Requires `ffmpeg` on PATH. See production/pipeline/README.md.
 *
 * Usage:
 *   pnpm pipeline:stitch -- production/pipeline/examples/s01e01-signal-lost/manifest.json
 *   pnpm pipeline:stitch -- --reencode production/pipeline/examples/s01e01-signal-lost/manifest.json
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

import { validateManifest } from "./manifest.js";

main();

function main(): void {
  const { manifestPath, forceReencode } = parseArgs(
    process.argv.slice(2).filter((a) => a !== "--"),
  );
  const raw = readFileSync(manifestPath, "utf8");
  let data: unknown;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    console.error("Invalid JSON:", manifestPath);
    process.exit(1);
  }

  const manifestDir = path.dirname(path.resolve(manifestPath));
  const manifest = validateManifest(data);
  const sorted = [...manifest.scenes].sort((a, b) => a.order - b.order);

  const scenePaths: string[] = [];
  for (const scene of sorted) {
    const abs = path.resolve(manifestDir, scene.file);
    if (!existsSync(abs)) {
      console.error(`Missing scene file for ${scene.id}: ${abs}`);
      process.exit(1);
    }
    scenePaths.push(abs);
  }

  const outName = manifest.output.filename;
  const outputPath = path.join(manifestDir, outName);
  const reencode = forceReencode || manifest.output.reencode;

  const listPath = path.join(manifestDir, ".ffmpeg-concat-list.txt");
  const listBody = scenePaths
    .map((p) => `file ${escapeConcatPath(p)}`)
    .join("\n");
  writeFileSync(listPath, listBody, "utf8");

  const ffmpeg = process.env.FFMPEG_PATH?.trim() || "ffmpeg";
  const args = buildFfmpegArgs({ listPath, outputPath, reencode });
  console.log(`Running: ${ffmpeg} ${args.join(" ")}`);

  const result = spawnSync(ffmpeg, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log(`Done: ${outputPath}`);
}

function parseArgs(argv: string[]): { manifestPath: string; forceReencode: boolean } {
  let forceReencode = false;
  const rest: string[] = [];
  for (const a of argv) {
    if (a === "--reencode") forceReencode = true;
    else rest.push(a);
  }
  if (rest.length !== 1) {
    console.error(
      "Usage: pnpm pipeline:stitch -- [--reencode] <path/to/manifest.json>",
    );
    process.exit(1);
  }
  return { manifestPath: path.resolve(rest[0]), forceReencode };
}

function buildFfmpegArgs(options: {
  listPath: string;
  outputPath: string;
  reencode: boolean;
}): string[] {
  const { listPath, outputPath, reencode } = options;
  const outDir = path.dirname(outputPath);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const base = ["-y", "-f", "concat", "-safe", "0", "-i", listPath];
  if (reencode) {
    return [
      ...base,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      outputPath,
    ];
  }
  return [...base, "-c", "copy", outputPath];
}

/** FFmpeg concat demuxer: forward slashes, single-quoted paths with embedded quotes escaped. */
function escapeConcatPath(absPath: string): string {
  const normalized = absPath.replace(/\\/g, "/");
  const escaped = normalized.replace(/'/g, "'\\''");
  return `'${escaped}'`;
}
