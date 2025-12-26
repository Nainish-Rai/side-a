"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { api } from "@/lib/api";
import { Track } from "@/lib/api/types";

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const response = await api.searchTracks(query);
      setTracks(response.items);
    } catch (error) {
      console.error("Search failed:", error);
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-bone flex flex-col p-4 sm:p-8 pb-32">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header - Swiss Design */}
        <div className="flex items-start justify-between mb-10 border-b border-carbon pb-6">
          <div>
            <h1 className="text-5xl font-mono tracking-tight mb-2 text-carbon font-bold">
              SIDE A
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-20 h-px bg-carbon"></div>
              <div className="text-[9px] font-mono tracking-widest uppercase text-gray-500">
                Hi-Fi Music Player
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-carbon text-white px-3 py-1.5 text-[9px] font-mono inline-block mb-2 tracking-widest">
              EST. 2025
            </div>
            <div className="text-[10px] font-mono text-gray-600 tracking-wide">
              26 DECEMBER
            </div>
          </div>
        </div>

        {/* Main Content Card - Modular Grid */}
        <div className="bg-white border border-carbon shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {/* Search Module */}
          <div className="border-b border-carbon p-6 bg-bone">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-[9px] font-mono tracking-widest uppercase text-carbon font-bold">
                ⦿ SEARCH
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {/* Results Module */}
          <div className="p-6 bg-white">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="text-[9px] font-mono tracking-widest uppercase text-carbon font-bold">
                  ⦿ RESULTS
                </div>
                <div className="flex-1 h-px bg-gray-300 w-12"></div>
              </div>
              {tracks.length > 0 && (
                <div className="px-3 py-1 bg-carbon text-white text-[9px] font-mono tracking-widest">
                  {tracks.length} {tracks.length === 1 ? "TRACK" : "TRACKS"}
                </div>
              )}
            </div>
            <SearchResults tracks={tracks} isLoading={isLoading} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="h-px bg-carbon w-16"></div>
          <div className="text-[9px] font-mono tracking-widest uppercase text-gray-500">
            Detent Music System
          </div>
          <div className="h-px bg-carbon w-16"></div>
        </div>
      </div>

      <AudioPlayer />
    </div>
  );
}
