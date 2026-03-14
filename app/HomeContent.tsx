"use client";

import { useState } from "react";
import { SearchResults } from "@/components/search/SearchResults";
import { MobileSearchHeader } from "@/components/mobile/MobileSearchHeader";
import { useSearch } from "@/hooks/useSearch";
import { Search } from "lucide-react";

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
      {/* Mobile Header — shown only below lg breakpoint */}
      <div className="lg:hidden">
        <MobileSearchHeader
          onSearch={handleSearchWithTracking}
          isLoading={isLoading}
        />
      </div>

      {/* Content Area */}
      <div className="mx-auto max-w-6xl px-6 py-6 lg:py-8">
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
