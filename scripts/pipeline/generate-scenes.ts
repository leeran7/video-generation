/**
 * generate-scenes.ts
 *
 * CLI wrapper that loops a manifest's scenes and calls Runway via packages/pipeline.
 * Idempotent — skips scenes whose output already exists unless --force.
 *
 * Usage:
 *   pnpm pipeline:generate -- <path/to/manifest.json>
 *   pnpm pipeline:generate -- --dry-run <path/to/manifest.json>
 *   pnpm pipeline:generate -- --force <path/to/manifest.json>
 *
 * Environment:
 *   RUNWAYML_API_SECRET  — Runway API key (required)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import RunwayML from "@runwayml/sdk";

import { validateManifest } from "../../packages/pipeline/manifest";
import {
  RunwaySceneError,
  downloadVideo,
  generateScene,
  generationBlockToInput,
} from "../../packages/pipeline/runway";
import type { GenerationBlock } from "../../packages/pipeline/types";

// ---------------------------------------------------------------------------
// 1. Parse CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2).filter((a) => a !== "--");
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const manifestArg = args.find((a) => !a.startsWith("--"));

if (!manifestArg) {
  console.error(
    "Usage: pnpm pipeline:generate -- [--dry-run] [--force] <path/to/manifest.json>"
  );
  process.exit(1);
}

const manifestPath = resolve(manifestArg);
const manifestDir = dirname(manifestPath);

// ---------------------------------------------------------------------------
// 2. Load and validate manifest
// ---------------------------------------------------------------------------

let rawManifest: Record<string, unknown>;
try {
  rawManifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<
    string,
    unknown
  >;
} catch (err) {
  console.error(`Failed to read manifest: ${(err as Error).message}`);
  process.exit(1);
}

const manifest = validateManifest(rawManifest);
const rawScenes = (rawManifest.scenes as Record<string, unknown>[]) ?? [];

// ---------------------------------------------------------------------------
// 3. Initialize Runway client
// ---------------------------------------------------------------------------

if (!process.env.RUNWAYML_API_SECRET && !dryRun) {
  console.error(
    "RUNWAYML_API_SECRET environment variable is required.\n" +
      "Get your API key at https://dev.runwayml.com/ and export it:\n" +
      "  export RUNWAYML_API_SECRET=your_key_here"
  );
  process.exit(1);
}

const client = dryRun ? null : new RunwayML();

// ---------------------------------------------------------------------------
// 4. Location registry update helper
// ---------------------------------------------------------------------------

type LocationEntry = {
  slug: string;
  name: string;
  area: string;
  interior: boolean;
  conceptBoard: boolean;
  conceptBoardAsset: string;
  referenceImageAsset: string;
  runwayStyleRefAsset: string;
  notes: string;
};

type LocationsFile = {
  locationsVersion: number;
  description: string;
  locations: LocationEntry[];
};

const locationsPath = resolve(process.cwd(), "production/locations.json");

function updateLocationAsset(sceneFile: string): void {
  if (!existsSync(locationsPath)) return;
  try {
    const data = JSON.parse(readFileSync(locationsPath, "utf8")) as LocationsFile;
    let changed = false;
    for (const loc of data.locations) {
      if (sceneFile.toLowerCase().includes(loc.slug)) {
        if (!loc.conceptBoard) {
          loc.conceptBoard = true;
          loc.referenceImageAsset = sceneFile;
          changed = true;
        }
      }
    }
    if (changed) {
      writeFileSync(locationsPath, JSON.stringify(data, null, 2) + "\n", "utf8");
    }
  } catch {
    // Non-fatal
  }
}

// ---------------------------------------------------------------------------
// 5. Generate scenes
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const scenes = manifest.scenes.sort((a, b) => a.order - b.order);
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(
    `\n🎬 Nova Force — Scene Generator (Runway)\n` +
      `   Manifest: ${manifestPath}\n` +
      `   Scenes:   ${scenes.length}\n` +
      `   Mode:     ${dryRun ? "DRY RUN" : force ? "FORCE" : "normal"}\n`
  );

  for (const scene of scenes) {
    const outPath = resolve(manifestDir, scene.file);
    const raw = rawScenes.find(
      (s) => (s as Record<string, unknown>).id === scene.id
    );
    const gen: GenerationBlock = (raw?.generation as GenerationBlock) ?? {};

    if (gen.provider && gen.provider !== "runway") {
      console.log(
        `  ⊘ ${scene.id}: provider "${gen.provider}" — skipping (not runway)`
      );
      skipped++;
      continue;
    }

    if (existsSync(outPath) && !force) {
      console.log(`  ✓ ${scene.id}: ${scene.file} already exists — skipping`);
      skipped++;
      continue;
    }

    const input = generationBlockToInput(
      gen,
      scene.title ?? `Scene ${scene.id}`
    );

    console.log(`  → ${scene.id}: "${scene.title ?? scene.id}"`);
    console.log(
      `    model: ${input.model} | ratio: ${input.ratio} | duration: ${input.duration}s`
    );
    console.log(
      `    prompt: "${input.promptText.slice(0, 80)}${input.promptText.length > 80 ? "…" : ""}"`
    );
    if (input.imageRef) console.log(`    imageRef: ${input.imageRef}`);
    if (input.seed != null) console.log(`    seed: ${input.seed}`);

    if (gen.targetDurationSeconds && gen.targetDurationSeconds > 10) {
      console.log(
        `    ⚠ Scene target is ${gen.targetDurationSeconds}s but Runway max is 10s/clip.` +
          `\n      Generating first ${input.duration}s clip. Full scene requires multi-pass assembly.`
      );
    }

    if (dryRun) {
      console.log(`    [dry run — no API call]\n`);
      continue;
    }

    mkdirSync(dirname(outPath), { recursive: true });

    try {
      const { videoUrl } = await generateScene(input, client!);
      console.log(`    ⬇ Downloading to ${scene.file}...`);
      const buf = await downloadVideo(videoUrl);
      writeFileSync(outPath, buf);
      console.log(`    ✓ Done\n`);

      updateLocationAsset(scene.file);
      generated++;
    } catch (err) {
      if (err instanceof RunwaySceneError) {
        console.error(
          `    ✗ FAILED: ${err.message}` +
            (err.failureCode ? ` (${err.failureCode})` : "") +
            "\n"
        );
      } else {
        console.error(`    ✗ ERROR: ${(err as Error).message}\n`);
      }
      failed++;
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Total:     ${scenes.length}\n`);

  if (failed > 0) {
    console.error(`${failed} scene(s) failed — pipeline should not stitch.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Fatal: ${(err as Error).message}`);
  process.exit(1);
});
