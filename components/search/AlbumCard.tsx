"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Album } from "@/lib/api/types";

interface AlbumCardProps {
  album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  const coverUrl = album.cover
    ? `https://resources.tidal.com/images/${album.cover.replace(
        /-/g,
        "/"
      )}/750x750.jpg`
    : "/placeholder-album.png";

  const artistName =
    album.artist?.name || album.artists?.[0]?.name || "Unknown Artist";
  const year = album.releaseDate
    ? new Date(album.releaseDate).getFullYear()
    : null;

  return (
    <Link href={`/album/${album.id}`} className="group relative block">
      {/* Album Card - Swiss Design Style */}
      <div
        className="relative bg-white dark:bg-[#1a1a1a] border-2 border-carbon dark:border-bone
                      shadow-[4px_4px_0px_0px_rgba(16,16,16,1)] dark:shadow-[4px_4px_0px_0px_rgba(242,239,233,1)]
                      hover:shadow-[6px_6px_0px_0px_rgba(16,16,16,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(242,239,233,1)]
                      hover:translate-x-[-2px] hover:translate-y-[-2px]
                      transition-all duration-200"
      >
        {/* Album Cover */}
        <div className="relative w-full aspect-square overflow-hidden border-b-2 border-carbon dark:border-bone">
          <Image
            src={coverUrl}
            alt={album.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-album.png";
            }}
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-walkman-orange opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        </div>

        {/* Album Info - Structured Grid */}
        <div className="p-4 space-y-2">
          {/* Label */}
          <div className="text-[9px] tracking-widest uppercase text-gray-500 dark:text-gray-400 font-mono">
            ALBUM
          </div>

          {/* Album Title */}
          <h3 className="font-mono font-bold text-sm leading-tight line-clamp-2 text-carbon dark:text-bone">
            {album.title}
          </h3>

          {/* Artist Name */}
          <p className="text-xs font-mono text-gray-600 dark:text-gray-400 line-clamp-1">
            {artistName}
          </p>

          {/* Album Meta Info - Grid Layout */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            {year && (
              <div className="flex-1 text-center">
                <div className="text-[9px] tracking-widest uppercase text-gray-400 dark:text-gray-600 font-mono">
                  YEAR
                </div>
                <div className="text-xs font-mono font-bold text-carbon dark:text-bone mt-0.5">
                  {year}
                </div>
              </div>
            )}
            {album.numberOfTracks && (
              <div className="flex-1 text-center">
                <div className="text-[9px] tracking-widest uppercase text-gray-400 dark:text-gray-600 font-mono">
                  TRACKS
                </div>
                <div className="text-xs font-mono font-bold text-carbon dark:text-bone mt-0.5">
                  {album.numberOfTracks}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inner border for depth effect */}
        <div className="absolute inset-0 border border-white/20 dark:border-white/5 pointer-events-none" />
      </div>
    </Link>
  );
}
