import { NextResponse } from "next/server";

import { fetchPublishedSheetTabs } from "@/lib/google-sheets";

export async function GET(request: Request) {
  const publishUrl = new URL(request.url).searchParams.get("publishUrl");
  if (!publishUrl) {
    return NextResponse.json({ error: "publishUrl query param is required." }, { status: 400 });
  }

  try {
    const tabs = await fetchPublishedSheetTabs(publishUrl);
    return NextResponse.json({ tabs });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to read sheet tabs." }, { status: 502 });
  }
}
