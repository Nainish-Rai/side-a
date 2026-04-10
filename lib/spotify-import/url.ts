import { parse as parseSpotifyUri } from "spotify-uri";

const SUPPORTED_HOSTS = new Set(["open.spotify.com", "play.spotify.com"]);

export class InvalidSpotifyPlaylistUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSpotifyPlaylistUrlError";
  }
}

export function normalizeSpotifyPlaylistUrl(url: string): string {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    throw new InvalidSpotifyPlaylistUrlError("Playlist URL is required.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new InvalidSpotifyPlaylistUrlError("Playlist URL is invalid.");
  }

  if (!SUPPORTED_HOSTS.has(parsedUrl.hostname)) {
    throw new InvalidSpotifyPlaylistUrlError("Only Spotify playlist URLs are supported.");
  }

  const parsedSpotifyUri = parseSpotifyUri(trimmedUrl);
  if (parsedSpotifyUri.type !== "playlist") {
    throw new InvalidSpotifyPlaylistUrlError("Spotify URL must point to a playlist.");
  }

  return parsedSpotifyUri.toURL();
}

export function extractSpotifyPlaylistId(url: string): string {
  const normalizedUrl = normalizeSpotifyPlaylistUrl(url);
  const parsedSpotifyUri = parseSpotifyUri(normalizedUrl);

  if (parsedSpotifyUri.type !== "playlist") {
    throw new InvalidSpotifyPlaylistUrlError("Spotify URL must point to a playlist.");
  }

  return parsedSpotifyUri.id;
}
