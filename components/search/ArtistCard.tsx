"use client";

import React from "react";
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

export default function ArtistCard({ artist, onClick }: ArtistCardProps) {
  const pictureUrl = artist.picture
    ? `https://resources.tidal.com/images/${artist.picture.replace(
        /-/g,
        "/"
      )}/750x750.jpg`
    : "/placeholder-artist.png";

  return (
    <div
      onClick={() => onClick?.(artist)}
      className="group relative cursor-pointer"
    >
      {/* Artist Card */}
      <div className="relative bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-4 border-2 border-purple-300 dark:border-purple-700 shadow-[4px_4px_0px_0px_rgba(147,51,234,0.25)] hover:shadow-[6px_6px_0px_0px_rgba(147,51,234,0.35)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
        {/* Artist Picture - Circular */}
        <div className="relative w-full aspect-square mb-3 rounded-full overflow-hidden border-4 border-purple-400 dark:border-purple-600 shadow-lg mx-auto">
          <Image
            src={pictureUrl}
            alt={artist.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-artist.png";
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-purple-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Verified Badge (if popular) */}
          {artist.popularity && artist.popularity > 50 && (
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-md">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Artist Info */}
        <div className="space-y-1 text-center">
          {/* Artist Name */}
          <h3 className="font-bold text-sm leading-tight line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {artist.name}
          </h3>

          {/* Artist Type/Category */}
          {artist.type && (
            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-semibold">
              {artist.type}
            </p>
          )}

          {/* Popularity Badge */}
          {artist.popularity !== undefined && (
            <div className="flex items-center justify-center gap-1 pt-1">
              <div className="w-full max-w-[80px] h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${artist.popularity}%` }}
                />
              </div>
              <span className="text-xs font-mono text-gray-500 dark:text-gray-500">
                {artist.popularity}
              </span>
            </div>
          )}

          {/* Bio Preview */}
          {artist.bio && (
            <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 pt-1">
              {artist.bio}
            </p>
          )}

          {/* Artist Badge */}
          <div className="pt-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-200 dark:bg-purple-800/50 rounded-full text-xs font-semibold text-purple-700 dark:text-purple-300">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              Artist
            </span>
          </div>
        </div>

        {/* Tactile Border Effect */}
        <div className="absolute inset-0 rounded-lg border border-white/30 dark:border-white/10 pointer-events-none" />
      </div>
    </div>
  );
}
