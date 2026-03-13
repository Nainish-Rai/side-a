import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

interface LibraryState {
  likedTracks: unknown[];
  savedAlbums: unknown[];
  recentlyPlayed: unknown[];
  playlists: unknown[];
}

interface PutPayload {
  deviceId: string;
  state: LibraryState;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidLibraryState(value: unknown): value is LibraryState {
  if (!isPlainObject(value)) return false;

  const keys = Object.keys(value);
  if (keys.length !== 4) return false;
  if (!keys.includes("likedTracks")) return false;
  if (!keys.includes("savedAlbums")) return false;
  if (!keys.includes("recentlyPlayed")) return false;
  if (!keys.includes("playlists")) return false;

  return (
    Array.isArray(value.likedTracks) &&
    Array.isArray(value.savedAlbums) &&
    Array.isArray(value.recentlyPlayed) &&
    Array.isArray(value.playlists)
  );
}

function parsePutPayload(value: unknown): PutPayload | null {
  if (!isPlainObject(value)) return null;

  const keys = Object.keys(value);
  if (keys.length !== 2) return null;
  if (!keys.includes("deviceId")) return null;
  if (!keys.includes("state")) return null;

  const { deviceId, state } = value;

  if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
    return null;
  }

  if (!isValidLibraryState(state)) {
    return null;
  }

  return {
    deviceId: deviceId.trim(),
    state,
  };
}

export async function GET(request: NextRequest) {
  const deviceId = request.nextUrl.searchParams.get("deviceId");

  if (!deviceId || deviceId.trim().length === 0) {
    return NextResponse.json(
      { error: "Query parameter 'deviceId' is required." },
      { status: 400 },
    );
  }

  const record = await prisma.deviceLibraryState.findUnique({
    where: { deviceId: deviceId.trim() },
    select: {
      deviceId: true,
      likedTracks: true,
      savedAlbums: true,
      recentlyPlayed: true,
      playlists: true,
      updatedAt: true,
    },
  });

  if (!record) {
    return NextResponse.json(
      { error: "Library state not found for this device." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      deviceId: record.deviceId,
      state: {
        likedTracks: record.likedTracks,
        savedAlbums: record.savedAlbums,
        recentlyPlayed: record.recentlyPlayed,
        playlists: record.playlists,
      },
      updatedAt: record.updatedAt,
    },
    { status: 200 },
  );
}

export async function PUT(request: NextRequest) {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const payload = parsePutPayload(json);
  if (!payload) {
    return NextResponse.json(
      {
        error:
          "Body must match { deviceId: string, state: { likedTracks: [], savedAlbums: [], recentlyPlayed: [], playlists: [] } }.",
      },
      { status: 400 },
    );
  }

  const saved = await prisma.deviceLibraryState.upsert({
    where: { deviceId: payload.deviceId },
    create: {
      deviceId: payload.deviceId,
      likedTracks: payload.state.likedTracks as Prisma.InputJsonValue,
      savedAlbums: payload.state.savedAlbums as Prisma.InputJsonValue,
      recentlyPlayed: payload.state.recentlyPlayed as Prisma.InputJsonValue,
      playlists: payload.state.playlists as Prisma.InputJsonValue,
    },
    update: {
      likedTracks: payload.state.likedTracks as Prisma.InputJsonValue,
      savedAlbums: payload.state.savedAlbums as Prisma.InputJsonValue,
      recentlyPlayed: payload.state.recentlyPlayed as Prisma.InputJsonValue,
      playlists: payload.state.playlists as Prisma.InputJsonValue,
    },
    select: {
      deviceId: true,
      likedTracks: true,
      savedAlbums: true,
      recentlyPlayed: true,
      playlists: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    {
      deviceId: saved.deviceId,
      state: {
        likedTracks: saved.likedTracks,
        savedAlbums: saved.savedAlbums,
        recentlyPlayed: saved.recentlyPlayed,
        playlists: saved.playlists,
      },
      updatedAt: saved.updatedAt,
    },
    { status: 200 },
  );
}
