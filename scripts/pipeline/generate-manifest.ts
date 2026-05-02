/**
 * generate-manifest.ts
 *
 * CLI wrapper around `parseScriptToManifest` from packages/pipeline.
 * Reads a script .md, writes manifest.json next to a scenes/ directory.
 *
 * Usage:
 *   pnpm pipeline:manifest -- <path/to/script.md>
 *   pnpm pipeline:manifest -- --dry-run <path/to/script.md>
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, relative, resolve } from "node:path";

import { parseScriptToManifest } from "../../packages/pipeline/manifest";

const args = process.argv.slice(2).filter((a) => a !== "--");
const dryRun = args.includes("--dry-run");
const scriptArg = args.find((a) => !a.startsWith("--"));

if (!scriptArg) {
  console.error("Usage: generate-manifest [--dry-run] <path/to/script.md>");
  process.exit(1);
}

const scriptPath = resolve(scriptArg);
const scriptContent = readFileSync(scriptPath, "utf-8");

const slug = basename(scriptPath, ".md");
const manifestDir = resolve("production/pipeline/examples", slug);
const manifestPath = resolve(manifestDir, "manifest.json");
const relativeScriptPath = relative(manifestDir, scriptPath);

const { manifest } = parseScriptToManifest(scriptContent, {
  slug,
  scriptPath: relativeScriptPath,
});

const json = JSON.stringify(manifest, null, 2) + "\n";

if (dryRun) {
  console.log(json);
  console.log(`(dry run — would write to ${manifestPath})`);
} else {
  mkdirSync(resolve(manifestDir, "scenes"), { recursive: true });
  writeFileSync(manifestPath, json, "utf-8");
  console.log(`Manifest written: ${manifestPath}`);
  console.log(
    `  ${manifest.scenes.length} scenes, ${manifest.episode.targetRuntimeMinutes ?? "?"} min target`
  );
}
