import { api } from "@/lib/api";
import { ArtistClient } from "./ArtistClient";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import type { Album, Artist, Track } from "@/lib/api/types";
import { cache } from "react";

interface ArtistPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ name?: string }>;
}

interface ArtistPageData {
  artist: Artist;
  topTracks: Track[];
  discography: Album[];
}

const normalizeText = (value?: string | null): string =>
  (value || "").trim().toLowerCase();

const dedupeById = <T extends { id: number }>(items: T[]): T[] => {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
};

const hasArtistIdMatch = (
  trackOrAlbum: Track | Album,
  artistId: number,
): boolean => {
  if (trackOrAlbum.artist?.id === artistId) {
    return true;
  }

  if (
    Array.isArray(trackOrAlbum.artists) &&
    trackOrAlbum.artists.some((artist) => artist?.id === artistId)
  ) {
    return true;
  }

  return false;
};

const hasArtistNameMatch = (
  trackOrAlbum: Track | Album,
  normalizedArtistName: string,
): boolean => {
  if (!normalizedArtistName) {
    return false;
  }

  if (normalizeText(trackOrAlbum.artist?.name) === normalizedArtistName) {
    return true;
  }

  if (
    Array.isArray(trackOrAlbum.artists) &&
    trackOrAlbum.artists.some(
      (artist) => normalizeText(artist?.name) === normalizedArtistName,
    )
  ) {
    return true;
  }

  return false;
};

const resolveArtistPageData = cache(async (
  artistId: number,
  artistNameHint?: string,
): Promise<ArtistPageData | null> => {
  const normalizedHint = normalizeText(artistNameHint);

  const searchQueries = Array.from(
    new Set([artistNameHint?.trim(), String(artistId)].filter(Boolean)),
  ) as string[];

  let artist: Artist | null = null;

  for (const query of searchQueries) {
    const { items } = await api.searchArtists(query, { offset: 0, limit: 50 });

    const matchById = items.find((item) => item?.id === artistId);
    if (matchById) {
      artist = matchById;
      break;
    }

    if (normalizedHint) {
      const matchByName = items.find(
        (item) => normalizeText(item?.name) === normalizedHint,
      );

      if (matchByName) {
        artist = { ...matchByName, id: matchByName.id || artistId };
      }
    }
  }

  if (!artist && normalizedHint) {
    artist = {
      id: artistId,
      name: artistNameHint?.trim() || "Unknown Artist",
      type: "ARTIST",
    };
  }

  if (!artist) {
    return null;
  }

  const canonicalArtistName = artist.name || artistNameHint || "";
  const normalizedArtistName = normalizeText(canonicalArtistName);

  if (!normalizedArtistName) {
    return { artist, topTracks: [], discography: [] };
  }

  const [trackSearch, albumSearch] = await Promise.all([
    api.searchTracks(canonicalArtistName, { offset: 0, limit: 100 }),
    api.searchAlbums(canonicalArtistName, { offset: 0, limit: 100 }),
  ]);

  const topTracks = dedupeById(
    trackSearch.items.filter(
      (track) =>
        hasArtistIdMatch(track, artistId) ||
        hasArtistNameMatch(track, normalizedArtistName),
    ),
  )
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 20);

  const discography = dedupeById(
    albumSearch.items.filter(
      (album) =>
        hasArtistIdMatch(album, artistId) ||
        hasArtistNameMatch(album, normalizedArtistName),
    ),
  ).sort((a, b) => {
    const yearA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
    const yearB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
    return yearB - yearA;
  });

  return {
    artist,
    topTracks,
    discography,
  };
});

export default async function ArtistPage({
  params,
  searchParams,
}: ArtistPageProps) {
  const { id } = await params;
  const parsedId = Number.parseInt(id, 10);

  if (!Number.isFinite(parsedId)) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  let data: ArtistPageData | null;

  try {
    data = await resolveArtistPageData(
      parsedId,
      resolvedSearchParams?.name,
    );
  } catch (error) {
    console.error("Failed to load artist page:", error);
    notFound();
  }

  if (!data) {
    notFound();
  }

  return (
    <ArtistClient
      artist={data.artist}
      topTracks={data.topTracks}
      discography={data.discography}
    />
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: ArtistPageProps): Promise<Metadata> {
  const { id } = await params;
  const parsedId = Number.parseInt(id, 10);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (!Number.isFinite(parsedId)) {
    return { title: "Artist Not Found" };
  }

  try {
    const data = await resolveArtistPageData(parsedId, resolvedSearchParams?.name);

    if (!data?.artist?.name) {
      return { title: "Artist Not Found" };
    }

    return {
      title: `${data.artist.name} - Artist`,
      description: `Listen to top tracks and discography by ${data.artist.name}`,
    };
  } catch {
    return {
      title: "Artist Not Found",
    };
  }
}
