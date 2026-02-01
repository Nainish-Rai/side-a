"use client";

import React, { memo } from "react";
import Image from "next/image";

interface Artist {
  id: number;
  name: string;
  picture?: string;
  type?: string;
  popularity?: number;
  bio?: string;
}

interface ArtistCardProps {
  artist: Artist;
  onClick?: (artist: Artist) => void;
}

function ArtistCard({ artist, onClick }: ArtistCardProps) {
  const pictureUrl = artist.picture
    ? `https://resources.tidal.com/images/${artist.picture.replace(
        /-/g,
        "/"
      )}/750x750.jpg`
    : "/placeholder-artist.png";

  return (
    <div
      onClick={() => onClick?.(artist)}
      className="group cursor-pointer block h-full"
    >
      {/* Brutalist Minimal Artist Card */}
      <div className="h-full flex flex-col border border-white/10 bg-black transition-all duration-200 hover:bg-white/[0.02]">
        {/* Artist Picture */}
        <div className="relative w-full aspect-square overflow-hidden border-b border-white/10 bg-white/5 flex-shrink-0">
          <Image
            src={pictureUrl}
            alt={artist.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-artist.png";
            }}
          />
        </div>

        {/* Artist Info - Data-Focused Layout */}
        <div className="p-4 space-y-3 flex-1 flex flex-col">
          {/* Type Label */}
          <div className="text-[9px] tracking-widest uppercase text-white/40 font-mono">
            ARTIST
          </div>

          {/* Artist Name */}
          <h3 className="font-medium text-sm leading-tight line-clamp-2 text-white/90 group-hover:text-white transition-colors duration-200">
            {artist.name}
          </h3>

          {/* Artist Type */}
          {artist.type && (
            <p className="text-xs text-white/50 uppercase tracking-wider group-hover:text-white/70 transition-colors duration-200">
              {artist.type}
            </p>
          )}

          {/* Artist Metadata - Structured Grid */}
          <div className="pt-3 border-t border-white/10 mt-auto">
            {artist.popularity !== undefined && (
              <div>
                <div className="text-[9px] tracking-widest uppercase text-white/40 font-mono mb-1">
                  POPULARITY
                </div>
                <div className="text-xs font-mono tabular-nums text-white/60">
                  {artist.popularity}%
                </div>
              </div>
            )}
            {!artist.popularity && (
              <div className="h-[34px]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

ArtistCard.displayName = 'ArtistCard';

export default memo(ArtistCard);
