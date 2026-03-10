"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthStatusButton } from "@/components/auth/AuthStatusButton";
import { MobileSearchHeader } from "@/components/mobile/MobileSearchHeader";
import { AnimatedLogoMark } from "@/components/layout/AnimatedLogoMark";
import { useSearch } from "@/hooks/useSearch";
import { Library, ListMusic, Search } from "lucide-react";
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
 const [isMobile, setIsMobile] = useState(false);

 // Detect mobile viewport
 useEffect(() => {
  const checkMobile = () => {
   setIsMobile(window.innerWidth < 1024);
  };
  checkMobile();
  window.addEventListener("resize", checkMobile);
  return () => window.removeEventListener("resize", checkMobile);
 }, []);

 const handleSearchWithTracking = (query: string) => {
  handleSearch(query);
  setHasSearched(true);
 };

 const hasResults =
  tracks.length > 0 || albums.length > 0 || artists.length > 0;

 return (
  <>
   {/* Search Content */}
   <div className="min-h-screen">
    {/* Mobile Header */}
    {isMobile && (
     <MobileSearchHeader
      onSearch={handleSearchWithTracking}
      isLoading={isLoading}
     />
    )}

    {/* Desktop Header */}
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm hidden lg:block">
     <div className="max-w-6xl mx-auto px-6 pt-4">
      <div className="border border-foreground/10">
       <div className="grid grid-cols-[220px_1fr] border-b border-foreground/10">
        <div className="px-5 py-4 border-r border-foreground/10">
         <div className="flex items-center gap-3">
          <AnimatedLogoMark className="text-foreground" />
          <div>
           <h1 className="text-base font-mono uppercase tracking-widest text-foreground leading-tight">
            SIDE A
           </h1>
           <p className="text-[9px] font-mono uppercase tracking-widest text-foreground/40">
            HI-FI SEARCH
           </p>
          </div>
         </div>
        </div>

        <div className="px-5 py-4">
         <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 px-3 py-2 border border-foreground/15 text-xs font-mono uppercase tracking-widest text-foreground">
           <Search className="w-3.5 h-3.5" />
           SEARCH
          </span>
          <Link
           href="/library"
           className="inline-flex items-center gap-2 px-3 py-2 border border-foreground/10 text-xs font-mono uppercase tracking-widest text-foreground/55 transition-colors hover:text-foreground/75 hover:border-foreground/20"
          >
           <Library className="w-3.5 h-3.5" />
           LIBRARY
          </Link>
          <Link
           href="/playlists"
           className="inline-flex items-center gap-2 px-3 py-2 border border-foreground/10 text-xs font-mono uppercase tracking-widest text-foreground/55 transition-colors hover:text-foreground/75 hover:border-foreground/20"
          >
           <ListMusic className="w-3.5 h-3.5" />
           PLAYLISTS
          </Link>
         </div>
        </div>
       </div>

       <div className="grid grid-cols-[1fr_auto]">
        <div className="px-5 py-4 border-r border-foreground/10">
         <SearchBar onSearch={handleSearchWithTracking} isLoading={isLoading} />
        </div>
        <div className="px-5 py-4">
         <div className="flex items-center gap-4 h-full">
          <AuthStatusButton />
          <ThemeToggle />
         </div>
        </div>
       </div>
      </div>
     </div>
    </header>

    {/* Content Area */}
    <div className="max-w-6xl mx-auto px-6 py-6 lg:py-8">
     <AnimatePresence mode="wait">
      {hasResults || isLoading ? (
       <motion.section
        key="results"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{ willChange: "opacity, transform" }}
        className="border border-foreground/10"
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
       </motion.section>
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
   </div>
  </>
 );
}
