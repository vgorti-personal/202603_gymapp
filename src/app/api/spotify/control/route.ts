import { NextResponse } from "next/server";
import { z } from "zod";

import { getSpotifyAccessTokenForUser, refreshAndPersistAccount } from "@/lib/spotify-accounts";
import { controlSpotifyPlayback, fetchSpotifyNowPlaying } from "@/lib/spotify";

const controlSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["toggle_playback", "next_track"]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = controlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { userId, action } = parsed.data;
  const resolved = await getSpotifyAccessTokenForUser(userId);
  if (!resolved) {
    return NextResponse.json(
      { error: "Spotify account is not linked for this user.", errorCode: "unavailable" },
      { status: 404 },
    );
  }

  const { account } = resolved;
  let accessToken = resolved.accessToken;

  let controlResult = await controlSpotifyPlayback(accessToken, action);
  if (!controlResult.ok) {
    try {
      const refreshed = await refreshAndPersistAccount(account);
      accessToken = refreshed.accessToken;
      controlResult = await controlSpotifyPlayback(accessToken, action);
    } catch (error) {
      console.error(error);
    }
  }

  if (!controlResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: controlResult.errorCode,
        errorMessage: controlResult.errorMessage,
      },
      { status: 409 },
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 350));

  try {
    const nowPlaying = await fetchSpotifyNowPlaying(accessToken);
    return NextResponse.json({
      ok: true,
      nowPlaying: {
        ...nowPlaying,
        controllable: true,
        controlErrorCode: null,
        controlErrorMessage: null,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      ok: true,
      nowPlaying: null,
    });
  }
}
