import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { db } from "./client";
import { arcs, characters, episodes } from "./schema";

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

  // Arcs + episodes: seed from production/season-1-beats.json.
  type ArcEpisode = {
    episodeNumber: number;
    title: string;
    scenes?: string[];
    approximateMinutes?: number;
    scriptFile?: string;
    hook?: string;
  };
  type ArcEntry = {
    episode: number; // arc number in legacy "episode" terms (1–12)
    title: string;
    fullBrief?: string;
    tags?: string[];
    split?: { status?: string; episodes?: ArcEpisode[] };
  };
  const beats = readJson("production/season-1-beats.json") as {
    episodes: ArcEntry[];
  };

  const arcIdByNumber = new Map<number, string>();
  for (const arc of beats.episodes) {
    const row: typeof arcs.$inferInsert = {
      showId: show.id,
      season: 1,
      arcNumber: arc.episode,
      title: arc.title,
      brief: arc.fullBrief ?? null,
      tags: arc.tags ?? null,
      lockStatus: "draft",
    };
    const [inserted] = await db
      .insert(arcs)
      .values(row)
      .onConflictDoUpdate({
        target: [arcs.showId, arcs.season, arcs.arcNumber],
        set: {
          title: row.title,
          brief: row.brief,
          tags: row.tags,
          lockStatus: row.lockStatus,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: arcs.id, arcNumber: arcs.arcNumber });
    arcIdByNumber.set(inserted.arcNumber, inserted.id);
    console.log(`upserted arc ${inserted.arcNumber}: ${row.title}`);
  }
  console.log(`done — ${arcIdByNumber.size} arcs`);

  const epRows: (typeof episodes.$inferInsert)[] = [];
  for (const arc of beats.episodes) {
    const split = arc.split;
    if (!split || split.status !== "scripted" || !split.episodes) continue;
    const arcId = arcIdByNumber.get(arc.episode) ?? null;
    for (const ep of split.episodes) {
      const slug = ep.scriptFile
        ? basename(ep.scriptFile, ".md")
        : `s01e${String(ep.episodeNumber).padStart(2, "0")}-${slugify(ep.title)}`;
      const scriptContent =
        ep.scriptFile && existsSync(ep.scriptFile)
          ? readFileSync(ep.scriptFile, "utf-8")
          : null;
      epRows.push({
        showId: show.id,
        season: 1,
        arcId,
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        slug,
        brief: ep.hook ?? null,
        tags: arc.tags ?? null,
        scriptContent,
        runtimeSeconds: ep.approximateMinutes
          ? Math.round(ep.approximateMinutes * 60)
          : null,
        lockStatus: "draft",
      });
    }
  }

  for (const row of epRows) {
    await db
      .insert(episodes)
      .values(row)
      .onConflictDoUpdate({
        target: [episodes.showId, episodes.slug],
        set: {
          season: row.season,
          arcId: row.arcId,
          episodeNumber: row.episodeNumber,
          title: row.title,
          brief: row.brief,
          tags: row.tags,
          scriptContent: row.scriptContent,
          runtimeSeconds: row.runtimeSeconds,
          lockStatus: row.lockStatus,
          updatedAt: sql`now()`,
        },
      });
    console.log(`upserted episode ${row.slug}`);
  }

  console.log(`done — ${epRows.length} episodes`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
