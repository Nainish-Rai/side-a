"use client";

import { useState } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
   {/* Main Content */}
   <main className="min-h-screen pb-32">
    {/* Header - Brutalist Minimal */}
    <header className="sticky top-0 z-30 bg-background border-b border-foreground/10 transition-colors duration-300">
     <div className="max-w-6xl mx-auto px-6 py-4">
      {/* Logo + Search Bar + Theme Toggle in single flexbox */}
      <div className="flex items-center gap-4 md:gap-8">
       <div className="flex-shrink-0 flex pt-3 gap-3">
        {/* VHS Cassette Logo */}
        <div className="flex flex-col mt-1 gap-[2px]">
         <div className="w-3 h-[2px] bg-[#FF9FCF]" />
         <div className="w-3 h-[2px] bg-[#9AC0FF]" />
         <div className="w-3 h-[2px] bg-[#7FEDD0]" />
        </div>

        <div>
         <h1 className="text-base font-medium uppercase tracking-widest text-foreground leading-tight">
          SIDE A
         </h1>
         <p className="text-[9px] uppercase tracking-widest text-foreground/40">
          HI-FI SEARCH
         </p>
        </div>
       </div>

       {/* Search Bar */}
       <div className="flex-1">
        <SearchBar onSearch={handleSearchWithTracking} isLoading={isLoading} />
       </div>

       {/* Theme Toggle */}
       <div className="flex-shrink-0">
        <ThemeToggle />
       </div>
      </div>
     </div>
    </header>

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center min-h-[60vh]"
       >
        <div className="text-center max-w-md border border-foreground/10 px-12 py-16">
         <div className="mb-6">
          <Search className="w-10 h-10 text-foreground/20 mx-auto" />
         </div>
         <h3 className="text-sm font-mono uppercase tracking-widest text-foreground/90 mb-2">
          {hasSearched ? "NO RESULTS" : "SEARCH MUSIC"}
         </h3>
         <p className="text-[11px] font-mono uppercase tracking-wider text-foreground/40">
          {hasSearched
           ? "Try different keywords"
           : "Enter a song, album, or artist"}
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
