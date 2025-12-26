"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { api } from "@/lib/api";
import { Track } from "@/lib/api/types";
import { Music2, Search, TrendingUp } from "lucide-react";

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMetadata, setSearchMetadata] = useState<{
    totalNumberOfItems: number;
    offset: number;
    limit: number;
  } | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const response = await api.searchTracks(query);
      setTracks(response.items);
      setSearchMetadata({
        totalNumberOfItems: response.totalNumberOfItems,
        offset: response.offset,
        limit: response.limit,
      });
    } catch (error) {
      console.error("Search failed:", error);
      setTracks([]);
      setSearchMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-bone flex pb-24">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-carbon text-white border-r border-carbon p-6 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-3xl font-mono tracking-tight mb-1 font-bold">
            SIDE A
          </h1>
          <div className="h-0.5 w-16 bg-walkman-orange"></div>
          <div className="text-[9px] font-mono tracking-widest uppercase text-gray-400 mt-2">
            Hi-Fi Music Player
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 border border-white/20 hover:bg-white/20 transition-colors text-left">
              <Search className="w-4 h-4" />
              <span className="text-sm font-mono">Search</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 border border-transparent hover:border-white/20 transition-colors text-left">
              <Music2 className="w-4 h-4" />
              <span className="text-sm font-mono">Library</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 border border-transparent hover:border-white/20 transition-colors text-left">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-mono">Trending</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/20 pt-4">
          <div className="text-[9px] font-mono tracking-widest uppercase text-gray-400">
            EST. 2025
          </div>
          <div className="text-[10px] font-mono text-gray-500 mt-1">
            Detent Music System
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-carbon p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="lg:hidden">
                <h1 className="text-2xl font-mono tracking-tight font-bold text-carbon">
                  SIDE A
                </h1>
              </div>
              <div className="hidden lg:block">
                <h2 className="text-2xl font-mono tracking-tight font-bold text-carbon">
                  Search
                </h2>
              </div>
              <div className="text-right">
                <div className="bg-carbon text-white px-3 py-1 text-[9px] font-mono inline-block tracking-widest">
                  26 DEC 2025
                </div>
              </div>
            </div>
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {tracks.length > 0 || isLoading ? (
              <SearchResults
                tracks={tracks}
                isLoading={isLoading}
                totalNumberOfItems={searchMetadata?.totalNumberOfItems}
                offset={searchMetadata?.offset}
                limit={searchMetadata?.limit}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Music2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-mono font-bold text-carbon mb-2">
                    No results yet
                  </h3>
                  <p className="text-sm font-mono text-gray-500">
                    Search for tracks to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fixed Audio Player */}
      <AudioPlayer />
    </div>
  );
}
