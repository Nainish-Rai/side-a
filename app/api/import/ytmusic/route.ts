import { NextRequest, NextResponse } from "next/server";
import { TidalPlayableTrackSearch } from "@/lib/ytmusic-import/playable-track-search";
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
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request);
    const playlistId = extractYtMusicPlaylistId(body.url);
    const result = await createImportUseCase().execute(playlistId);

    if (result.matchedTracks.length === 0) {
      return NextResponse.json(
        { error: "No playable tracks were matched for this playlist.", result },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof InvalidPlaylistUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof PlaylistUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed." },
      { status: 502 },
    );
  }
}
