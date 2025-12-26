"use client";

import { Track } from "@/lib/api/types";
import { getTrackTitle, getTrackArtists, formatTime } from "@/lib/api/utils";
import { Music } from "lucide-react";
import { api } from "@/lib/api";

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
      <div className="w-full max-w-2xl mt-8">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-walkman-dark/80 border-2 border-walkman-orange/30 rounded-lg animate-pulse"
            >
              <div className="h-5 bg-walkman-orange/20 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-walkman-orange/20 rounded w-1/2"></div>
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
    <div className="w-full max-w-2xl mt-8">
      <div className="mb-4 text-walkman-yellow font-mono text-sm">
        {tracks.length} {tracks.length === 1 ? "track" : "tracks"} found
      </div>

      <div className="space-y-2">
        {tracks.map((track) => {
          // Check if album has a cover UUID, otherwise use album ID
          const coverId = track.album?.cover || track.album?.id;
          const coverUrl = coverId
            ? api.getCoverUrl(coverId, "320")
            : undefined;

          return (
            <div
              key={track.id}
              className="group p-4 bg-walkman-dark/80 border-2 border-walkman-orange
                                 hover:bg-walkman-dark hover:border-walkman-yellow
                                 rounded-lg transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-walkman-orange/20 rounded overflow-hidden">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={track.album?.title || "Album cover"}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center group-hover:bg-walkman-yellow/20 transition-colors">
                      <Music className="w-6 h-6 text-walkman-orange group-hover:text-walkman-yellow transition-colors" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-walkman-yellow font-medium truncate mb-1">
                    {getTrackTitle(track)}
                  </h3>
                  <p className="text-walkman-yellow/70 text-sm truncate">
                    {getTrackArtists(track)}
                  </p>
                  {track.album?.title && (
                    <p className="text-walkman-yellow/50 text-xs truncate mt-1">
                      {track.album.title}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 text-walkman-yellow/70 text-sm font-mono">
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
