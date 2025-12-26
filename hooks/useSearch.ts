import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCallback } from "react";
import { useSearchContext } from "@/contexts/SearchContext";

type SearchContentType = "tracks" | "albums" | "artists" | "playlists";

export function useSearch() {
  const queryClient = useQueryClient();
  const { query, currentTab, setQuery, setCurrentTab } = useSearchContext();

  // Track search query
  const tracksQuery = useQuery({
    queryKey: ["search", "tracks", query],
    queryFn: async () => {
      if (!query)
        return { items: [], totalNumberOfItems: 0, offset: 0, limit: 0 };
      return api.searchTracks(query);
    },
    enabled: !!query,
  });

  // Album search query
  const albumsQuery = useQuery({
    queryKey: ["search", "albums", query],
    queryFn: async () => {
      if (!query)
        return { items: [], totalNumberOfItems: 0, offset: 0, limit: 0 };
      return api.searchAlbums(query);
    },
    enabled: !!query && currentTab === "albums",
  });

  // Search handler - triggers track search and resets to tracks tab
  const handleSearch = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      setCurrentTab("tracks");
    },
    [setQuery, setCurrentTab]
  );

  // Tab change handler - fetches data for the selected tab if needed
  const handleTabChange = useCallback(
    (tab: SearchContentType) => {
      setCurrentTab(tab);
    },
    [setCurrentTab]
  );

  // Clear search results
  const clearSearch = useCallback(() => {
    setQuery("");
    setCurrentTab("tracks");
    queryClient.removeQueries({ queryKey: ["search"] });
  }, [queryClient, setQuery, setCurrentTab]);

  return {
    // Data
    tracks: tracksQuery.data?.items || [],
    albums: albumsQuery.data?.items || [],

    // Metadata
    searchMetadata: {
      totalNumberOfItems:
        currentTab === "tracks"
          ? tracksQuery.data?.totalNumberOfItems || 0
          : albumsQuery.data?.totalNumberOfItems || 0,
      offset:
        currentTab === "tracks"
          ? tracksQuery.data?.offset || 0
          : albumsQuery.data?.offset || 0,
      limit:
        currentTab === "tracks"
          ? tracksQuery.data?.limit || 0
          : albumsQuery.data?.limit || 0,
    },

    // Loading states
    isLoading: tracksQuery.isLoading || albumsQuery.isLoading,
    isTracksLoading: tracksQuery.isLoading,
    isAlbumsLoading: albumsQuery.isLoading,

    // State
    currentTab: currentTab,
    lastQuery: query,

    // Actions
    handleSearch,
    handleTabChange,
    clearSearch,
  };
}
