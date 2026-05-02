import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const shows = pgTable("shows", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  format: jsonb("format").$type<Record<string, unknown> | null>(),
  seriesBible: jsonb("series_bible").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  showId: uuid("show_id").references(() => shows.id),
  name: text("name"),
  realName: text("real_name"),
  slug: text("slug").notNull(),
  rosterNumber: integer("roster_number"),
  type: text("type"),
  affiliation: text("affiliation"),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  designSheet: text("design_sheet"),
  lockStatus: text("lock_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const arcs = pgTable(
  "arcs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id)
      .notNull(),
    season: integer("season").notNull().default(1),
    arcNumber: integer("arc_number").notNull(),
    title: text("title").notNull(),
    brief: text("brief"),
    tags: text("tags").array(),
    lockStatus: text("lock_status").default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.showId, table.season, table.arcNumber)]
);

export const episodes = pgTable("episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  showId: uuid("show_id").references(() => shows.id),
  season: integer("season").notNull().default(1),
  arcId: uuid("arc_id").references(() => arcs.id),
  episodeNumber: integer("episode_number").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  focusCharacterId: uuid("focus_character_id").references(() => characters.id),
  brief: text("brief"),
  tags: text("tags").array(),
  scriptContent: text("script_content"),
  runtimeSeconds: integer("runtime_seconds"),
  masterVideoPath: text("master_video_path"),
  lockStatus: text("lock_status").default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const scenes = pgTable(
  "scenes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    episodeId: uuid("episode_id").references(() => episodes.id, {
      onDelete: "cascade",
    }),
    sceneNumber: integer("scene_number").notNull(),
    sceneId: text("scene_id"),
    locationId: uuid("location_id"),
    title: text("title"),
    durationSeconds: integer("duration_seconds"),
    scriptBlock: text("script_block"),
    generationPrompt: text("generation_prompt"),
    imageRef: text("image_ref"),
    videoPath: text("video_path"),
    status: text("status").default("pending"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.episodeId, table.sceneNumber)]
);

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  status: text("status").default("pending"),
  episodeId: uuid("episode_id").references(() => episodes.id, {
    onDelete: "cascade",
  }),
  sceneId: uuid("scene_id").references(() => scenes.id, {
    onDelete: "cascade",
  }),
  inngestRunId: text("inngest_run_id"),
  progress: jsonb("progress")
    .$type<Record<string, unknown>>()
    .default(sql`'{}'::jsonb`),
  result: jsonb("result").$type<Record<string, unknown> | null>(),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
