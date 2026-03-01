import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { createUser, listAdminUsersWithSources, upsertWorkoutSourceByUserId } from "@/lib/db/queries";
import { createUserSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await listAdminUsersWithSources();
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await createUser(parsed.data);
  await upsertWorkoutSourceByUserId(created.id, {
    sourceType: "template",
    goal: "maintenance",
    split: "full_body",
    templateId: "maintenance-full-body-3x",
  });
  return NextResponse.json({ user: created }, { status: 201 });
}
