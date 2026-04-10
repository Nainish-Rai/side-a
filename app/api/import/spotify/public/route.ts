import { NextRequest } from "next/server";
import { MusicBrainzEnricher } from "@/lib/playlist-import/musicbrainz-enricher";
import {
  createImportStreamResponse,
  createJsonErrorResponse,
  isUrlImportRequestBody,
  parseJsonRequestBody,
} from "@/lib/playlist-import/http";
import { TidalPlayableTrackSearch } from "@/lib/playlist-import/playable-track-search";
import type { PlaylistImportStreamEvent } from "@/lib/playlist-import/types";
import { ImportPlaylistUseCase } from "@/lib/playlist-import/use-case";
import { SpotifyPublicPlaylistSource } from "@/lib/spotify-import/public-source";
import { InvalidSpotifyPlaylistUrlError, normalizeSpotifyPlaylistUrl } from "@/lib/spotify-import/url";

export const runtime = "nodejs";

function createImportUseCase(): ImportPlaylistUseCase {
  return new ImportPlaylistUseCase(
    new SpotifyPublicPlaylistSource(),
    new TidalPlayableTrackSearch(),
    new MusicBrainzEnricher(),
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonRequestBody(request);
    if (!isUrlImportRequestBody(body)) {
      throw new InvalidSpotifyPlaylistUrlError("Body must match { url: string }.");
    }

    const normalizedUrl = normalizeSpotifyPlaylistUrl(body.url);
    const useCase = createImportUseCase();

    return createImportStreamResponse(async (pushEvent) => {
      const result = await useCase.execute(normalizedUrl, {
        onPlaylistImported: ({ playlist }) => {
          pushEvent({
            type: "playlist",
            playlist,
          });
        },
        onTrackStarted: (payload) => {
          pushEvent({
            type: "track-started",
            payload,
          });
        },
        onTrackCompleted: (payload) => {
          pushEvent({
            type: "track-completed",
            payload,
          });
        },
      });

      if (result.matchedTracks.length === 0) {
        pushEvent({
          type: "error",
          message: "No playable tracks were matched for this playlist.",
        });
        return;
      }

      pushEvent({
        type: "complete",
        result,
      } satisfies PlaylistImportStreamEvent);
    });
  } catch (error) {
    if (error instanceof InvalidSpotifyPlaylistUrlError) {
      return createJsonErrorResponse(error, 400);
    }

    return createJsonErrorResponse(error, 502);
  }
}
