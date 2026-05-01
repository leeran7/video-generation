import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
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
