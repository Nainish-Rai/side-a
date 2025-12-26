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
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

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
              className="p-4 bg-bone dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 animate-pulse transition-colors duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 w-1/2"></div>
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
      <div className="mb-4 flex items-center justify-between bg-white dark:bg-[#1a1a1a] border border-carbon dark:border-bone p-3 transition-colors duration-300">
        <div className="font-mono">
          <span className="text-[9px] tracking-widest uppercase text-gray-500 dark:text-gray-400">
            SEARCH RESULTS
          </span>
          <div className="text-sm font-bold text-carbon dark:text-bone mt-0.5">
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
        <div className="flex items-center gap-1 border border-carbon dark:border-bone">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 font-mono text-xs transition-colors
                       ${
                         viewMode === "list"
                           ? "bg-carbon dark:bg-bone text-white dark:text-carbon"
                           : "bg-white dark:bg-[#1a1a1a] text-carbon dark:text-bone hover:bg-bone dark:hover:bg-[#2a2a2a]"
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
                           ? "bg-carbon dark:bg-bone text-white dark:text-carbon"
                           : "bg-white dark:bg-[#1a1a1a] text-carbon dark:text-bone hover:bg-bone dark:hover:bg-[#2a2a2a]"
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
