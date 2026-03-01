import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { updateUserById } from "@/lib/db/queries";
import { updateUserSchema } from "@/lib/validators";

type Params = Promise<{ id: string }>;

export async function PATCH(request: NextRequest, context: { params: Params }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await updateUserById(id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  return NextResponse.json({ user: updated });
}
