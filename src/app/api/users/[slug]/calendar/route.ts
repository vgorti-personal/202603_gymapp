import { NextResponse } from "next/server";

import {
  createCalendarEvent,
  getUserBySlug,
  getUserCalendarEvents,
  updateCalendarEventStatus,
} from "@/lib/db/queries";
import {
  createCalendarEventSchema,
  updateCalendarEventStatusSchema,
} from "@/lib/validators";

type Params = Promise<{ slug: string }>;

export async function GET(_: Request, context: { params: Params }) {
  const { slug } = await context.params;
  const user = await getUserBySlug(slug);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const events = await getUserCalendarEvents(user.id);
  return NextResponse.json({
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      eventDate: event.eventDate.toISOString(),
      status: event.status,
      notes: event.notes,
    })),
  });
}

export async function POST(request: Request, context: { params: Params }) {
  const { slug } = await context.params;
  const user = await getUserBySlug(slug);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const body = await request.json();
  const result = createCalendarEventSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const created = await createCalendarEvent(user.id, {
    title: result.data.title,
    eventDate: new Date(result.data.eventDate),
    notes: result.data.notes ?? null,
  });

  return NextResponse.json({
    event: {
      id: created.id,
      title: created.title,
      eventDate: created.eventDate.toISOString(),
      status: created.status,
      notes: created.notes,
    },
  });
}

export async function PATCH(request: Request, context: { params: Params }) {
  const { slug } = await context.params;
  const user = await getUserBySlug(slug);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const body = await request.json();
  const result = updateCalendarEventStatusSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }
  const updated = await updateCalendarEventStatus(
    user.id,
    result.data.eventId,
    result.data.status,
  );
  if (!updated) {
    return NextResponse.json({ error: "Calendar event not found." }, { status: 404 });
  }
  return NextResponse.json({
    event: {
      id: updated.id,
      title: updated.title,
      eventDate: updated.eventDate.toISOString(),
      status: updated.status,
      notes: updated.notes,
    },
  });
}
