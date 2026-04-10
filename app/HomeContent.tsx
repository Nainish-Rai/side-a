"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchResults } from "@/components/search/SearchResults";
import { MobileSearchHeader } from "@/components/mobile/MobileSearchHeader";
import { HomeHub } from "@/components/home/HomeHub";
import { useSearch, type SearchContentType } from "@/hooks/useSearch";

const DEFAULT_TAB: SearchContentType = "tracks";
const VALID_TABS = new Set<SearchContentType>(["tracks", "albums", "artists"]);

function getSearchTab(value: string | null): SearchContentType {
  return value && VALID_TABS.has(value as SearchContentType)
    ? (value as SearchContentType)
    : DEFAULT_TAB;
}

function buildSearchHref(
  query: string,
  tab: SearchContentType = DEFAULT_TAB,
) {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set("q", query.trim());
    params.set("tab", tab);
  }

  const search = params.toString();
  return search ? `/?${search}` : "/";
}

export function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const currentTab = getSearchTab(searchParams.get("tab"));
  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  const {
    tracks,
    albums,
    artists,
    searchMetadata,
    isLoading,
    hasNextPage,
    isFetchingMore,
    fetchNextPage,
    prefetchTab,
  } = useSearch({ query, currentTab });

  const hasResults =
    tracks.length > 0 || albums.length > 0 || artists.length > 0;
  return (
    <div className="min-h-screen">
      <div className="lg:hidden">
        <MobileSearchHeader
          query={draftQuery}
          onQueryChange={setDraftQuery}
          onSearch={(nextQuery) => {
            router.push(buildSearchHref(nextQuery));
          }}
          onClear={() => {
            setDraftQuery("");
            router.push("/");
          }}
          isLoading={isLoading}
          defaultExpanded
        />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6 lg:py-8">
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {isLoading
            ? `Searching for ${query || "music"}`
            : hasResults
              ? `${searchMetadata?.totalNumberOfItems ?? tracks.length + albums.length + artists.length} results for ${query || "music"}`
              : query
                ? `No results found for ${query}`
                : "Your music library and recently played"}
        </div>
        {hasResults || isLoading || query ? (
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
              onTabChange={(tab) => {
                router.push(buildSearchHref(query, tab));
              }}
              hasNextPage={hasNextPage}
              isFetchingMore={isFetchingMore}
              onLoadMore={fetchNextPage}
              prefetchTab={prefetchTab}
            />
          </section>
        ) : (
          <HomeHub />
        )}
      </div>
    </div>
  );
}
