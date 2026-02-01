"use client";

import React, { memo } from "react";
import Image from "next/image";

interface Playlist {
  uuid: string;
  title: string;
  description?: string;
  image?: string;
  squareImage?: string;
  numberOfTracks?: number;
  duration?: number;
  creator?: {
    id: number;
    name: string;
  };
  type?: string;
  publicPlaylist?: boolean;
}

interface PlaylistCardProps {
  playlist: Playlist;
  onClick?: (playlist: Playlist) => void;
}

function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  const coverUrl =
    playlist.squareImage || playlist.image
      ? `https://resources.tidal.com/images/${(
          playlist.squareImage || playlist.image
        )?.replace(/-/g, "/")}/750x750.jpg`
      : "/placeholder-playlist.png";

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div
      onClick={() => onClick?.(playlist)}
      className="group cursor-pointer block h-full"
    >
      {/* Brutalist Minimal Playlist Card */}
      <div className="h-full flex flex-col border border-white/10 bg-black transition-all duration-200 hover:bg-white/[0.02]">
        {/* Playlist Cover */}
        <div className="relative w-full aspect-square overflow-hidden border-b border-white/10 bg-white/5 flex-shrink-0">
          <Image
            src={coverUrl}
            alt={playlist.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-playlist.png";
            }}
          />
        </div>

        {/* Playlist Info - Data-Focused Layout */}
        <div className="p-4 space-y-3 flex-1 flex flex-col">
          {/* Type Label */}
          <div className="text-[9px] tracking-widest uppercase text-white/40 font-mono">
            PLAYLIST
          </div>

          {/* Playlist Title */}
          <h3 className="font-medium text-sm leading-tight line-clamp-2 text-white/90 group-hover:text-white transition-colors duration-200">
            {playlist.title}
          </h3>

          {/* Creator Name */}
          {playlist.creator && (
            <p className="text-xs text-white/50 line-clamp-1 group-hover:text-white/70 transition-colors duration-200">
              {playlist.creator.name}
            </p>
          )}

          {/* Playlist Metadata - Structured Grid */}
          <div className="flex items-center gap-4 pt-3 border-t border-white/10 mt-auto">
            {playlist.numberOfTracks && (
              <div className="flex-1">
                <div className="text-[9px] tracking-widest uppercase text-white/40 font-mono mb-1">
                  TRACKS
                </div>
                <div className="text-xs font-mono tabular-nums text-white/60">
                  {playlist.numberOfTracks}
                </div>
              </div>
            )}
            {playlist.duration && (
              <div className="flex-1">
                <div className="text-[9px] tracking-widest uppercase text-white/40 font-mono mb-1">
                  DURATION
                </div>
                <div className="text-xs font-mono tabular-nums text-white/60">
                  {formatDuration(playlist.duration)}
                </div>
              </div>
            )}
            {!playlist.numberOfTracks && !playlist.duration && (
              <div className="h-[34px]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

PlaylistCard.displayName = 'PlaylistCard';

export default memo(PlaylistCard);
