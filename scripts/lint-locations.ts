#!/usr/bin/env node
/**
 * Location lint: detect new/unregistered locations when scripts are edited.
 *
 * Parses every production/scripts/*.md scene index table, extracts locations,
 * and checks each against production/locations.json. Reports:
 *   - Locations in scripts that have no matching registry entry (need to be added)
 *   - Registered locations whose conceptBoard is still false (need Runway generation)
 *
 * Usage: npx tsx scripts/lint-locations.ts [optional-script-path]
 *
 * When called without arguments, scans all scripts.
 * When called with a path, scans only that script.
 */

import { readFileSync, readdirSync } from "node:fs";
import { resolve, basename } from "node:path";

const ROOT = process.cwd();

// ---------------------------------------------------------------------------
// 1. Load location registry
// ---------------------------------------------------------------------------

type Location = {
  slug: string;
  name: string;
  area: string;
  interior: boolean;
  conceptBoard: boolean;
  notes: string;
};

type LocationsFile = {
  locationsVersion: number;
  locations: Location[];
};

const locationsPath = resolve(ROOT, "production/locations.json");
let registry: LocationsFile;
try {
  registry = JSON.parse(readFileSync(locationsPath, "utf8")) as LocationsFile;
} catch {
  console.error(`Cannot read ${locationsPath}`);
  process.exit(1);
}

// Build a set of normalized name fragments for matching.
// Each registry entry produces its slug and a normalized version of its name.
const registryIndex = new Map<string, Location>();
for (const loc of registry.locations) {
  registryIndex.set(loc.slug, loc);
  registryIndex.set(normalize(loc.name), loc);
}

function normalize(raw: string): string {
  return raw
    .replace(/^(EXT\.\/?INT\.|EXT\.|INT\.)\s*/i, "")
    .replace(/\s*[—–-]\s*(morning|evening|night|dusk|dawn|continuous|day|sunset|sunrise|later|moments?\s+later).*$/i, "")
    .replace(/\s*\(.*?\)/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-");
}

// ---------------------------------------------------------------------------
// 2. Parse scene index tables from scripts
// ---------------------------------------------------------------------------

function extractLocations(scriptPath: string): { location: string; normalized: string; script: string }[] {
  const content = readFileSync(scriptPath, "utf8");
  const tableStart = content.indexOf("## SCENE INDEX");
  if (tableStart === -1) return [];

  const tableSection = content.slice(tableStart);
  const rows = tableSection
    .split("\n")
    .filter((line) => line.startsWith("|") && !line.startsWith("| ---") && !line.startsWith("| Scene ID"));

  const scriptName = basename(scriptPath);

  return rows.map((line) => {
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const location = cells[2] ?? "";
    return { location, normalized: normalize(location), script: scriptName };
  }).filter((r) => r.location.length > 0);
}

// ---------------------------------------------------------------------------
// 3. Determine which scripts to scan
// ---------------------------------------------------------------------------

const args = process.argv.slice(2).filter((a) => a !== "--");
let scriptPaths: string[];

if (args.length > 0) {
  scriptPaths = [resolve(args[0])];
} else {
  const scriptsDir = resolve(ROOT, "production/scripts");
  try {
    scriptPaths = readdirSync(scriptsDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => resolve(scriptsDir, f));
  } catch {
    scriptPaths = [];
  }
}

// ---------------------------------------------------------------------------
// 4. Check locations
// ---------------------------------------------------------------------------

const unregistered: { location: string; normalized: string; script: string }[] = [];
const needsConceptBoard: Location[] = [];
const matchedSlugs = new Set<string>();

for (const sp of scriptPaths) {
  const locs = extractLocations(sp);
  for (const entry of locs) {
    const match = registryIndex.get(entry.normalized);
    if (!match) {
      // Check partial match — see if any registry name contains or is contained by this normalized name
      let found = false;
      for (const loc of registry.locations) {
        const regNorm = normalize(loc.name);
        if (entry.normalized.includes(regNorm) || regNorm.includes(entry.normalized)) {
          matchedSlugs.add(loc.slug);
          found = true;
          break;
        }
      }
      if (!found) {
        unregistered.push(entry);
      }
    } else {
      matchedSlugs.add(match.slug);
    }
  }
}

// Collect matched locations that still need concept boards
for (const slug of matchedSlugs) {
  const loc = registry.locations.find((l) => l.slug === slug);
  if (loc && !loc.conceptBoard) {
    needsConceptBoard.push(loc);
  }
}

// Deduplicate unregistered by normalized name
const seenNormalized = new Set<string>();
const uniqueUnregistered = unregistered.filter((u) => {
  if (seenNormalized.has(u.normalized)) return false;
  seenNormalized.add(u.normalized);
  return true;
});

// ---------------------------------------------------------------------------
// 5. Report
// ---------------------------------------------------------------------------

const messages: string[] = [];

if (uniqueUnregistered.length > 0) {
  messages.push(
    `NEW LOCATIONS — not in production/locations.json (add them and generate concept boards via Runway):\n` +
    uniqueUnregistered.map((u) => `  + "${u.location}" (from ${u.script})`).join("\n")
  );
}

if (needsConceptBoard.length > 0) {
  messages.push(
    `LOCATIONS NEEDING CONCEPT BOARDS (conceptBoard: false in locations.json — generate via Runway):\n` +
    needsConceptBoard.map((l) => `  ~ ${l.name} [${l.area}]`).join("\n")
  );
}

if (messages.length === 0) {
  // All clear
  process.exit(0);
}

const report = `Location check — action needed:\n${messages.join("\n\n")}`;

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: report,
    },
  })
);

process.exit(1);
