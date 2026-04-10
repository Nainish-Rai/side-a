import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSpotifyAccountForUser } from "@/lib/spotify-import/account";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { authenticated: false, linked: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const spotifyAccount = await getSpotifyAccountForUser(session.user.id);

  return NextResponse.json(
    {
      authenticated: true,
      linked: Boolean(spotifyAccount),
      providerId: spotifyAccount?.providerId ?? null,
      scopes: spotifyAccount?.scope?.split(",").filter(Boolean) ?? [],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
