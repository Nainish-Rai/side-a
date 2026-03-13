"use client";

import { useState } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthStatusButton } from "@/components/auth/AuthStatusButton";
import { MobileSearchHeader } from "@/components/mobile/MobileSearchHeader";
import { AnimatedLogoMark } from "@/components/layout/AnimatedLogoMark";
import { useSearch } from "@/hooks/useSearch";
import { Library, ListMusic, Search } from "lucide-react";

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
    <div className="min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileSearchHeader
          onSearch={handleSearchWithTracking}
          isLoading={isLoading}
        />
      </div>

      {/* Desktop Header */}
      <header className="sticky top-0 z-30 hidden lg:block border-b border-foreground/10 bg-background">
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="grid grid-cols-[220px_auto_minmax(300px,1fr)_auto] items-center border border-foreground/10">
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

            <div className="px-5 py-4 border-r border-foreground/10">
              <div className="flex items-center gap-6">
                <span className="relative inline-flex items-center gap-2 pb-3 text-xs font-mono uppercase tracking-widest text-foreground">
                  <Search className="w-3.5 h-3.5" />
                  SEARCH
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
                </span>
                <Link
                  href="/library"
                  className="inline-flex items-center gap-2 pb-3 text-xs font-mono uppercase tracking-widest text-foreground/55 transition-colors hover:text-foreground/75"
                >
                  <Library className="w-3.5 h-3.5" />
                  LIBRARY
                </Link>
                <Link
                  href="/playlists"
                  className="inline-flex items-center gap-2 pb-3 text-xs font-mono uppercase tracking-widest text-foreground/55 transition-colors hover:text-foreground/75"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  PLAYLISTS
                </Link>
              </div>
            </div>

            <div className="min-w-0 px-5 py-3 border-r border-foreground/10">
              <SearchBar
                onSearch={handleSearchWithTracking}
                isLoading={isLoading}
              />
            </div>

            <div className="px-5 py-4">
              <div className="flex items-center gap-4 h-full">
                <AuthStatusButton />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-6 py-6 lg:py-8">
        {hasResults || isLoading ? (
          <section className="border border-foreground/10">
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
          </section>
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
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
          </div>
        )}
      </div>
    </div>
  );
}

