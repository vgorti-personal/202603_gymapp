import { NextResponse } from "next/server";

import { filterTemplates } from "@/lib/workout-templates";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const goal = search.get("goal");
  const split = search.get("split");
  const templates = filterTemplates(goal, split);
  return NextResponse.json({ templates });
}
