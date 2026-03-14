import type { Track, SyncedLyric, LyricsData } from "./types";

const LRCLIB_API = "https://lrclib.net/api/get";
const LYRICS_PLUS_API = "https://lyricsplus.prjktla.workers.dev/v2/lyrics/get";

interface LRCLIBResponse {
  id: number;
  name?: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration: number;
  plainLyrics?: string;
  syncedLyrics?: string;
}

export interface GeniusHit {
  result: {
    id: number;
    url: string;
    title: string;
    primary_artist: {
      name: string;
    };
    path: string;
  };
}

export interface GeniusSearchResponse {
  response: {
    hits: GeniusHit[];
  };
}

const inFlightRequests = new Map<string, Promise<{ synced: SyncedLyric[]; plain: string | null } | null>>();

export function parseSyncedLyrics(subtitles: string): SyncedLyric[] {
  if (!subtitles) return [];

  const lines = subtitles.split("\n").filter((line) => line.trim());
  return lines
    .map((line) => {
      const match = line.match(/\[(\d+):(\d+)\.(\d+)\]\s*(.+)/);
      if (match) {
        const [, minutes, seconds, centiseconds, text] = match;
        const timeInSeconds =
          parseInt(minutes) * 60 +
          parseInt(seconds) +
          parseInt(centiseconds) / 100;
        return { time: timeInSeconds, text: text.trim() };
      }
      return null;
    })
    .filter((item): item is SyncedLyric => item !== null);
}

export async function fetchLRCLIB(
  title: string,
  artist: string,
  album?: string,
  duration?: number
): Promise<{ synced: SyncedLyric[]; plain: string | null } | null> {
  const cacheKey = `${title}:${artist}:${album}:${duration}`;
  const pending = inFlightRequests.get(cacheKey);
  if (pending) return pending;

  const params = new URLSearchParams({
    track_name: title,
    artist_name: artist,
  });

  if (album) params.append("album_name", album);
  if (duration) params.append("duration", Math.round(duration).toString());

  const request = (async () => {
    try {
      const response = await fetch(`${LRCLIB_API}?${params.toString()}`, {
        headers: { "User-Agent": "SideA/1.0" },
        next: { revalidate: 86400 },
      });

      if (!response.ok) return null;

      const data: LRCLIBResponse = await response.json();

      if (data.syncedLyrics) {
        return {
          synced: parseSyncedLyrics(data.syncedLyrics),
          plain: data.plainLyrics || null,
        };
      }

      if (data.plainLyrics) {
        return {
          synced: [],
          plain: data.plainLyrics,
        };
      }
    } catch (error) {
      console.warn("[LRCLIB] Fetch failed:", error);
    }

    return null;
  })();

  inFlightRequests.set(cacheKey, request);

  try {
    const result = await request;
    return result;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

let geniusAccessToken: string | null = null;

export function setGeniusToken(token: string): void {
  geniusAccessToken = token;
}

export async function searchGenius(
  query: string,
  options?: { signal?: AbortSignal }
): Promise<GeniusHit[]> {
  if (!geniusAccessToken) return [];

  try {
    const response = await fetch(
      `https://api.genius.com/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${geniusAccessToken}`,
        },
        signal: options?.signal,
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) return [];

    const data: GeniusSearchResponse = await response.json();
    return data.response?.hits || [];
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    console.warn("[Genius] Search failed:", error);
    return [];
  }
}

export async function fetchGeniusAnnotations(
  songId: number,
  options?: { signal?: AbortSignal }
): Promise<{ annotations: Array<{ fragment: string; annotation: string }> } | null> {
  if (!geniusAccessToken) return null;

  try {
    const response = await fetch(
      `https://api.genius.com/songs/${songId}?access_token=${geniusAccessToken}`,
      { signal: options?.signal, next: { revalidate: 86400 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const song = data.response?.song;

    if (!song) return null;

    type ChildNode = { tag?: string; children?: ChildNode[]; text?: string };
    const children: ChildNode[] = song.description?.dom?.children || [];

    const annotations = children
      .filter((child) => child.tag === "p")
      .flatMap((paragraph) =>
        (paragraph.children || [])
          .filter((child) => !child.tag || child.tag === "p")
          .map((child) => ({
            fragment: "",
            annotation: child.text || "",
          }))
      );

    return { annotations };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    console.warn("[Genius] Fetch annotations failed:", error);
    return null;
  }
}

async function fetchLyricsPlus(
  title: string,
  artist: string,
  album: string | undefined,
  duration: number,
  signal?: AbortSignal
): Promise<LyricsData | null> {
  try {
    const params = new URLSearchParams({
      title,
      artist,
      album: album || "",
      duration: Math.floor(duration).toString(),
      source: "apple,lyricsplus,musixmatch,spotify",
    });

    const response = await fetch(`${LYRICS_PLUS_API}?${params.toString()}`, {
      signal,
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn(`[LyricsPlus] API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data && data.lyrics && data.lyrics.length > 0) {
      const parsed = data.lyrics.map((line: { time: number; text: string }) => ({
        time: line.time / 1000,
        text: line.text,
      }));

      return {
        parsed,
        lyricsPlus: data,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    console.warn("[LyricsPlus] Failed to fetch:", error);
  }

  return null;
}

export async function fetchLyricsMultiSource(
  track: Track,
  options?: { signal?: AbortSignal }
): Promise<LyricsData | null> {
  const title = track.title;
  const artist = track.artist?.name || track.artists?.[0]?.name || "";
  const album = track.album?.title;
  const duration = track.duration;

  const [lrcResult, plusResult] = await Promise.all([
    fetchLRCLIB(title, artist, album, duration),
    fetchLyricsPlus(title, artist, album, duration, options?.signal),
  ]);

  if (lrcResult && lrcResult.synced.length > 0) {
    return {
      parsed: lrcResult.synced,
      lyrics: lrcResult.plain || undefined,
      ...(plusResult && { lyricsPlus: plusResult.lyricsPlus }),
    };
  }

  if (plusResult) {
    if (lrcResult?.plain) {
      return {
        parsed: plusResult.parsed,
        lyrics: lrcResult.plain,
        lyricsPlus: plusResult.lyricsPlus,
      };
    }
    return plusResult;
  }

  if (lrcResult?.plain) {
    return {
      parsed: [],
      lyrics: lrcResult.plain,
    };
  }

  return null;
}