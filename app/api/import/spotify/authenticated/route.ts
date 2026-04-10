import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { MusicBrainzEnricher } from "@/lib/playlist-import/musicbrainz-enricher";
import {
  createImportStreamResponse,
  createJsonErrorResponse,
  isPlaylistIdImportRequestBody,
  parseJsonRequestBody,
} from "@/lib/playlist-import/http";
import { TidalPlayableTrackSearch } from "@/lib/playlist-import/playable-track-search";
import type { PlaylistImportStreamEvent } from "@/lib/playlist-import/types";
import { ImportPlaylistUseCase } from "@/lib/playlist-import/use-case";
import {
  SpotifyAuthorizedPlaylistSource,
  SpotifyPlaylistUnavailableError,
} from "@/lib/spotify-import/auth-source";
import {
  SpotifyAccountNotLinkedError,
  SpotifyAuthenticationError,
} from "@/lib/spotify-import/account";

export const runtime = "nodejs";

function createImportUseCase(userId: string): ImportPlaylistUseCase {
  return new ImportPlaylistUseCase(
    new SpotifyAuthorizedPlaylistSource(userId),
    new TidalPlayableTrackSearch(),
    new MusicBrainzEnricher(),
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return createJsonErrorResponse(new Error("Sign in to import from Spotify."), 401);
    }

    const body = await parseJsonRequestBody(request);
    if (!isPlaylistIdImportRequestBody(body)) {
      return createJsonErrorResponse(new Error("Body must match { playlistId: string }."), 400);
    }

    const playlistId = body.playlistId.trim();
    if (!playlistId) {
      return createJsonErrorResponse(new Error("Playlist ID is required."), 400);
    }

    const useCase = createImportUseCase(session.user.id);

    return createImportStreamResponse(async (pushEvent) => {
      const result = await useCase.execute(playlistId, {
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
    if (error instanceof SpotifyAccountNotLinkedError) {
      return createJsonErrorResponse(error, 403);
    }

    if (error instanceof SpotifyAuthenticationError) {
      return createJsonErrorResponse(error, 401);
    }

    if (error instanceof SpotifyPlaylistUnavailableError) {
      return createJsonErrorResponse(error, 404);
    }

    return createJsonErrorResponse(error, 502);
  }
}
