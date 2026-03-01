import { NextResponse } from "next/server";

import { getSpotifyAccessTokenForUser, refreshAndPersistAccount } from "@/lib/spotify-accounts";
import { fetchSpotifyNowPlaying } from "@/lib/spotify";

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId query param is required." }, { status: 400 });
  }

  const resolved = await getSpotifyAccessTokenForUser(userId);
  if (!resolved) {
    return NextResponse.json({
      linked: false,
      controllable: false,
      controlErrorCode: null,
      controlErrorMessage: null,
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

  const { account } = resolved;
  const accessToken = resolved.accessToken;

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
        {
          linked: true,
          controllable: false,
          controlErrorCode: "unavailable",
          controlErrorMessage: "Spotify now playing unavailable.",
          isPlaying: false,
          trackName: null,
          artistName: null,
          albumName: null,
          albumArtUrl: null,
          externalUrl: null,
          progressMs: null,
          durationMs: null,
        },
        { status: 502 },
      );
    }
  }
}
