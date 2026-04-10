import { NextRequest, NextResponse } from "next/server";
import type { PlaylistImportStreamEvent } from "@/lib/playlist-import/types";

export interface UrlImportRequestBody {
  url: string;
}

export interface PlaylistIdImportRequestBody {
  playlistId: string;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isUrlImportRequestBody(value: unknown): value is UrlImportRequestBody {
  return isObjectRecord(value) && typeof value.url === "string";
}

export function isPlaylistIdImportRequestBody(value: unknown): value is PlaylistIdImportRequestBody {
  return isObjectRecord(value) && typeof value.playlistId === "string";
}

export async function parseJsonRequestBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

export function createImportStreamResponse(
  execute: (pushEvent: (event: PlaylistImportStreamEvent) => void) => Promise<void>,
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const pushEvent = (event: PlaylistImportStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        await execute(pushEvent);
      } catch (error) {
        pushEvent({
          type: "error",
          message: error instanceof Error ? error.message : "Import failed.",
        });
      } finally {
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
}

export function createJsonErrorResponse(error: unknown, status: number): NextResponse {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Import failed." },
    { status },
  );
}
