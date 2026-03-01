import { NextResponse } from "next/server";

import { getDashboardPayloadBySlug, getUserBySlug } from "@/lib/db/queries";
import { getWeatherSnapshot } from "@/lib/weather";

type Params = Promise<{ slug: string }>;

export async function GET(_: Request, context: { params: Params }) {
  const { slug } = await context.params;
  const user = await getUserBySlug(slug);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const weather = await getWeatherSnapshot(user.defaultCity);
  const payload = await getDashboardPayloadBySlug(slug, weather);
  if (!payload) {
    return NextResponse.json({ error: "Dashboard not found." }, { status: 404 });
  }
  return NextResponse.json(payload);
}
