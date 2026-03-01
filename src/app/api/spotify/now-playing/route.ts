import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, schema } from "@/lib/db";
import { decryptSpotifyToken, encryptSpotifyToken, fetchSpotifyNowPlaying, refreshSpotifyToken } from "@/lib/spotify";

async function refreshAndPersistAccount(account: typeof schema.spotifyAccounts.$inferSelect) {
  const refreshToken = decryptSpotifyToken(account.refreshToken);
  const refreshed = await refreshSpotifyToken(refreshToken);
  const nextRefreshToken = refreshed.refresh_token ?? refreshToken;
  const nextAccessTokenEncrypted = encryptSpotifyToken(refreshed.access_token);
  const nextRefreshTokenEncrypted = encryptSpotifyToken(nextRefreshToken);
  const nextExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

  await db
    .update(schema.spotifyAccounts)
    .set({
      accessToken: nextAccessTokenEncrypted,
      refreshToken: nextRefreshTokenEncrypted,
      expiresAt: nextExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.spotifyAccounts.id, account.id));

  return {
    accessToken: refreshed.access_token,
  };
}

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId query param is required." }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(schema.spotifyAccounts)
    .where(eq(schema.spotifyAccounts.userId, userId))
    .limit(1);

  const account = rows[0];
  if (!account) {
    return NextResponse.json({
      linked: false,
      isPlaying: false,
      trackName: null,
      artistName: null,
      albumName: null,
      albumArtUrl: null,
      externalUrl: null,
      progressMs: null,
      durationMs: null,
    });
  }

  let accessToken = decryptSpotifyToken(account.accessToken);

  if (account.expiresAt.getTime() <= Date.now() + 20_000) {
    const refreshed = await refreshAndPersistAccount(account);
    accessToken = refreshed.accessToken;
  }

  try {
    const payload = await fetchSpotifyNowPlaying(accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    try {
      const refreshed = await refreshAndPersistAccount(account);
      const payload = await fetchSpotifyNowPlaying(refreshed.accessToken);
      return NextResponse.json(payload);
    } catch (retryError) {
      console.error(retryError);
      return NextResponse.json(
        { error: "Spotify now playing unavailable." },
        { status: 502 },
      );
    }
  }
}
