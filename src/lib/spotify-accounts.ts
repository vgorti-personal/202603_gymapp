import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { decryptSpotifyToken, encryptSpotifyToken, refreshSpotifyToken } from "@/lib/spotify";

export async function refreshAndPersistAccount(account: typeof schema.spotifyAccounts.$inferSelect) {
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
    account,
  };
}

export async function getSpotifyAccessTokenForUser(userId: string) {
  const rows = await db
    .select()
    .from(schema.spotifyAccounts)
    .where(eq(schema.spotifyAccounts.userId, userId))
    .limit(1);

  const account = rows[0];
  if (!account) {
    return null;
  }

  let accessToken = decryptSpotifyToken(account.accessToken);
  if (account.expiresAt.getTime() <= Date.now() + 20_000) {
    const refreshed = await refreshAndPersistAccount(account);
    accessToken = refreshed.accessToken;
  }

  return { account, accessToken };
}
