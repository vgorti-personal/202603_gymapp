import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { getUserById, upsertWorkoutSourceByUserId } from "@/lib/db/queries";
import { sanitizeGoogleSheetUrl } from "@/lib/google-sheets";
import { getTemplateById } from "@/lib/workout-templates";
import { updateWorkoutSourceSchema } from "@/lib/validators";

type Params = Promise<{ id: string }>;

export async function PATCH(request: NextRequest, context: { params: Params }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const user = await getUserById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const body = await request.json();
  const parsed = updateWorkoutSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;

  if (payload.sourceType === "google_sheet") {
    const publishUrl = sanitizeGoogleSheetUrl(payload.publishUrl ?? "");
    const editUrl = sanitizeGoogleSheetUrl(payload.editUrl ?? "");
    if (!publishUrl || !editUrl) {
      return NextResponse.json(
        { error: "Google sheet publish and edit URLs must be valid Google spreadsheet URLs." },
        { status: 400 },
      );
    }
    const source = await upsertWorkoutSourceByUserId(id, {
      sourceType: "google_sheet",
      publishUrl,
      editUrl,
      goal: null,
      split: null,
      templateId: null,
    });
    return NextResponse.json({ source });
  }

  const template = getTemplateById(payload.templateId);
  if (!template) {
    return NextResponse.json({ error: "Invalid templateId for template source." }, { status: 400 });
  }

  const source = await upsertWorkoutSourceByUserId(id, {
    sourceType: "template",
    goal: payload.goal ?? template.goal,
    split: payload.split ?? template.split,
    templateId: template.id,
    publishUrl: null,
    editUrl: null,
  });
  return NextResponse.json({ source });
}
