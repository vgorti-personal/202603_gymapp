import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getUserById } from "@/lib/db/queries";
import {
  encryptSpotifyToken,
  exchangeSpotifyCode,
  fetchSpotifyProfile,
  validateSpotifyState,
} from "@/lib/spotify";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const code = search.get("code");
  const state = search.get("state");
  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state." }, { status: 400 });
  }

  const userId = validateSpotifyState(state);
  if (!userId) {
    return NextResponse.json({ error: "Invalid state token." }, { status: 400 });
  }
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const token = await exchangeSpotifyCode(code);
  const spotifyProfile = await fetchSpotifyProfile(token.access_token);
  const expiresAt = new Date(Date.now() + token.expires_in * 1000);
  const existing = await db
    .select()
    .from(schema.spotifyAccounts)
    .where(eq(schema.spotifyAccounts.userId, userId))
    .limit(1);
  const resolvedRefreshToken = token.refresh_token;
  if (!resolvedRefreshToken && !existing[0]) {
    return NextResponse.json(
      { error: "Spotify did not return refresh token." },
      { status: 502 },
    );
  }
  const refreshTokenEncrypted = resolvedRefreshToken
    ? encryptSpotifyToken(resolvedRefreshToken)
    : existing[0]!.refreshToken;

  await db
    .insert(schema.spotifyAccounts)
    .values({
      userId,
      spotifyUserId: spotifyProfile.id,
      accessToken: encryptSpotifyToken(token.access_token),
      refreshToken: refreshTokenEncrypted,
      expiresAt,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.spotifyAccounts.userId,
      set: {
        spotifyUserId: spotifyProfile.id,
        accessToken: encryptSpotifyToken(token.access_token),
        refreshToken: refreshTokenEncrypted,
        expiresAt,
        updatedAt: new Date(),
      },
    });

  return NextResponse.redirect(new URL(`/dashboard/${user.slug}?spotify=connected`, request.url));
}
