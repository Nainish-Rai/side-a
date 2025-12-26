"use client";

import { Track } from "@/lib/api/types";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useState } from "react";
import { SearchResultCard } from "./SearchResultCard";
import { LayoutGrid, LayoutList } from "lucide-react";

interface SearchResultsProps {
  tracks: Track[];
  isLoading?: boolean;
  totalNumberOfItems?: number;
  offset?: number;
  limit?: number;
}

export function SearchResults({
  tracks,
  isLoading = false,
  totalNumberOfItems,
  offset = 0,
  limit = 25,
}: SearchResultsProps) {
  const { setQueue, currentTrack, isPlaying } = useAudioPlayer();
  const [loadingTrackId, setLoadingTrackId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const handleTrackClick = async (track: Track, index: number) => {
    if (loadingTrackId === track.id) return;

    setLoadingTrackId(track.id);
    try {
      // Set the entire search results as the queue, starting from the clicked track
      await setQueue(tracks, index);
    } catch (error) {
      console.error("Error playing track:", error);
    } finally {
      setLoadingTrackId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-bone border border-gray-300 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 w-1/2"></div>
                </div>
              </div>
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
    <div className="w-full">
      {/* Header with Results Count and View Toggle */}
      <div className="mb-4 flex items-center justify-between bg-white border border-carbon p-3">
        <div className="font-mono">
          <span className="text-[9px] tracking-widest uppercase text-gray-500">
            SEARCH RESULTS
          </span>
          <div className="text-sm font-bold text-carbon mt-0.5">
            {totalNumberOfItems !== undefined ? (
              <>
                Showing {offset + 1}-
                {Math.min(offset + limit, totalNumberOfItems)} of{" "}
                {totalNumberOfItems.toLocaleString()} tracks
              </>
            ) : (
              `${tracks.length} tracks`
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border border-carbon">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 font-mono text-xs transition-colors
                       ${
                         viewMode === "list"
                           ? "bg-carbon text-white"
                           : "bg-white text-carbon hover:bg-bone"
                       }`}
            title="List View"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 font-mono text-xs transition-colors
                       ${
                         viewMode === "grid"
                           ? "bg-carbon text-white"
                           : "bg-white text-carbon hover:bg-bone"
                       }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results Grid/List */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 gap-3"
            : "grid grid-cols-1 gap-3"
        }
      >
        {tracks.map((track, index) => {
          const isCurrentTrack = currentTrack?.id === track.id;

          return (
            <SearchResultCard
              key={track.id}
              track={track}
              isCurrentTrack={isCurrentTrack}
              isPlaying={isCurrentTrack && isPlaying}
              isLoading={loadingTrackId === track.id}
              onClick={() => handleTrackClick(track, index)}
            />
          );
        })}
      </div>
    </div>
  );
}
