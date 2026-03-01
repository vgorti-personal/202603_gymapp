import { NextResponse } from "next/server";

import { getUserById } from "@/lib/db/queries";
import { getSpotifyAuthorizeUrl } from "@/lib/spotify";

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId query param is required." }, { status: 400 });
  }
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  return NextResponse.redirect(getSpotifyAuthorizeUrl(user.id));
}
