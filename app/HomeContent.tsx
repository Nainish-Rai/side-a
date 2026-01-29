"use client";

import { useState } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { useSearch } from "@/hooks/useSearch";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function HomeContent() {
  const {
    tracks,
    albums,
    artists,
    searchMetadata,
    isLoading,
    currentTab,
    handleSearch,
    handleTabChange,
    hasNextPage,
    isFetchingMore,
    fetchNextPage,
    prefetchTab,
  } = useSearch();

  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchWithTracking = (query: string) => {
    handleSearch(query);
    setHasSearched(true);
  };

  const hasResults =
    tracks.length > 0 || albums.length > 0 || artists.length > 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main Content */}
      <main className="min-h-screen pb-32">
        {/* Header - Clean & Minimal */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="sticky top-0 z-30 bg-black/60 backdrop-blur-2xl border-b border-white/5"
        >
          <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Logo */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">
                  SIDE A
                </h1>
                <p className="text-xs text-white/40 tracking-wide">
                  Hi-Fi Music Search
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <SearchBar
              onSearch={handleSearchWithTracking}
              isLoading={isLoading}
            />
          </div>
        </motion.header>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {hasResults || isLoading ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{ willChange: "opacity, transform" }}
              >
                <SearchResults
                  tracks={tracks}
                  albums={albums}
                  artists={artists}
                  contentType={currentTab}
                  isLoading={isLoading}
                  totalNumberOfItems={searchMetadata?.totalNumberOfItems}
                  offset={searchMetadata?.offset}
                  limit={searchMetadata?.limit}
                  onTabChange={handleTabChange}
                  hasNextPage={hasNextPage}
                  isFetchingMore={isFetchingMore}
                  onLoadMore={fetchNextPage}
                  prefetchTab={prefetchTab}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{ willChange: "opacity, transform" }}
                className="flex items-center justify-center min-h-[60vh]"
              >
                <div className="text-center max-w-md">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                    style={{ willChange: "transform" }}
                    className="mb-8 inline-block"
                  >
                    <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center">
                      <Search className="w-12 h-12 text-white/20" />
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white/90 mb-3">
                    {hasSearched ? "No Results Found" : "Start Searching"}
                  </h3>
                  <p className="text-base text-white/40 leading-relaxed">
                    {hasSearched
                      ? "Try searching with different keywords"
                      : "Search for your favorite songs, albums, or artists"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Fixed Audio Player */}
      <AudioPlayer />
    </div>
  );
}
