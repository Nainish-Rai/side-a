import { NextRequest, NextResponse } from "next/server";
import { TidalPlayableTrackSearch } from "@/lib/ytmusic-import/playable-track-search";
import { MusicBrainzEnricher } from "@/lib/ytmusic-import/musicbrainz-enricher";
import type { PlaylistImportStreamEvent } from "@/lib/ytmusic-import/types";
import { extractYtMusicPlaylistId, InvalidPlaylistUrlError } from "@/lib/ytmusic-import/url";
import { ImportPublicYtMusicPlaylist } from "@/lib/ytmusic-import/use-case";
import { PlaylistUnavailableError, YtMusicPublicPlaylistSource } from "@/lib/ytmusic-import/ytmusic-source";

export const runtime = "nodejs";

interface ImportRequestBody {
  url: string;
}

function isImportRequestBody(value: unknown): value is ImportRequestBody {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return typeof candidate.url === "string";
}

async function parseRequestBody(request: NextRequest): Promise<ImportRequestBody> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new InvalidPlaylistUrlError("Request body must be valid JSON.");
  }

  if (!isImportRequestBody(body)) {
    throw new InvalidPlaylistUrlError("Body must match { url: string }.");
  }

  return body;
}

function createImportUseCase(): ImportPublicYtMusicPlaylist {
  return new ImportPublicYtMusicPlaylist(
    new YtMusicPublicPlaylistSource(),
    new TidalPlayableTrackSearch(),
    new MusicBrainzEnricher(),
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request);
    const playlistId = extractYtMusicPlaylistId(body.url);
    const useCase = createImportUseCase();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const pushEvent = (event: PlaylistImportStreamEvent) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        try {
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
            controller.close();
            return;
          }

          pushEvent({
            type: "complete",
            result,
          });
          controller.close();
        } catch (error) {
          pushEvent({
            type: "error",
            message:
              error instanceof Error ? error.message : "Import failed.",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/x-ndjson; charset=utf-8",
      },
    });
  } catch (error) {
    if (error instanceof InvalidPlaylistUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed." },
      {
        status:
          error instanceof PlaylistUnavailableError
            ? 404
            : 502,
      },
    );
  }
}
