/**
 * generate-scenes.ts
 *
 * Generates scene videos via the Runway API and downloads them to the paths
 * specified in the episode manifest. After each successful generation, updates
 * production/locations.json to track which locations have assets.
 *
 * Usage:
 *   pnpm pipeline:generate -- <path/to/manifest.json>
 *   pnpm pipeline:generate -- --dry-run <path/to/manifest.json>
 *   pnpm pipeline:generate -- --force <path/to/manifest.json>
 *
 * Environment:
 *   RUNWAYML_API_SECRET  — Runway API key (required)
 *
 * Each scene's `generation` block in the manifest drives the API call:
 *   provider        — must be "runway" (skipped otherwise)
 *   model           — Runway model id (default: "gen4.5")
 *   promptSummary   — used as promptText if no full `prompt` is provided
 *   prompt          — full text prompt (takes priority over promptSummary)
 *   imageRef        — HTTPS URL to a reference image (triggers image-to-video)
 *   aspectRatio     — e.g. "16:9" (converted to Runway ratio format)
 *   targetDurationSeconds — desired scene length; Runway clips are max 10s,
 *                           so the script generates the first 10s clip as a
 *                           starting point. Full scene assembly requires
 *                           multiple passes (see GENERATION_TODO.md §4).
 *   seed            — reproducibility seed
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import RunwayML, { TaskFailedError } from "@runwayml/sdk";
import type { TaskRetrieveResponse } from "@runwayml/sdk/resources/tasks";
import { validateManifest } from "./manifest.js";

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
  rawManifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
} catch (err) {
  console.error(`Failed to read manifest: ${(err as Error).message}`);
  process.exit(1);
}

const manifest = validateManifest(rawManifest);

// Keep the raw scenes so we can access the `generation` block (which
// validateManifest strips out since it's not part of SceneEntry).
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
// 4. Helpers
// ---------------------------------------------------------------------------

type GenerationBlock = {
  provider?: string;
  model?: string;
  prompt?: string;
  promptSummary?: string;
  imageRef?: string;
  aspectRatio?: string;
  targetDurationSeconds?: number;
  seed?: number;
};

/** Convert "16:9" style aspect ratio to Runway's "1280:720" pixel ratio. */
function toRunwayRatio(aspectRatio: string | undefined): "1280:720" | "720:1280" {
  if (!aspectRatio) return "1280:720";
  const portrait = ["9:16", "720:1280", "portrait"];
  if (portrait.includes(aspectRatio.toLowerCase())) return "720:1280";
  return "1280:720";
}

/** Clamp duration to Runway's 2–10 second range. */
function clampDuration(target: number | undefined): number {
  if (!target) return 10;
  return Math.max(2, Math.min(10, Math.round(target)));
}

/** Download a URL to a local file path. */
async function downloadFile(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  const arrayBuf = await res.arrayBuffer();
  writeFileSync(outPath, Buffer.from(arrayBuf));
}

// ---------------------------------------------------------------------------
// 5. Location registry update helper
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
      // If the scene file path contains the location slug, mark it
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
    // Non-fatal — don't block generation for registry issues
  }
}

// ---------------------------------------------------------------------------
// 6. Generate scenes
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

    // Skip non-runway providers
    if (gen.provider && gen.provider !== "runway") {
      console.log(`  ⊘ ${scene.id}: provider "${gen.provider}" — skipping (not runway)`);
      skipped++;
      continue;
    }

    // Idempotent: skip if file already exists (unless --force)
    if (existsSync(outPath) && !force) {
      console.log(`  ✓ ${scene.id}: ${scene.file} already exists — skipping`);
      skipped++;
      continue;
    }

    const promptText =
      gen.prompt ?? gen.promptSummary ?? scene.title ?? `Scene ${scene.id}`;
    const model = gen.model ?? "gen4.5";
    const hasImage = !!gen.imageRef;
    const ratio = toRunwayRatio(gen.aspectRatio);
    const duration = clampDuration(gen.targetDurationSeconds);
    const seed = gen.seed;

    // Show what would happen
    console.log(`  → ${scene.id}: "${scene.title ?? scene.id}"`);
    console.log(`    model: ${model} | ratio: ${ratio} | duration: ${duration}s`);
    console.log(`    prompt: "${promptText.slice(0, 80)}${promptText.length > 80 ? "…" : ""}"`);
    if (hasImage) console.log(`    imageRef: ${gen.imageRef}`);
    if (seed != null) console.log(`    seed: ${seed}`);

    if (gen.targetDurationSeconds && gen.targetDurationSeconds > 10) {
      console.log(
        `    ⚠ Scene target is ${gen.targetDurationSeconds}s but Runway max is 10s/clip.` +
        `\n      Generating first ${duration}s clip. Full scene requires multi-pass assembly.`
      );
    }

    if (dryRun) {
      console.log(`    [dry run — no API call]\n`);
      continue;
    }

    // Ensure output directory exists
    mkdirSync(dirname(outPath), { recursive: true });

    try {
      let task: TaskRetrieveResponse.Succeeded;

      if (hasImage) {
        // Image-to-video
        task = await client!.imageToVideo
          .create({
            model: "gen4.5",
            promptImage: gen.imageRef!,
            promptText,
            ratio,
            duration,
            ...(seed != null && { seed }),
          })
          .waitForTaskOutput({ timeout: 10 * 60 * 1000 });
      } else {
        // Text-to-video
        task = await client!.textToVideo
          .create({
            model: "gen4.5",
            promptText,
            ratio,
            duration,
            ...(seed != null && { seed }),
          })
          .waitForTaskOutput({ timeout: 10 * 60 * 1000 });
      }

      // Download the output video
      const videoUrl = task.output[0];
      if (!videoUrl) {
        throw new Error("Task succeeded but returned no output URL");
      }

      console.log(`    ⬇ Downloading to ${scene.file}...`);
      await downloadFile(videoUrl, outPath);
      console.log(`    ✓ Done\n`);

      // Update locations registry
      updateLocationAsset(scene.file);
      generated++;
    } catch (err) {
      if (err instanceof TaskFailedError) {
        const details = err.taskDetails as { failure?: string; failureCode?: string };
        console.error(
          `    ✗ FAILED: ${details.failure ?? "unknown error"}` +
          (details.failureCode ? ` (${details.failureCode})` : "") + "\n"
        );
      } else {
        console.error(
          `    ✗ ERROR: ${(err as Error).message}\n`
        );
      }
      failed++;
    }
  }

  // Summary
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
