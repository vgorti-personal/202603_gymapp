import { createHmac } from "node:crypto";

import { decryptSecret, encryptSecret, randomToken } from "@/lib/crypto";
import { env } from "@/lib/env";
import type { SpotifyNowPlaying } from "@/lib/types";

const SPOTIFY_SCOPE = [
  "user-read-currently-playing",
  "user-read-playback-state",
].join(" ");

type TokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
};

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSpotifyState(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      nonce: randomToken(8),
      exp: Date.now() + 10 * 60 * 1000,
    }),
  ).toString("base64url");
  const signature = signPayload(payload, env.sessionSecret);
  return `${payload}.${signature}`;
}

export function validateSpotifyState(state: string) {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) {
    return null;
  }
  const expectedSig = signPayload(payload, env.sessionSecret);
  if (expectedSig !== signature) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId: string;
      exp: number;
    };
    if (Date.now() > data.exp) {
      return null;
    }
    return data.userId;
  } catch {
    return null;
  }
}

export function getSpotifyAuthorizeUrl(userId: string) {
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.spotifyClientId);
  url.searchParams.set("scope", SPOTIFY_SCOPE);
  url.searchParams.set("redirect_uri", env.spotifyRedirectUri);
  url.searchParams.set("state", createSpotifyState(userId));
  return url.toString();
}

function getSpotifyBasicAuth() {
  return Buffer.from(`${env.spotifyClientId}:${env.spotifyClientSecret}`).toString("base64");
}

export async function exchangeSpotifyCode(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.spotifyRedirectUri,
  });
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${getSpotifyBasicAuth()}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Spotify code exchange failed: ${response.status}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function refreshSpotifyToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${getSpotifyBasicAuth()}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Spotify refresh failed: ${response.status}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function fetchSpotifyProfile(accessToken: string) {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Spotify profile fetch failed: ${response.status}`);
  }
  return (await response.json()) as { id: string };
}

export async function fetchSpotifyNowPlaying(accessToken: string): Promise<SpotifyNowPlaying> {
  const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 204) {
    return {
      linked: true,
      isPlaying: false,
      trackName: null,
      artistName: null,
      albumName: null,
      albumArtUrl: null,
      externalUrl: null,
      progressMs: null,
      durationMs: null,
    };
  }

  if (!response.ok) {
    throw new Error(`Spotify now playing failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    is_playing: boolean;
    progress_ms: number;
    item?: {
      name: string;
      duration_ms: number;
      album: { name: string; images: Array<{ url: string }> };
      artists: Array<{ name: string }>;
      external_urls: { spotify: string };
    };
  };

  return {
    linked: true,
    isPlaying: payload.is_playing,
    trackName: payload.item?.name ?? null,
    artistName: payload.item?.artists.map((artist) => artist.name).join(", ") ?? null,
    albumName: payload.item?.album.name ?? null,
    albumArtUrl: payload.item?.album.images?.[0]?.url ?? null,
    externalUrl: payload.item?.external_urls.spotify ?? null,
    progressMs: payload.progress_ms ?? null,
    durationMs: payload.item?.duration_ms ?? null,
  };
}

export function encryptSpotifyToken(raw: string) {
  return encryptSecret(raw, env.tokenEncryptionKey);
}

export function decryptSpotifyToken(raw: string) {
  return decryptSecret(raw, env.tokenEncryptionKey);
}
