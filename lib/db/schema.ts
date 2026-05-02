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
  lockStatus: text("lock_status").default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
