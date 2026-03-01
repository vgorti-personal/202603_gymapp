import { eq } from "drizzle-orm";

import { db, schema } from "../src/lib/db";

async function seedUsers() {
  const seededUsers = [
    {
      slug: "vishy",
      displayName: "Vishy",
      defaultCity: "New York",
      timezone: "America/New_York",
      spotifyEnabled: true,
    },
    {
      slug: "emily",
      displayName: "Emily",
      defaultCity: "New York",
      timezone: "America/New_York",
      spotifyEnabled: true,
    },
    {
      slug: "guest",
      displayName: "Guest",
      defaultCity: "New York",
      timezone: "America/New_York",
      spotifyEnabled: false,
    },
  ];

  const bySlug = new Map<string, string>();
  for (const user of seededUsers) {
    const rows = await db
      .insert(schema.users)
      .values(user)
      .onConflictDoUpdate({
        target: schema.users.slug,
        set: {
          displayName: user.displayName,
          defaultCity: user.defaultCity,
          timezone: user.timezone,
          spotifyEnabled: user.spotifyEnabled,
          updatedAt: new Date(),
        },
      })
      .returning();
    bySlug.set(user.slug, rows[0].id);
  }
  return bySlug;
}

async function upsertWorkoutSource(
  userId: string,
  values: {
    sourceType: "google_sheet" | "template";
    publishUrl?: string | null;
    editUrl?: string | null;
    goal?: string | null;
    split?: string | null;
    templateId?: string | null;
  },
) {
  const existing = await db
    .select({ id: schema.userWorkoutSources.id })
    .from(schema.userWorkoutSources)
    .where(eq(schema.userWorkoutSources.userId, userId))
    .limit(1);

  if (!existing[0]) {
    await db.insert(schema.userWorkoutSources).values({
      userId,
      ...values,
    });
    return;
  }
  await db
    .update(schema.userWorkoutSources)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(schema.userWorkoutSources.userId, userId));
}

async function seedWorkoutSources(bySlug: Map<string, string>) {
  const vishyId = bySlug.get("vishy");
  const emilyId = bySlug.get("emily");
  const guestId = bySlug.get("guest");
  if (!vishyId || !emilyId || !guestId) {
    throw new Error("Expected seeded users were not found.");
  }

  await upsertWorkoutSource(vishyId, {
    sourceType: "google_sheet",
    publishUrl:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9Cre6Tkewc09oaIvQQn_n6YVv4Zxq9-ULz5uA_qk0ipCvbxMCwQ21JHQkoee35GTmAfM6_AcyOJlB/pubhtml?widget=true&headers=false",
    editUrl:
      "https://docs.google.com/spreadsheets/d/1IoFVpg9IViJDJb8GxEUdOHPusB5HB0CDfScRwk4iV18/edit?usp=sharing",
    goal: null,
    split: null,
    templateId: null,
  });

  await upsertWorkoutSource(emilyId, {
    sourceType: "template",
    goal: "maintenance",
    split: "full_body",
    templateId: "maintenance-full-body-3x",
    publishUrl: null,
    editUrl: null,
  });

  await upsertWorkoutSource(guestId, {
    sourceType: "template",
    goal: "flexibility",
    split: "full_body",
    templateId: "flexibility-foundation",
    publishUrl: null,
    editUrl: null,
  });
}

async function seedCalendar(bySlug: Map<string, string>) {
  const vishyId = bySlug.get("vishy");
  if (!vishyId) {
    return;
  }

  const existing = await db
    .select({ id: schema.calendarEvents.id })
    .from(schema.calendarEvents)
    .where(eq(schema.calendarEvents.userId, vishyId))
    .limit(1);
  if (existing[0]) {
    return;
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  await db.insert(schema.calendarEvents).values([
    {
      userId: vishyId,
      title: "Push Day",
      eventDate: today,
      status: "planned",
      notes: "Focus on clean reps and progressive loading.",
    },
    {
      userId: vishyId,
      title: "Mobility + Core",
      eventDate: tomorrow,
      status: "planned",
      notes: "Use timer intervals and keep intensity moderate.",
    },
  ]);
}

async function main() {
  const bySlug = await seedUsers();
  await seedWorkoutSources(bySlug);
  await seedCalendar(bySlug);
}

main()
  .then(() => {
    console.log("Seed complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
