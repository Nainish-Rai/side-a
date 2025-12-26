"use client";

import React from "react";
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

export default function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
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
      className="group relative cursor-pointer"
    >
      {/* Playlist Card */}
      <div className="relative bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 rounded-lg p-4 border-2 border-green-300 dark:border-green-700 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.25)] hover:shadow-[6px_6px_0px_0px_rgba(34,197,94,0.35)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
        {/* Playlist Cover */}
        <div className="relative w-full aspect-square mb-3 rounded-md overflow-hidden border-2 border-green-400 dark:border-green-600 shadow-inner">
          <Image
            src={coverUrl}
            alt={playlist.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-playlist.png";
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-green-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Play Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 bg-green-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border-2 border-white/50">
              <svg
                className="w-6 h-6 text-white ml-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>

          {/* Public/Private Badge */}
          {playlist.publicPlaylist !== undefined && (
            <div className="absolute top-2 right-2">
              <div
                className={`px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm border ${
                  playlist.publicPlaylist
                    ? "bg-green-500/80 border-green-300 text-white"
                    : "bg-gray-500/80 border-gray-300 text-white"
                }`}
              >
                {playlist.publicPlaylist ? "PUBLIC" : "PRIVATE"}
              </div>
            </div>
          )}
        </div>

        {/* Playlist Info */}
        <div className="space-y-1">
          {/* Playlist Title */}
          <h3 className="font-bold text-sm leading-tight line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {playlist.title}
          </h3>

          {/* Creator Name */}
          {playlist.creator && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
              by {playlist.creator.name}
            </p>
          )}

          {/* Description */}
          {playlist.description && (
            <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 pt-1">
              {playlist.description}
            </p>
          )}

          {/* Playlist Meta Info */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-500 pt-1">
            {playlist.numberOfTracks && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-200 dark:bg-green-800/50 rounded-full font-semibold text-green-700 dark:text-green-300">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                {playlist.numberOfTracks} tracks
              </span>
            )}
            {playlist.duration && (
              <span className="font-mono px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                {formatDuration(playlist.duration)}
              </span>
            )}
          </div>

          {/* Playlist Type Badge */}
          {playlist.type && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-200 dark:bg-teal-800/50 rounded text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                {playlist.type}
              </span>
            </div>
          )}
        </div>

        {/* Tactile Border Effect */}
        <div className="absolute inset-0 rounded-lg border border-white/30 dark:border-white/10 pointer-events-none" />
      </div>
    </div>
  );
}
