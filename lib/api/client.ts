import { APICache } from "./cache";
import { RATE_LIMIT_ERROR_MESSAGE, deriveTrackQuality, delay } from "./utils";
import type {
  APISettings,
  SearchResponse,
  Track,
  Album,
  Artist,
  Playlist,
  TrackLookup,
  CacheStats,
} from "./types";

export const DASH_MANIFEST_UNAVAILABLE_CODE = "DASH_MANIFEST_UNAVAILABLE";

export class LosslessAPI {
  private settings: APISettings;
  private cache: APICache;
  private streamCache: Map<string, string>;

  constructor(settings: APISettings) {
    this.settings = settings;
    this.cache = new APICache({
      maxSize: 200,
      ttl: 1000 * 60 * 30,
    });
    this.streamCache = new Map();

    setInterval(() => {
      this.cache.clearExpired();
      this.pruneStreamCache();
    }, 1000 * 60 * 5);
  }

  private pruneStreamCache(): void {
    if (this.streamCache.size > 50) {
      const entries = Array.from(this.streamCache.entries());
      const toDelete = entries.slice(0, entries.length - 50);
      toDelete.forEach(([key]) => this.streamCache.delete(key));
    }
  }

  private async fetchWithRetry(
    relativePath: string,
    options: { signal?: AbortSignal } = {}
  ): Promise<Response> {
    const instances = await this.settings.getInstances();
    if (instances.length === 0) {
      throw new Error("No API instances configured.");
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (const baseUrl of instances) {
      const url = baseUrl.endsWith("/")
        ? `${baseUrl}${relativePath.substring(1)}`
        : `${baseUrl}${relativePath}`;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, { signal: options.signal });

          if (response.status === 429) {
            throw new Error(RATE_LIMIT_ERROR_MESSAGE);
          }

          if (response.ok) {
            return response;
          }

          if (response.status === 401) {
            let errorData:
              | { subStatus?: number; userMessage?: string }
              | undefined;
            try {
              errorData = await response.clone().json();
            } catch {}

            if (errorData?.subStatus === 11002) {
              lastError = new Error(
                errorData?.userMessage || "Authentication failed"
              );
              if (attempt < maxRetries) {
                await delay(200 * attempt);
                continue;
              }
            }
          }

          if (response.status >= 500 && attempt < maxRetries) {
            await delay(200 * attempt);
            continue;
          }

          lastError = new Error(
            `Request failed with status ${response.status}`
          );
          break;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            throw error;
          }

          lastError =
            error instanceof Error ? error : new Error("Unknown error");

          if (attempt < maxRetries) {
            await delay(200 * attempt);
          }
        }
      }
    }

    throw (
      lastError || new Error(`All API instances failed for: ${relativePath}`)
    );
  }

  private findSearchSection(
    source: unknown,
    key: string,
    visited: Set<unknown>
  ): { items: unknown[] } | undefined {
    if (!source || typeof source !== "object") return;

    if (Array.isArray(source)) {
      for (const e of source) {
        const f = this.findSearchSection(e, key, visited);
        if (f) return f;
      }
      return;
    }

    if (visited.has(source)) return;
    visited.add(source);

    const obj = source as Record<string, unknown>;

    if ("items" in obj && Array.isArray(obj.items))
      return obj as { items: unknown[] };

    if (key in obj) {
      const f = this.findSearchSection(obj[key], key, visited);
      if (f) return f;
    }

    for (const v of Object.values(obj)) {
      const f = this.findSearchSection(v, key, visited);
      if (f) return f;
    }
  }

  private buildSearchResponse<T>(section?: {
    items?: T[];
    limit?: number;
    offset?: number;
    totalNumberOfItems?: number;
  }): SearchResponse<T> {
    const items = section?.items ?? [];
    return {
      items,
      limit: section?.limit ?? items.length,
      offset: section?.offset ?? 0,
      totalNumberOfItems: section?.totalNumberOfItems ?? items.length,
    };
  }

  private normalizeSearchResponse<T>(
    data: unknown,
    key: string
  ): SearchResponse<T> {
    const section = this.findSearchSection(data, key, new Set());
    return this.buildSearchResponse<T>(section as { items?: T[] });
  }

  private prepareTrack(track: Track): Track {
    let normalized = track;

    if (
      !track.artist &&
      Array.isArray(track.artists) &&
      track.artists.length > 0
    ) {
      normalized = { ...track, artist: track.artists[0] };
    }

    const derivedQuality = deriveTrackQuality(normalized);
    if (derivedQuality && normalized.audioQuality !== derivedQuality) {
      normalized = { ...normalized, audioQuality: derivedQuality };
    }

    return normalized;
  }

  private prepareAlbum(album: Album): Album {
    if (
      !album.artist &&
      Array.isArray(album.artists) &&
      album.artists.length > 0
    ) {
      return { ...album, artist: album.artists[0] };
    }
    return album;
  }

  private preparePlaylist(playlist: Playlist): Playlist {
    return playlist;
  }

  private prepareArtist(artist: Artist): Artist {
    if (
      !artist.type &&
      Array.isArray(artist.artistTypes) &&
      artist.artistTypes.length > 0
    ) {
      return { ...artist, type: artist.artistTypes[0] };
    }
    return artist;
  }

  private parseTrackLookup(data: unknown): TrackLookup {
    const entries = Array.isArray(data) ? data : [data];
    let track: Track | undefined;
    let info: { manifest: string } | undefined;
    let originalTrackUrl: string | undefined;

    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue;

      const obj = entry as Record<string, unknown>;

      if (!track && "duration" in obj) {
        track = entry as Track;
        continue;
      }

      if (!info && "manifest" in obj) {
        info = entry as { manifest: string };
        continue;
      }

      if (!originalTrackUrl && "OriginalTrackUrl" in obj) {
        const candidate = obj.OriginalTrackUrl;
        if (typeof candidate === "string") {
          originalTrackUrl = candidate;
        }
      }
    }

    if (!track || !info) {
      throw new Error("Malformed track response");
    }

    return { track, info, originalTrackUrl };
  }

  private extractStreamUrlFromManifest(manifest: string): string | null {
    try {
      const decoded = atob(manifest);

      try {
        const parsed = JSON.parse(decoded);
        if (parsed?.urls?.[0]) {
          return parsed.urls[0];
        }
      } catch {
        const match = decoded.match(/https?:\/\/[\w\-.~:?#[@!$&'()*+,;=%/]+/);
        return match ? match[0] : null;
      }
    } catch (error) {
      console.error("Failed to decode manifest:", error);
      return null;
    }
    return null;
  }

  async searchTracks(
    query: string,
    options: { signal?: AbortSignal } = {}
  ): Promise<SearchResponse<Track>> {
    const cached = (await this.cache.get(
      "search_tracks",
      query
    )) as SearchResponse<Track> | null;
    if (cached) return cached;

    try {
      const response = await this.fetchWithRetry(
        `/search/?s=${encodeURIComponent(query)}`,
        options
      );
      const data = await response.json();
      const normalized = this.normalizeSearchResponse<Track>(data, "tracks");
      const result: SearchResponse<Track> = {
        ...normalized,
        items: normalized.items.map((t) => this.prepareTrack(t)),
      };

      await this.cache.set("search_tracks", query, result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      console.error("Track search failed:", error);
      return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
    }
  }

  async searchArtists(
    query: string,
    options: { signal?: AbortSignal } = {}
  ): Promise<SearchResponse<Artist>> {
    const cached = (await this.cache.get(
      "search_artists",
      query
    )) as SearchResponse<Artist> | null;
    if (cached) return cached;

    try {
      const response = await this.fetchWithRetry(
        `/search/?a=${encodeURIComponent(query)}`,
        options
      );
      const data = await response.json();
      const normalized = this.normalizeSearchResponse<Artist>(data, "artists");
      const result: SearchResponse<Artist> = {
        ...normalized,
        items: normalized.items.map((a) => this.prepareArtist(a)),
      };

      await this.cache.set("search_artists", query, result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      console.error("Artist search failed:", error);
      return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
    }
  }

  getCoverUrl(id: string | number, size: string = "1280"): string {
    if (!id) {
      return `https://picsum.photos/seed/${Math.random()}/${size}`;
    }

    const formattedId = String(id).replace(/-/g, "/");
    // Use Next.js API route to proxy images and avoid CORS
    return `/api/cover/${formattedId}/${size}x${size}.jpg`;
  }

  async clearCache(): Promise<void> {
    await this.cache.clear();
    this.streamCache.clear();
  }

  getCacheStats(): CacheStats {
    return {
      ...this.cache.getCacheStats(),
      streamUrls: this.streamCache.size,
    };
  }
}
