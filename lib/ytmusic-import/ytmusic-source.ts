import YTMusic from "ytmusic-api";
import type { PlaylistFull, VideoDetailed } from "ytmusic-api";
import type {
  ImportedPlaylist,
  ImportedPlaylistTrack,
  PlaylistImportSource,
} from "@/lib/ytmusic-import/types";

class PlaylistUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlaylistUnavailableError";
  }
}

let ytmusicClientPromise: Promise<YTMusic> | null = null;

function getLargestThumbnailUrl(
  thumbnails: { url: string; width: number; height: number }[],
): string | null {
  const largestThumbnail = [...thumbnails].sort(
    (left, right) => right.width * right.height - left.width * left.height,
  )[0];

  return largestThumbnail?.url ?? null;
}

function mapPlaylistTrack(video: VideoDetailed): ImportedPlaylistTrack {
  return {
    sourceId: video.videoId,
    title: video.name,
    artistName: video.artist.name,
    albumName: null,
    durationSeconds: video.duration,
    thumbnailUrl: getLargestThumbnailUrl(video.thumbnails),
  };
}

async function getYtMusicClient(): Promise<YTMusic> {
  if (!ytmusicClientPromise) {
    ytmusicClientPromise = (async () => {
      const client = new YTMusic();
      const initializedClient = await client.initialize();

      if (!initializedClient) {
        throw new Error("Failed to initialize YTMusic client.");
      }

      return client;
    })();
  }

  return ytmusicClientPromise;
}

async function fetchPlaylistMetadata(
  client: YTMusic,
  playlistId: string,
): Promise<PlaylistFull> {
  try {
    return await client.getPlaylist(playlistId);
  } catch (error) {
    throw new PlaylistUnavailableError(
      error instanceof Error ? error.message : "Failed to load playlist metadata.",
    );
  }
}

async function fetchPlaylistTracks(
  client: YTMusic,
  playlistId: string,
): Promise<ImportedPlaylistTrack[]> {
  try {
    const videos = await client.getPlaylistVideos(playlistId);
    return videos.map(mapPlaylistTrack);
  } catch (error) {
    throw new PlaylistUnavailableError(
      error instanceof Error ? error.message : "Failed to load playlist tracks.",
    );
  }
}

export class YtMusicPublicPlaylistSource implements PlaylistImportSource {
  async importPlaylist(playlistId: string): Promise<ImportedPlaylist> {
    const client = await getYtMusicClient();
    const [playlist, tracks] = await Promise.all([
      fetchPlaylistMetadata(client, playlistId),
      fetchPlaylistTracks(client, playlistId),
    ]);

    if (tracks.length === 0) {
      throw new PlaylistUnavailableError("Playlist is empty or unavailable.");
    }

    return {
      sourceId: playlist.playlistId,
      title: playlist.name,
      creatorName: playlist.artist.name,
      thumbnailUrl: getLargestThumbnailUrl(playlist.thumbnails),
      trackCount: playlist.videoCount,
      tracks,
    };
  }
}

export { PlaylistUnavailableError };
