import { api } from "@/lib/api";
import { AlbumClient } from "./AlbumClient";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

const getAlbumPageData = cache(async (albumId: number) => api.getAlbum(albumId));

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params;
  const albumId = parseInt(id);
  let pageData: Awaited<ReturnType<typeof getAlbumPageData>> | null = null;

  try {
    pageData = await getAlbumPageData(albumId);
  } catch (error) {
    console.error("Failed to load album:", error);
    notFound();
  }

  if (!pageData?.album) {
    notFound();
  }

  return <AlbumClient album={pageData.album} tracks={pageData.tracks} />;
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { id } = await params;
  const albumId = parseInt(id);

  try {
    const { album } = await getAlbumPageData(albumId);
    const artistName =
      album.artist?.name || album.artists?.[0]?.name || "Unknown Artist";

    return {
      title: `${album.title} - ${artistName}`,
      description: `Listen to ${album.title} by ${artistName}`,
    };
  } catch {
    return {
      title: "Album Not Found",
    };
  }
}
