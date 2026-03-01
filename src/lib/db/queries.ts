import { and, asc, desc, eq, inArray } from "drizzle-orm";

import type { CalendarEventDto, DashboardPayload, UserProfile } from "@/lib/types";
import { getTemplateById } from "@/lib/workout-templates";

import { db } from "./index";
import { calendarEvents, spotifyAccounts, userWorkoutSources, users } from "./schema";

function toUserProfile(row: typeof users.$inferSelect): UserProfile {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    spotifyEnabled: row.spotifyEnabled,
    defaultCity: row.defaultCity,
    timezone: row.timezone,
  };
}

function toCalendarDto(row: typeof calendarEvents.$inferSelect): CalendarEventDto {
  return {
    id: row.id,
    title: row.title,
    eventDate: row.eventDate.toISOString(),
    status: row.status,
    notes: row.notes,
  };
}

export async function listUsers() {
  return db
    .select()
    .from(users)
    .orderBy(asc(users.displayName))
    .then((rows) => rows.map(toUserProfile));
}

export async function getUserBySlug(slug: string) {
  const rows = await db.select().from(users).where(eq(users.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getUserById(userId: string) {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ?? null;
}

export async function getUserWorkoutSource(userId: string) {
  const rows = await db
    .select()
    .from(userWorkoutSources)
    .where(eq(userWorkoutSources.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserCalendarEvents(userId: string) {
  return db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.userId, userId))
    .orderBy(asc(calendarEvents.eventDate));
}

export async function getDashboardPayloadBySlug(
  slug: string,
  weather: DashboardPayload["weather"],
): Promise<DashboardPayload | null> {
  const user = await getUserBySlug(slug);
  if (!user) {
    return null;
  }
  const [workoutSource, calendar, spotifyRow] = await Promise.all([
    getUserWorkoutSource(user.id),
    getUserCalendarEvents(user.id),
    db
      .select({ id: spotifyAccounts.id })
      .from(spotifyAccounts)
      .where(eq(spotifyAccounts.userId, user.id))
      .limit(1),
  ]);

  const template = workoutSource ? getTemplateById(workoutSource.templateId) : null;

  return {
    user: toUserProfile(user),
    workoutSource: workoutSource
      ? {
          id: workoutSource.id,
          sourceType: workoutSource.sourceType,
          publishUrl: workoutSource.publishUrl,
          editUrl: workoutSource.editUrl,
          goal: workoutSource.goal,
          split: workoutSource.split,
          templateId: workoutSource.templateId,
        }
      : null,
    workoutTemplate: template,
    calendarEvents: calendar.map(toCalendarDto),
    weather,
    spotifyLinked: spotifyRow.length > 0,
  };
}

export async function listAdminUsersWithSources() {
  const allUsers = await db.select().from(users).orderBy(asc(users.displayName));
  const ids = allUsers.map((user) => user.id);
  if (ids.length === 0) {
    return [];
  }
  const [sources, spotify] = await Promise.all([
    db
      .select()
      .from(userWorkoutSources)
      .where(inArray(userWorkoutSources.userId, ids)),
    db
      .select({ userId: spotifyAccounts.userId })
      .from(spotifyAccounts)
      .where(inArray(spotifyAccounts.userId, ids)),
  ]);
  const sourceByUser = new Map(sources.map((source) => [source.userId, source]));
  const spotifyLinkedByUser = new Set(spotify.map((row) => row.userId));

  return allUsers.map((user) => ({
    ...toUserProfile(user),
    spotifyLinked: spotifyLinkedByUser.has(user.id),
    workoutSource: sourceByUser.get(user.id) ?? null,
  }));
}

export async function createCalendarEvent(
  userId: string,
  payload: { title: string; eventDate: Date; notes?: string | null },
) {
  const rows = await db
    .insert(calendarEvents)
    .values({
      userId,
      title: payload.title,
      eventDate: payload.eventDate,
      notes: payload.notes,
      status: "planned",
    })
    .returning();
  return rows[0];
}

export async function updateCalendarEventStatus(
  userId: string,
  eventId: string,
  status: "planned" | "done",
) {
  const rows = await db
    .update(calendarEvents)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)))
    .returning();
  return rows[0] ?? null;
}

export async function createUser(payload: {
  displayName: string;
  slug: string;
  defaultCity?: string;
  timezone?: string;
  spotifyEnabled?: boolean;
}) {
  const rows = await db
    .insert(users)
    .values({
      displayName: payload.displayName,
      slug: payload.slug,
      defaultCity: payload.defaultCity ?? "Atlanta, GA, USA",
      timezone: payload.timezone ?? "America/New_York",
      spotifyEnabled: payload.spotifyEnabled ?? true,
      updatedAt: new Date(),
    })
    .returning();
  return rows[0];
}

export async function updateUserById(
  userId: string,
  payload: Partial<{
    displayName: string;
    defaultCity: string;
    timezone: string;
    spotifyEnabled: boolean;
  }>,
) {
  const rows = await db
    .update(users)
    .set({ ...payload, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return rows[0] ?? null;
}

export async function upsertWorkoutSourceByUserId(
  userId: string,
  payload: {
    sourceType: "google_sheet" | "template";
    publishUrl?: string | null;
    editUrl?: string | null;
    goal?: string | null;
    split?: string | null;
    templateId?: string | null;
  },
) {
  const existing = await getUserWorkoutSource(userId);
  if (!existing) {
    const rows = await db
      .insert(userWorkoutSources)
      .values({
        userId,
        sourceType: payload.sourceType,
        publishUrl: payload.publishUrl ?? null,
        editUrl: payload.editUrl ?? null,
        goal: payload.goal ?? null,
        split: payload.split ?? null,
        templateId: payload.templateId ?? null,
      })
      .returning();
    return rows[0];
  }
  const rows = await db
    .update(userWorkoutSources)
    .set({
      sourceType: payload.sourceType,
      publishUrl: payload.publishUrl ?? null,
      editUrl: payload.editUrl ?? null,
      goal: payload.goal ?? null,
      split: payload.split ?? null,
      templateId: payload.templateId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(userWorkoutSources.userId, userId))
    .returning();
  return rows[0];
}

export async function getLatestCalendarEventForUser(userId: string) {
  const rows = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.userId, userId))
    .orderBy(desc(calendarEvents.eventDate))
    .limit(1);
  return rows[0] ?? null;
}
