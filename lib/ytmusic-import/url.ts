const SUPPORTED_HOSTS = new Set([
  "music.youtube.com",
  "www.youtube.com",
  "youtube.com",
]);

export class InvalidPlaylistUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPlaylistUrlError";
  }
}

export function extractYtMusicPlaylistId(url: string): string {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    throw new InvalidPlaylistUrlError("Playlist URL is required.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new InvalidPlaylistUrlError("Playlist URL is invalid.");
  }

  if (!SUPPORTED_HOSTS.has(parsedUrl.hostname)) {
    throw new InvalidPlaylistUrlError("Only YouTube or YouTube Music playlist URLs are supported.");
  }

  const playlistId = parsedUrl.searchParams.get("list")?.trim();
  if (!playlistId) {
    throw new InvalidPlaylistUrlError("Playlist URL must include a list parameter.");
  }

  return playlistId;
}
