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
    <div className="min-h-screen bg-walkman-dark flex flex-col items-center justify-start p-8">
      <div className="w-full max-w-4xl flex flex-col items-center">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-walkman-yellow mb-2 font-mono tracking-wider">
            SIDE A
          </h1>
          <div className="w-24 h-1 bg-walkman-orange mx-auto"></div>
        </div>

        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        <SearchResults tracks={tracks} isLoading={isLoading} />
      </div>
    </div>
  );
}
