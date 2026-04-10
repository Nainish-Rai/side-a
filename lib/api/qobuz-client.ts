import { APICache } from "./cache";
import { createTimeoutSignal, delay } from "./utils";
import type { Track, Album, Artist, SearchResponse, CacheStats } from "./types";

const QOBUZ_API_BASE = "https://www.qobuz.com/api.json/0.2";

interface QobuzTrack {
  id: number;
  title: string;
  duration: number;
  track_number?: number;
  version?: string;
  explicit?: boolean;
  hires?: boolean;
  maximum_bit_depth?: number;
  album?: {
    id: number;
    title: string;
    image?: { large?: string; small?: string };
    artist?: { id: number; name: string };
  };
  performer?: {
    id: number;
    name: string;
    image?: { large?: string; small?: string };
  };
  composer?: { id: number; name: string };
}

interface QobuzAlbum {
  id: number;
  title: string;
  tracks_count?: number;
  release_date_original?: string;
  image?: { large?: string; small?: string };
  artist?: {
    id: number;
    name: string;
    image?: { large?: string };
  };
  performers?: string;
}

interface QobuzArtist {
  id: number;
  name: string;
  image?: { large?: string; small?: string };
  albums_count?: number;
  slug?: string;
}

interface QobuzSearchResponse<T> {
  items: T[];
  total?: number;
}

interface QobuzAlbumResponse {
  id: number;
  title: string;
  release_date_original?: string;
  tracks_count?: number;
  image?: { large?: string; small?: string };
  artist?: { id: number; name: string; image?: { large?: string } };
  tracks?: {
    items: QobuzTrack[];
  };
  performers?: string;
}

interface QobuzArtistResponse {
  id: number;
  name: string;
  image?: { large?: string; small?: string };
  albums?: {
    items: QobuzAlbum[];
  };
}

export interface QobuzProfile {
  id: number;
  name: string;
  image?: string;
}

export class QobuzAPI {
  private cache: APICache;
  private appId: string;
  private appSecret?: string;
  private userAuthToken?: string;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private static readonly DEFAULT_TIMEOUT_MS = 6_000;

  constructor(options: {
    appId?: string;
    appSecret?: string;
    userAuthToken?: string;
  } = {}) {
    this.appId = options.appId || process.env.QOBUZ_APP_ID || "";
    this.appSecret = options.appSecret || process.env.QOBUZ_APP_SECRET;
    this.userAuthToken = options.userAuthToken;
    this.cache = new APICache({
      maxSize: 200,
      ttl: 1000 * 60 * 30,
    });

    this.cleanupInterval = setInterval(() => {
      this.cache.clearExpired();
    }, 1000 * 60 * 5);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private async fetchWithRetry(
    endpoint: string,
    params: Record<string, string> = {},
    options: { signal?: AbortSignal } = {}
  ): Promise<Response> {
    const url = new URL(`${QOBUZ_API_BASE}${endpoint}`);
    
    if (this.appId) {
      url.searchParams.set("app_id", this.appId);
    }
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const { signal, cleanup } = createTimeoutSignal(
        QobuzAPI.DEFAULT_TIMEOUT_MS,
        options.signal
      );
      try {
        const headers: Record<string, string> = {};
        if (this.userAuthToken) {
          headers["x-user-auth-token"] = this.userAuthToken;
        }

        const response = await fetch(url.toString(), {
          signal,
          headers,
          cache: "no-store",
        });

        if (response.ok) {
          return response;
        }

        if (response.status === 429) {
          throw new Error("Rate limited");
        }

        if (response.status === 401) {
          throw new Error("Authentication failed");
        }

        if (response.status >= 500) {
          lastError = new Error(`Server error: ${response.status}`);
          if (attempt < maxRetries) {
            await delay(200 * attempt);
            continue;
          }
          break;
        }

        lastError = new Error(`Request failed: ${response.status}`);
        break;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (attempt < maxRetries) {
          await delay(200 * attempt);
        }
      } finally {
        cleanup();
      }
    }

    throw lastError || new Error(`Failed to fetch: ${endpoint}`);
  }

  private normalizeQobuzTrack(qobuzTrack: QobuzTrack): Track {
    const artist = qobuzTrack.performer
      ? {
          id: qobuzTrack.performer.id,
          name: qobuzTrack.performer.name,
          picture: qobuzTrack.performer.image?.large,
        }
      : undefined;

    const album = qobuzTrack.album
      ? {
          id: qobuzTrack.album.id,
          title: qobuzTrack.album.title,
          artist: qobuzTrack.album.artist
            ? {
                id: qobuzTrack.album.artist.id,
                name: qobuzTrack.album.artist.name,
              }
            : undefined,
        }
      : undefined;

    return {
      id: qobuzTrack.id,
      title: qobuzTrack.title,
      duration: qobuzTrack.duration || 0,
      trackNumber: qobuzTrack.track_number,
      version: qobuzTrack.version,
      explicit: qobuzTrack.explicit,
      audioQuality: qobuzTrack.hires ? "HI_RES_LOSSLESS" : "LOSSLESS",
      artist,
      artists: artist ? [artist] : undefined,
      album,
    };
  }

  private normalizeQobuzAlbum(qobuzAlbum: QobuzAlbum): Album {
    const artist = qobuzAlbum.artist
      ? {
          id: qobuzAlbum.artist.id,
          name: qobuzAlbum.artist.name,
          picture: qobuzAlbum.artist.image?.large,
        }
      : undefined;

    return {
      id: qobuzAlbum.id,
      title: qobuzAlbum.title,
      numberOfTracks: qobuzAlbum.tracks_count,
      releaseDate: qobuzAlbum.release_date_original,
      artist,
      artists: artist ? [artist] : undefined,
      cover: qobuzAlbum.image?.large,
    };
  }

  private normalizeQobuzArtist(qobuzArtist: QobuzArtist): Artist {
    return {
      id: qobuzArtist.id,
      name: qobuzArtist.name,
      picture: qobuzArtist.image?.large,
    };
  }

  async searchTracks(
    query: string,
    options: { signal?: AbortSignal; offset?: number; limit?: number } = {}
  ): Promise<SearchResponse<Track>> {
    const { offset = 0, limit = 25 } = options;
    const cacheKey = `${query}_${offset}_${limit}`;
    const cached = (await this.cache.get(
      "search_tracks",
      cacheKey
    )) as SearchResponse<Track> | null;
    if (cached) return cached;

    try {
      const response = await this.fetchWithRetry(
        "/track/search",
        {
          query,
          offset: offset.toString(),
          limit: limit.toString(),
        },
        options
      );

      const data: QobuzSearchResponse<QobuzTrack> = await response.json();

      const tracks = (data.items || []).map((t) => this.normalizeQobuzTrack(t));

      const result: SearchResponse<Track> = {
        items: tracks,
        limit,
        offset,
        totalNumberOfItems: data.total || tracks.length,
      };

      await this.cache.set("search_tracks", cacheKey, result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      console.error("Qobuz track search failed:", error);
      return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
    }
  }

  async searchAlbums(
    query: string,
    options: { signal?: AbortSignal; offset?: number; limit?: number } = {}
  ): Promise<SearchResponse<Album>> {
    const { offset = 0, limit = 25 } = options;
    const cacheKey = `${query}_${offset}_${limit}`;
    const cached = (await this.cache.get(
      "search_albums",
      cacheKey
    )) as SearchResponse<Album> | null;
    if (cached) return cached;

    try {
      const response = await this.fetchWithRetry(
        "/album/search",
        {
          query,
          offset: offset.toString(),
          limit: limit.toString(),
        },
        options
      );

      const data: QobuzSearchResponse<QobuzAlbum> = await response.json();

      const albums = (data.items || []).map((a) =>
        this.normalizeQobuzAlbum(a)
      );

      const result: SearchResponse<Album> = {
        items: albums,
        limit,
        offset,
        totalNumberOfItems: data.total || albums.length,
      };

      await this.cache.set("search_albums", cacheKey, result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      console.error("Qobuz album search failed:", error);
      return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
    }
  }

  async searchArtists(
    query: string,
    options: { signal?: AbortSignal; offset?: number; limit?: number } = {}
  ): Promise<SearchResponse<Artist>> {
    const { offset = 0, limit = 25 } = options;
    const cacheKey = `${query}_${offset}_${limit}`;
    const cached = (await this.cache.get(
      "search_artists",
      cacheKey
    )) as SearchResponse<Artist> | null;
    if (cached) return cached;

    try {
      const response = await this.fetchWithRetry(
        "/artist/search",
        {
          query,
          offset: offset.toString(),
          limit: limit.toString(),
        },
        options
      );

      const data: QobuzSearchResponse<QobuzArtist> = await response.json();

      const artists = (data.items || []).map((a) =>
        this.normalizeQobuzArtist(a)
      );

      const result: SearchResponse<Artist> = {
        items: artists,
        limit,
        offset,
        totalNumberOfItems: data.total || artists.length,
      };

      await this.cache.set("search_artists", cacheKey, result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      console.error("Qobuz artist search failed:", error);
      return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
    }
  }

  async getAlbum(
    albumId: number,
    options: { signal?: AbortSignal } = {}
  ): Promise<{ album: Album; tracks: Track[] }> {
    const cacheKey = `album_${albumId}`;
    const cached = (await this.cache.get("album", cacheKey)) as {
      album: Album;
      tracks: Track[];
    } | null;
    if (cached) return cached;

    try {
      const response = await this.fetchWithRetry(
        "/album/get",
        {
          album_id: albumId.toString(),
        },
        options
      );

      const data: QobuzAlbumResponse = await response.json();

      const album: Album = {
        id: data.id,
        title: data.title,
        numberOfTracks: data.tracks_count,
        releaseDate: data.release_date_original,
        artist: data.artist
          ? {
              id: data.artist.id,
              name: data.artist.name,
              picture: data.artist.image?.large,
            }
          : undefined,
        cover: data.image?.large,
      };

      const tracks = (data.tracks?.items || []).map((t) =>
        this.normalizeQobuzTrack(t)
      );

      const result = { album, tracks };
      await this.cache.set("album", cacheKey, result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      console.error("Qobuz album fetch failed:", error);
      throw error;
    }
  }

  async getArtist(
    artistId: number,
    options: { signal?: AbortSignal } = {}
  ): Promise<{
    artist: Artist;
    albums: Album[];
  }> {
    const cacheKey = `artist_${artistId}`;
    const cached = (await this.cache.get("artist", cacheKey)) as {
      artist: Artist;
      albums: Album[];
    } | null;
    if (cached) return cached;

    try {
      const response = await this.fetchWithRetry(
        "/artist/get",
        {
          artist_id: artistId.toString(),
        },
        options
      );

      const data: QobuzArtistResponse = await response.json();

      const artist: Artist = {
        id: data.id,
        name: data.name,
        picture: data.image?.large,
      };

      const albums = (data.albums?.items || []).map((a) =>
        this.normalizeQobuzAlbum(a)
      );

      const result = { artist, albums };
      await this.cache.set("artist", cacheKey, result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      console.error("Qobuz artist fetch failed:", error);
      throw error;
    }
  }

  getCoverUrl(coverId: string | number, size: number = 500): string {
    if (!coverId) {
      return `https://picsum.photos/seed/${Math.random()}/${size}`;
    }

    if (typeof coverId === "string" && coverId.startsWith("http")) {
      return coverId.replace(/_\d+\./, `_${size}.`);
    }

    return `https://static.qobuz.com/images/covers/${coverId}/${coverId}_${size}.jpg`;
  }

  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  getCacheStats(): CacheStats {
    return this.cache.getCacheStats();
  }
}
