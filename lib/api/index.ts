import { LosslessAPI } from "@/lib/api/client";
import { QobuzAPI } from "@/lib/api/qobuz-client";
import { getLiveInstances } from "@/lib/api/discovery";
import { fetchLyricsMultiSource } from "@/lib/api/lyrics";
import type {
  APISettings,
  SearchResponse,
  Track,
  Album,
  Artist,
  Playlist,
  CacheStats,
  LyricsData,
  Provider,
} from "./types";

const settings: APISettings = {
  getInstances: getLiveInstances,
};

export const api = new LosslessAPI(settings);

type TrackId = string | number;

function parseTrackId(id: TrackId): { provider: Provider; id: number } {
  const idStr = String(id);
  if (idStr.startsWith("q:")) {
    return { provider: "qobuz", id: parseInt(idStr.slice(2), 10) };
  }
  const cleanId = idStr.startsWith("t:") ? idStr.slice(2) : idStr;
  return { provider: "tidal", id: parseInt(cleanId, 10) };
}



export class MusicAPI {
  private tidal: LosslessAPI;
  private qobuz: QobuzAPI;

  constructor() {
    this.tidal = new LosslessAPI({
      getInstances: getLiveInstances,
    });
    this.qobuz = new QobuzAPI();
  }

  async getTrack(
    id: TrackId,
    quality?: string
  ): Promise<Track | null> {
    const { provider, id: numericId } = parseTrackId(id);

    if (provider === "qobuz") {
      throw new Error("Qobuz track streaming not yet implemented");
    }

    const streamUrl = await this.tidal.getStreamUrl(numericId, quality);
    if (!streamUrl) return null;

    return {
      id: numericId,
      title: "",
      duration: 0,
    };
  }

  async searchTracks(
    query: string,
    options?: { signal?: AbortSignal; offset?: number; limit?: number; provider?: Provider }
  ): Promise<SearchResponse<Track>> {
    const { provider, ...rest } = options || {};
    if (provider === "qobuz") {
      return this.qobuz.searchTracks(query, rest);
    }
    return this.tidal.searchTracks(query, rest || {});
  }

  async getAlbum(
    id: TrackId,
    options?: { signal?: AbortSignal }
  ): Promise<{ album: Album; tracks: Track[] }> {
    const { provider, id: numericId } = parseTrackId(id);

    if (provider === "qobuz") {
      return this.qobuz.getAlbum(numericId, options);
    }

    return this.tidal.getAlbum(numericId, options);
  }

  async getStreamUrl(
    trackId: TrackId,
    quality: string = "LOSSLESS"
  ): Promise<string | null> {
    const { provider, id: numericId } = parseTrackId(trackId);

    if (provider === "qobuz") {
      throw new Error("Qobuz streaming not yet implemented");
    }

    return this.tidal.getStreamUrl(numericId, quality);
  }

  async fetchLyrics(
    track: Track,
    options?: { signal?: AbortSignal }
  ): Promise<LyricsData | null> {
    return fetchLyricsMultiSource(track, options);
  }

  async searchAlbums(
    query: string,
    options?: { signal?: AbortSignal; offset?: number; limit?: number; provider?: Provider }
  ): Promise<SearchResponse<Album>> {
    const { provider, ...rest } = options || {};
    if (provider === "qobuz") {
      return this.qobuz.searchAlbums(query, rest);
    }
    return this.tidal.searchAlbums(query, rest || {});
  }

  async searchArtists(
    query: string,
    options?: { signal?: AbortSignal; offset?: number; limit?: number; provider?: Provider }
  ): Promise<SearchResponse<Artist>> {
    const { provider, ...rest } = options || {};
    if (provider === "qobuz") {
      return this.qobuz.searchArtists(query, rest);
    }
    return this.tidal.searchArtists(query, rest || {});
  }

  async searchPlaylists(
    query: string,
    options?: { signal?: AbortSignal; offset?: number; limit?: number }
  ): Promise<SearchResponse<Playlist>> {
    return this.tidal.searchPlaylists(query, options || {});
  }

  getCoverUrl(id: string | number, size?: string, provider: Provider = "tidal"): string {
    if (provider === "qobuz") {
      return this.qobuz.getCoverUrl(id, size ? parseInt(size) : 1280);
    }
    return this.tidal.getCoverUrl(id, size);
  }

  async clearCache(): Promise<void> {
    await Promise.all([
      this.tidal.clearCache(),
      this.qobuz.clearCache(),
    ]);
  }

  destroy(): void {
    this.tidal.destroy();
    this.qobuz.destroy();
  }

  getCacheStats(): CacheStats {
    const tidalStats = this.tidal.getCacheStats();
    const qobuzStats = this.qobuz.getCacheStats();
    return {
      total: tidalStats.total + qobuzStats.total,
      byType: { ...tidalStats.byType, ...qobuzStats.byType },
      streamUrls: tidalStats.streamUrls,
    };
  }
}

export const musicApi = new MusicAPI();

export { LosslessAPI, QobuzAPI, getLiveInstances, fetchLyricsMultiSource };
export type {
  APISettings,
  SearchResponse,
  Track,
  Album,
  Artist,
  Playlist,
  TrackLookup,
  CacheStats,
  LyricsData,
  Provider,
  UnifiedTrack,
  TrackId,
} from "./types";