/**
 * Seed locations from production/locations.json into the database for a given show.
 *
 * Usage:
 *   pnpm tsx scripts/seed-locations.ts <showSlug>
 *
 * Example:
 *   pnpm tsx scripts/seed-locations.ts nova-force
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { config } from "dotenv";
config();

const { eq, sql } = await import("drizzle-orm");
const { db } = await import("../lib/db/client");
const { shows, locations } = await import("../lib/db/schema");

const showSlug = process.argv[2];
if (!showSlug) {
  console.error("Usage: pnpm tsx scripts/seed-locations.ts <showSlug>");
  process.exit(1);
}

type RawLocation = {
  slug: string;
  name: string;
  area?: string;
  interior?: boolean;
  conceptBoard?: boolean;
  conceptBoardAsset?: string;
  referenceImageAsset?: string;
  runwayStyleRefAsset?: string;
  notes?: string;
};

const [show] = await db
  .select({ id: shows.id, title: shows.title })
  .from(shows)
  .where(eq(shows.slug, showSlug))
  .limit(1);

if (!show) {
  console.error(`Show not found: ${showSlug}`);
  process.exit(1);
}

const file = path.join(process.cwd(), "production/locations.json");
const raw = JSON.parse(await readFile(file, "utf8")) as {
  locations: RawLocation[];
};

const rows = raw.locations.map((loc) => ({
  showId: show.id,
  slug: loc.slug,
  name: loc.name,
  area: loc.area ?? null,
  interior: loc.interior ?? false,
  conceptBoard: loc.conceptBoard ?? false,
  conceptBoardAsset: loc.conceptBoardAsset ?? null,
  referenceImageAsset: loc.referenceImageAsset ?? null,
  runwayStyleRefAsset: loc.runwayStyleRefAsset ?? null,
  notes: loc.notes ?? null,
}));

await db
  .insert(locations)
  .values(rows)
  .onConflictDoUpdate({
    target: [locations.showId, locations.slug],
    set: {
      name: sql`excluded.name`,
      area: sql`excluded.area`,
      interior: sql`excluded.interior`,
      conceptBoard: sql`excluded.concept_board`,
      conceptBoardAsset: sql`excluded.concept_board_asset`,
      referenceImageAsset: sql`excluded.reference_image_asset`,
      runwayStyleRefAsset: sql`excluded.runway_style_ref_asset`,
      notes: sql`excluded.notes`,
      updatedAt: sql`now()`,
    },
  });

console.log(`Seeded ${rows.length} locations for "${show.title}" (${showSlug}).`);
process.exit(0);
