import type {
  Details as SpotifyUrlInfoDetails,
  SpotifyUrlInfo,
  SpotifyUrlInfoModule,
  Track as SpotifyUrlInfoTrack,
} from "spotify-url-info";
import { parse as parseSpotifyUri } from "spotify-uri";
import type { ImportedPlaylist, ImportedPlaylistTrack, PlaylistImportSource } from "@/lib/playlist-import/types";

let spotifyInfoPromise: Promise<SpotifyUrlInfo> | null = null;

async function getSpotifyInfo(): Promise<SpotifyUrlInfo> {
  if (!spotifyInfoPromise) {
    spotifyInfoPromise = import("spotify-url-info").then((module) => {
      const spotifyUrlInfoModule = module as unknown as SpotifyUrlInfoModule;
      return spotifyUrlInfoModule(fetch);
    });
  }

  return spotifyInfoPromise;
}

export class SpotifyPlaylistUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyPlaylistUnavailableError";
  }
}

function mapSpotifyTrack(track: SpotifyUrlInfoTrack): ImportedPlaylistTrack {
  const parsedTrackUri = parseSpotifyUri(track.uri);

  return {
    sourceId: parsedTrackUri.id,
    title: track.name,
    artistName: track.artist,
    albumName: null,
    durationSeconds: typeof track.duration === "number" ? track.duration : null,
    thumbnailUrl: null,
    isrc: null,
  };
}

export class SpotifyPublicPlaylistSource implements PlaylistImportSource {
  async importPlaylist(url: string): Promise<ImportedPlaylist> {
    try {
      const spotifyInfo = await getSpotifyInfo();
      const details: SpotifyUrlInfoDetails = await spotifyInfo.getDetails(url);
      const parsedPlaylistUri = parseSpotifyUri(url);
      const tracks = details.tracks
        .map((track: SpotifyUrlInfoTrack) => mapSpotifyTrack(track))
        .filter((track) => track.title && track.artistName);

      if (tracks.length === 0) {
        throw new SpotifyPlaylistUnavailableError("Spotify playlist is empty or unavailable.");
      }

      return {
        sourceId: parsedPlaylistUri.id,
        title: details.preview.title,
        creatorName: details.preview.artist || "Spotify",
        thumbnailUrl: details.preview.image ?? null,
        trackCount: tracks.length,
        tracks,
      };
    } catch (error) {
      if (error instanceof SpotifyPlaylistUnavailableError) {
        throw error;
      }

      throw new SpotifyPlaylistUnavailableError(
        error instanceof Error ? error.message : "Failed to load Spotify playlist.",
      );
    }
  }
}
