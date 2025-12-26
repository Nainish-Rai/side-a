"use client";

import { Track } from "@/lib/api/types";
import { getTrackTitle, getTrackArtists, formatTime } from "@/lib/api/utils";
import { Music } from "lucide-react";
import { api } from "@/lib/api";
import Image from "next/image";

interface SearchResultsProps {
  tracks: Track[];
  isLoading?: boolean;
}

export function SearchResults({
  tracks,
  isLoading = false,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="w-full mt-6">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-gray-100 border-2 border-gray-200 animate-pulse"
            >
              <div className="h-5 bg-gray-200 w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-6">
      <div className="space-y-3">
        {tracks.map((track) => {
          // Check if album has a cover UUID, otherwise use album ID
          const coverId = track.album?.cover || track.album?.id;
          const coverUrl = coverId
            ? api.getCoverUrl(coverId, "320")
            : undefined;

          return (
            <div
              key={track.id}
              className="group p-4 bg-white border-2 border-black
                         hover:bg-gray-50
                         transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 border border-black overflow-hidden">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={track.album?.title || "Album cover"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-6 h-6 text-black" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-black font-medium truncate mb-1">
                    {getTrackTitle(track)}
                  </h3>
                  <p className="text-gray-600 text-sm truncate">
                    {getTrackArtists(track)}
                  </p>
                  {track.album?.title && (
                    <p className="text-gray-400 text-xs truncate mt-1">
                      {track.album.title}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 text-gray-600 text-sm font-mono tabular-nums">
                  {formatTime(track.duration)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
