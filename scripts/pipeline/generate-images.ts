/**
 * generate-images.ts
 *
 * Generates character, antagonist, and location images via OpenAI's image API.
 * Reads prompts from production/IMAGE_GENERATION_TODO.md, saves assets to the
 * correct directories, checks off completed entries, and updates character/location
 * JSON files with asset paths.
 *
 * Usage:
 *   pnpm pipeline:image -- <slug>                          # generate one image
 *   pnpm pipeline:image -- --all                           # generate all remaining
 *   pnpm pipeline:image -- <slug> --prompt "adjustments"   # append to prompt and regenerate
 *   pnpm pipeline:image -- <slug> --force                  # regenerate existing
 *   pnpm pipeline:image -- --list                          # show status
 *   pnpm pipeline:image -- --dry-run <slug>                # preview without calling API
 *   pnpm pipeline:image -- --model gpt-image-1             # use a different model
 *
 * Environment:
 *   OPENAI_API_KEY — required (unless --dry-run or --list)
 */

import OpenAI, { toFile } from "openai";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const TODO_PATH = resolve(ROOT, "production/IMAGE_GENERATION_TODO.md");
const LOCATIONS_PATH = resolve(ROOT, "production/locations.json");
const DELAY_MS = 3000; // delay between API calls for --all mode

// Style reference images — passed to gpt-image-1 to maintain visual consistency
const STYLE_REF_PATHS = [
  resolve(ROOT, "production/assets/style-reference.png"),
  resolve(ROOT, "production/assets/characters/surge.png"),
  resolve(ROOT, "production/assets/characters/wraith.png"),
  resolve(ROOT, "production/assets/characters/titan.png"),
  resolve(ROOT, "production/assets/characters/glitch.png"),
  resolve(ROOT, "production/assets/characters/solace.png"),
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category = "style" | "hero" | "antagonist" | "location";

interface ImageEntry {
  name: string;
  slug: string;
  done: boolean;
  assetPath: string;
  prompt: string;
  category: Category;
  line: number;
  promptStart: number;
  promptEnd: number;
}

// ---------------------------------------------------------------------------
// Parse TODO.md
// ---------------------------------------------------------------------------

function parseTodo(content?: string): ImageEntry[] {
  content ??= readFileSync(TODO_PATH, "utf-8");
  const lines = content.split("\n");
  const entries: ImageEntry[] = [];

  let currentCategory: Category = "style";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## Style")) currentCategory = "style";
    else if (line.startsWith("## Heroes")) currentCategory = "hero";
    else if (line.startsWith("## Antagonists")) currentCategory = "antagonist";
    else if (line.startsWith("## Locations")) currentCategory = "location";
    else if (line.startsWith("## Totals")) break;

    const m = line.match(
      /^- \[([ x])\] \*\*(.+?)\*\*(?:\s*\(.*?\))?\s*—\s*`(.+?)`/,
    );
    if (!m) continue;

    const done = m[1] === "x";
    const name = m[2];
    const assetPath = m[3];
    const slug = basename(assetPath, ".png");

    // Collect blockquote prompt lines
    let prompt = "";
    let promptStart = -1;
    let promptEnd = -1;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].startsWith("> ")) {
        if (promptStart === -1) promptStart = j;
        promptEnd = j;
        prompt += (prompt ? " " : "") + lines[j].slice(2);
      } else if (prompt) {
        break;
      }
    }

    entries.push({
      name,
      slug,
      done,
      assetPath,
      prompt,
      category: currentCategory,
      line: i,
      promptStart,
      promptEnd,
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Update TODO.md
// ---------------------------------------------------------------------------

function markDone(entry: ImageEntry, newPrompt?: string): void {
  const content = readFileSync(TODO_PATH, "utf-8");
  const lines = content.split("\n");

  // Check off the entry
  lines[entry.line] = lines[entry.line].replace("- [ ]", "- [x]");
  lines[entry.line] = lines[entry.line].replace(
    / *\*\(needs regeneration\)\*/,
    "",
  );

  // Update prompt if altered
  if (newPrompt && entry.promptStart !== -1) {
    const newLines = [`> ${newPrompt}`];
    lines.splice(
      entry.promptStart,
      entry.promptEnd - entry.promptStart + 1,
      ...newLines,
    );
  }

  let updated = lines.join("\n");

  // Recalculate totals
  const entries = parseTodo(updated);
  const counts: Record<Category, { done: number; total: number }> = {
    style: { done: 0, total: 0 },
    hero: { done: 0, total: 0 },
    antagonist: { done: 0, total: 0 },
    location: { done: 0, total: 0 },
  };
  for (const e of entries) {
    counts[e.category].total++;
    if (e.done) counts[e.category].done++;
  }

  const totalDone = Object.values(counts).reduce((s, c) => s + c.done, 0);
  const totalAll = Object.values(counts).reduce((s, c) => s + c.total, 0);

  updated = updated
    .replace(
      /\| Style Reference \| \d+ \| \d+ \|/,
      `| Style Reference | ${counts.style.done} | ${counts.style.total} |`,
    )
    .replace(
      /\| Heroes \| \d+ \| \d+ \|/,
      `| Heroes | ${counts.hero.done} | ${counts.hero.total} |`,
    )
    .replace(
      /\| Antagonists \| \d+ \| \d+ \|/,
      `| Antagonists | ${counts.antagonist.done} | ${counts.antagonist.total} |`,
    )
    .replace(
      /\| Locations \| \d+ \| \d+ \|/,
      `| Locations | ${counts.location.done} | ${counts.location.total} |`,
    )
    .replace(
      /\| \*\*Total\*\* \| \*\*\d+\*\* \| \*\*\d+\*\* \|/,
      `| **Total** | **${totalDone}** | **${totalAll}** |`,
    );

  writeFileSync(TODO_PATH, updated);
}

// ---------------------------------------------------------------------------
// Update JSON files
// ---------------------------------------------------------------------------

function insertFieldBefore(
  data: Record<string, unknown>,
  newKey: string,
  newValue: unknown,
  beforeKey: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let inserted = false;
  for (const [key, value] of Object.entries(data)) {
    if (key === beforeKey && !inserted) {
      result[newKey] = newValue;
      inserted = true;
    }
    result[key] = value;
  }
  if (!inserted) result[newKey] = newValue;
  return result;
}

function updateJson(entry: ImageEntry): void {
  if (entry.category === "hero") {
    const jsonPath = resolve(ROOT, `characters/${entry.slug}.json`);
    if (!existsSync(jsonPath)) return;
    const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
    if (data.designSheet) return;
    const updated = insertFieldBefore(
      data,
      "designSheet",
      entry.assetPath,
      "visualDistinctions",
    );
    writeFileSync(jsonPath, JSON.stringify(updated, null, 2) + "\n");
    console.log(`  Updated characters/${entry.slug}.json`);
  } else if (entry.category === "antagonist") {
    const jsonPath = resolve(
      ROOT,
      `characters/antagonists/${entry.slug}.json`,
    );
    if (!existsSync(jsonPath)) return;
    const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
    if (data.designSheet) return;
    const updated = insertFieldBefore(
      data,
      "designSheet",
      entry.assetPath,
      "visualHook",
    );
    writeFileSync(jsonPath, JSON.stringify(updated, null, 2) + "\n");
    console.log(`  Updated characters/antagonists/${entry.slug}.json`);
  } else if (entry.category === "location") {
    if (!existsSync(LOCATIONS_PATH)) return;
    const data = JSON.parse(readFileSync(LOCATIONS_PATH, "utf-8"));
    const loc = data.locations?.find(
      (l: Record<string, unknown>) => l.slug === entry.slug,
    );
    if (!loc) return;
    loc.conceptBoardAsset = entry.assetPath;
    loc.conceptBoard = true;
    writeFileSync(LOCATIONS_PATH, JSON.stringify(data, null, 2) + "\n");
    console.log(`  Updated locations.json → ${entry.slug}`);
  }
}

// ---------------------------------------------------------------------------
// Generate image via OpenAI
// ---------------------------------------------------------------------------

async function loadStyleRefs(): Promise<Array<Awaited<ReturnType<typeof toFile>>>> {
  const refs: Array<Awaited<ReturnType<typeof toFile>>> = [];
  for (const refPath of STYLE_REF_PATHS) {
    if (!existsSync(refPath)) {
      console.warn(`  Warning: style reference not found: ${refPath}`);
      continue;
    }
    const buf = readFileSync(refPath);
    refs.push(await toFile(buf, basename(refPath), { type: "image/png" }));
  }
  return refs;
}

async function generateImage(
  openai: OpenAI,
  prompt: string,
  model: string,
): Promise<Buffer> {
  console.log(`  Calling ${model}...`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any;

  if (model === "gpt-image-1") {
    // Use images.edit with Surge/Wraith as style references
    const styleRefs = await loadStyleRefs();

    if (styleRefs.length > 0) {
      console.log(`  Using ${styleRefs.length} style reference image(s)`);
      const styledPrompt = `Match the exact art style of the provided reference images. Use the same linework, proportions, rendering, and color treatment. ${prompt}`;
      result = await openai.images.edit({
        model: "gpt-image-1",
        image: styleRefs,
        prompt: styledPrompt,
        n: 1,
        size: "1536x1024",
        quality: "high",
      } as Parameters<typeof openai.images.edit>[0]);
    } else {
      // Fallback: no style refs available
      result = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1536x1024",
        quality: "high",
      } as Parameters<typeof openai.images.generate>[0]);
    }
  } else {
    // dall-e-3
    result = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "hd",
      response_format: "b64_json",
    });
  }

  const b64: string | undefined = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned");
  return Buffer.from(b64, "base64");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printUsage(): void {
  console.log(`
Usage:
  pnpm pipeline:image -- <slug>                          Generate one image
  pnpm pipeline:image -- --all                           Generate all remaining
  pnpm pipeline:image -- <slug> --prompt "adjustments"   Modify prompt and regenerate
  pnpm pipeline:image -- <slug> --force                  Regenerate existing image
  pnpm pipeline:image -- --list                          Show generation status
  pnpm pipeline:image -- --dry-run <slug>                Preview without calling API
  pnpm pipeline:image -- --model gpt-image-1             Use a different model

Environment:
  OPENAI_API_KEY    Required (unless --dry-run or --list)
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");

  const listMode = args.includes("--list");
  const allMode = args.includes("--all");
  const forceMode = args.includes("--force");
  const dryRun = args.includes("--dry-run");
  const modelIdx = args.indexOf("--model");
  const model = modelIdx !== -1 ? args[modelIdx + 1] : "gpt-image-1";
  const promptIdx = args.indexOf("--prompt");
  const extraPrompt = promptIdx !== -1 ? args[promptIdx + 1] : "";

  // Find the slug argument (not a flag, not a flag value)
  const flagValues = new Set<string>();
  if (modelIdx !== -1 && args[modelIdx + 1]) flagValues.add(args[modelIdx + 1]);
  if (promptIdx !== -1 && args[promptIdx + 1])
    flagValues.add(args[promptIdx + 1]);
  const slugArg = args.find(
    (a) => !a.startsWith("--") && !flagValues.has(a),
  );

  const entries = parseTodo();

  // --list
  if (listMode) {
    console.log("\nImage Generation Status:\n");
    for (const e of entries) {
      const status = e.done ? "\x1b[32m✓\x1b[0m" : " ";
      console.log(
        `  [${status}] ${e.name.padEnd(25)} ${e.category.padEnd(12)} ${e.assetPath}`,
      );
    }
    const done = entries.filter((e) => e.done).length;
    console.log(`\n  ${done}/${entries.length} complete\n`);
    return;
  }

  // Determine targets
  let targets: ImageEntry[];

  if (allMode) {
    targets = forceMode ? [...entries] : entries.filter((e) => !e.done);
    if (targets.length === 0) {
      console.log("All images already generated.");
      return;
    }
    console.log(`\nGenerating ${targets.length} image(s)...\n`);
  } else if (slugArg) {
    const entry = entries.find((e) => e.slug === slugArg);
    if (!entry) {
      console.error(`Unknown slug: "${slugArg}"\n`);
      console.error(
        "Available slugs:\n  " + entries.map((e) => e.slug).join("\n  "),
      );
      process.exit(1);
    }
    if (entry.done && !forceMode && !extraPrompt) {
      console.log(
        `"${entry.name}" already generated. Use --force to regenerate.`,
      );
      return;
    }
    targets = [entry];
  } else {
    printUsage();
    process.exit(1);
  }

  // Check API key
  if (!dryRun && !process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY environment variable is required.");
    console.error("Set it with: export OPENAI_API_KEY=sk-...\n");
    process.exit(1);
  }

  const openai = dryRun ? (null as unknown as OpenAI) : new OpenAI();

  let generated = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const entry = targets[i];
    const prompt = extraPrompt
      ? `${entry.prompt} ${extraPrompt}`
      : entry.prompt;

    console.log(
      `\n[${i + 1}/${targets.length}] ${entry.name} (${entry.slug})`,
    );
    console.log(`  Category: ${entry.category}`);
    console.log(`  Output:   ${entry.assetPath}`);

    if (dryRun) {
      console.log(`  Prompt:   ${prompt.slice(0, 120)}...`);
      console.log("  (dry run — skipping API call)");
      continue;
    }

    try {
      const imageBuffer = await generateImage(openai, prompt, model);

      // Save image
      const fullPath = resolve(ROOT, entry.assetPath);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, imageBuffer);
      console.log(`  Saved:    ${entry.assetPath} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);

      // Update tracker
      if (!entry.done || extraPrompt) {
        markDone(entry, extraPrompt ? prompt : undefined);
        console.log("  Tracker:  checked off");
      }

      // Update JSON
      updateJson(entry);

      generated++;

      // Rate-limit delay for batch mode
      if (allMode && i < targets.length - 1) {
        console.log(`  Waiting ${DELAY_MS / 1000}s before next request...`);
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: ${msg}`);

      if (msg.includes("content_policy") || msg.includes("safety")) {
        console.error(
          "  The prompt was blocked by content policy. Try editing the prompt in IMAGE_GENERATION_TODO.md.",
        );
      }

      failed++;
      if (!allMode) process.exit(1);
    }
  }

  console.log(
    `\nDone. Generated: ${generated}, Failed: ${failed}, Skipped: ${targets.length - generated - failed}`,
  );
}

main();
