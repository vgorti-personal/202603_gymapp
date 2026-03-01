import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const workoutSourceTypeEnum = pgEnum("workout_source_type", [
  "google_sheet",
  "template",
]);

export const calendarStatusEnum = pgEnum("calendar_status", ["planned", "done"]);
export const templateSelectionModeEnum = pgEnum("template_selection_mode", [
  "persistent",
  "session_prompt",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  spotifyEnabled: boolean("spotify_enabled").notNull().default(true),
  templateSelectionMode: templateSelectionModeEnum("template_selection_mode")
    .notNull()
    .default("persistent"),
  defaultCity: text("default_city").notNull().default("Atlanta, GA, USA"),
  timezone: text("timezone").notNull().default("America/New_York"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userWorkoutSources = pgTable("user_workout_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  sourceType: workoutSourceTypeEnum("source_type").notNull(),
  publishUrl: text("publish_url"),
  editUrl: text("edit_url"),
  goal: text("goal"),
  split: text("split"),
  templateId: text("template_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const spotifyAccounts = pgTable("spotify_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  spotifyUserId: text("spotify_user_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  eventDate: timestamp("event_date", { withTimezone: false }).notNull(),
  status: calendarStatusEnum("status").notNull().default("planned"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionTokenHash: text("session_token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserWorkoutSource = typeof userWorkoutSources.$inferSelect;
export type SpotifyAccount = typeof spotifyAccounts.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
