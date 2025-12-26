"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
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
    <div className="min-h-screen bg-[#ebe8e0] flex flex-col p-4 sm:p-8">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-4xl font-mono tracking-tight mb-1">SIDE A</h1>
            <div className="w-16 h-0.5 bg-black"></div>
          </div>
          <div className="text-right">
            <div className="bg-black text-white px-3 py-1 text-xs font-mono inline-block mb-2">
              2025
            </div>
            <div className="text-xs font-mono">26th of December</div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Search Section */}
          <div className="border-b-2 border-black p-6">
            <div className="text-[10px] font-mono tracking-wider mb-4 uppercase">
              Search Music
            </div>
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {/* Results Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="text-[10px] font-mono tracking-wider uppercase">
                Results
              </div>
              {tracks.length > 0 && (
                <div className="text-xs font-mono text-gray-600">
                  {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
                </div>
              )}
            </div>
            <SearchResults tracks={tracks} isLoading={isLoading} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="text-[10px] font-mono tracking-wider uppercase text-gray-600">
            Detent Music
          </div>
        </div>
      </div>
    </div>
  );
}
