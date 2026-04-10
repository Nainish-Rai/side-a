import { prisma } from "@/lib/db/prisma";

const SPOTIFY_TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;

export class SpotifyAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyAuthenticationError";
  }
}

export class SpotifyAccountNotLinkedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyAccountNotLinkedError";
  }
}

function requireSpotifyOAuthConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new SpotifyAuthenticationError("Spotify OAuth is not configured.");
  }

  return { clientId, clientSecret };
}

async function refreshSpotifyAccessToken(accountId: string, refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = requireSpotifyOAuthConfig();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new SpotifyAuthenticationError(
      `Spotify token refresh failed with status ${response.status}.`,
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
  };

  if (!payload.access_token) {
    throw new SpotifyAuthenticationError("Spotify token refresh did not return an access token.");
  }

  const updatedAccount = await prisma.account.update({
    where: { id: accountId },
    data: {
      accessToken: payload.access_token,
      accessTokenExpiresAt:
        typeof payload.expires_in === "number"
          ? new Date(Date.now() + payload.expires_in * 1000)
          : null,
      refreshToken: payload.refresh_token ?? refreshToken,
      scope: payload.scope ?? undefined,
    },
  });

  if (!updatedAccount.accessToken) {
    throw new SpotifyAuthenticationError("Spotify token refresh did not persist an access token.");
  }

  return updatedAccount.accessToken;
}

function isAccessTokenStale(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() <= Date.now() + ACCESS_TOKEN_REFRESH_BUFFER_MS;
}

export async function getSpotifyAccountForUser(userId: string) {
  return prisma.account.findFirst({
    where: {
      userId,
      providerId: "spotify",
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getSpotifyAccessTokenForUser(userId: string): Promise<string> {
  const account = await getSpotifyAccountForUser(userId);
  if (!account) {
    throw new SpotifyAccountNotLinkedError("Spotify account is not connected.");
  }

  if (account.accessToken && !isAccessTokenStale(account.accessTokenExpiresAt ?? null)) {
    return account.accessToken;
  }

  if (!account.refreshToken) {
    if (account.accessToken) {
      return account.accessToken;
    }

    throw new SpotifyAuthenticationError("Spotify account does not have a usable access token.");
  }

  return refreshSpotifyAccessToken(account.id, account.refreshToken!);
}
