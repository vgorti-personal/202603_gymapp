import { NextResponse } from "next/server";

import { getWeatherSnapshot } from "@/lib/weather";

export async function GET(request: Request) {
  const city = new URL(request.url).searchParams.get("city");
  if (!city) {
    return NextResponse.json({ error: "city query param is required" }, { status: 400 });
  }

  const weather = await getWeatherSnapshot(city);
  if (!weather) {
    return NextResponse.json({ error: "Weather unavailable for that location." }, { status: 404 });
  }
  return NextResponse.json(weather);
}
