import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "./client";
import { characters } from "./schema";

const shows = pgTable("shows", {
  id: uuid("id").primaryKey(),
  slug: text("slug").notNull(),
});

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf-8"));
}

async function main() {
  const [show] = await db.select().from(shows).where(eq(shows.slug, "nova-force"));
  if (!show) throw new Error("shows row for 'nova-force' not found");

  const heroDir = "characters";
  const antagDir = "characters/antagonists";

  const heroFiles = readdirSync(heroDir).filter((f) => f.endsWith(".json"));
  const antagFiles = readdirSync(antagDir).filter((f) => f.endsWith(".json"));

  const rows: (typeof characters.$inferInsert)[] = [];

  for (const file of heroFiles) {
    const data = readJson(join(heroDir, file));
    const codename = String(data.codename);
    rows.push({
      showId: show.id,
      name: codename,
      realName: data.realName ? String(data.realName) : null,
      slug: slugify(codename),
      rosterNumber: typeof data.rosterNumber === "number" ? data.rosterNumber : null,
      type: "hero",
      affiliation: "Nova Force",
      data: data,
      designSheet: data.designSheet ? String(data.designSheet) : null,
      lockStatus: "draft",
    });
  }

  for (const file of antagFiles) {
    const data = readJson(join(antagDir, file));
    const name = String(data.name);
    rows.push({
      showId: show.id,
      name,
      realName: null,
      slug: slugify(name),
      rosterNumber: null,
      type: typeof data.type === "string" ? data.type : "antagonist",
      affiliation: data.affiliation ? String(data.affiliation) : null,
      data: data,
      designSheet: null,
      lockStatus: data.lockStatus ? String(data.lockStatus) : "draft",
    });
  }

  for (const row of rows) {
    await db
      .insert(characters)
      .values(row)
      .onConflictDoUpdate({
        target: [characters.showId, characters.slug],
        set: {
          name: row.name,
          realName: row.realName,
          rosterNumber: row.rosterNumber,
          type: row.type,
          affiliation: row.affiliation,
          data: row.data,
          designSheet: row.designSheet,
          lockStatus: row.lockStatus,
          updatedAt: sql`now()`,
        },
      });
    console.log(`upserted ${row.slug} (${row.type})`);
  }

  console.log(`done — ${rows.length} characters`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
