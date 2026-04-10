import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listSpotifyImportablePlaylistsForUser } from "@/lib/spotify-import/auth-source";
import {
  SpotifyAccountNotLinkedError,
  SpotifyAuthenticationError,
} from "@/lib/spotify-import/account";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Sign in to import from Spotify." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const playlists = await listSpotifyImportablePlaylistsForUser(session.user.id);
    return NextResponse.json(
      { playlists },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof SpotifyAccountNotLinkedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (error instanceof SpotifyAuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load Spotify playlists." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
