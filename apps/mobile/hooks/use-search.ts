import { useState, useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Track, Album, Artist } from "@side-a/shared/api/types";

export type SearchTab = "tracks" | "albums" | "artists";

export function useSearch() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [currentTab, setCurrentTab] = useState<SearchTab>("tracks");

  const tracksQuery = useInfiniteQuery({
    queryKey: ["search", "tracks", query],
    queryFn: async ({ pageParam = 0, signal }) => {
      if (!query) return { items: [] as Track[], totalNumberOfItems: 0, offset: 0, limit: 0 };
      const result = await api.searchTracks(query, { offset: pageParam, limit: 25, signal });
      return { ...result, offset: pageParam };
    },
    getNextPageParam: (lastPage) => {
      const next = (lastPage.offset ?? 0) + (lastPage.limit ?? 25);
      return next >= (lastPage.totalNumberOfItems ?? 0) ? undefined : next;
    },
    initialPageParam: 0,
    enabled: !!query && currentTab === "tracks",
  });

  const albumsQuery = useInfiniteQuery({
    queryKey: ["search", "albums", query],
    queryFn: async ({ pageParam = 0, signal }) => {
      if (!query) return { items: [] as Album[], totalNumberOfItems: 0, offset: 0, limit: 0 };
      const result = await api.searchAlbums(query, { offset: pageParam, limit: 25, signal });
      return { ...result, offset: pageParam };
    },
    getNextPageParam: (lastPage) => {
      const next = (lastPage.offset ?? 0) + (lastPage.limit ?? 25);
      return next >= (lastPage.totalNumberOfItems ?? 0) ? undefined : next;
    },
    initialPageParam: 0,
    enabled: !!query && currentTab === "albums",
  });

  const artistsQuery = useInfiniteQuery({
    queryKey: ["search", "artists", query],
    queryFn: async ({ pageParam = 0, signal }) => {
      if (!query) return { items: [] as Artist[], totalNumberOfItems: 0, offset: 0, limit: 0 };
      const result = await api.searchArtists(query, { offset: pageParam, limit: 25, signal });
      return { ...result, offset: pageParam };
    },
    getNextPageParam: (lastPage) => {
      const next = (lastPage.offset ?? 0) + (lastPage.limit ?? 25);
      return next >= (lastPage.totalNumberOfItems ?? 0) ? undefined : next;
    },
    initialPageParam: 0,
    enabled: !!query && currentTab === "artists",
  });

  const tracks = tracksQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const albums = albumsQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const artists = artistsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const activeQuery =
    currentTab === "tracks" ? tracksQuery : currentTab === "albums" ? albumsQuery : artistsQuery;

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setCurrentTab("tracks");
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setCurrentTab("tracks");
    queryClient.removeQueries({ queryKey: ["search"] });
  }, [queryClient]);

  return {
    query,
    currentTab,
    setCurrentTab,
    handleSearch,
    clearSearch,
    tracks,
    albums,
    artists,
    isLoading: activeQuery.isLoading,
    isFetchingMore: activeQuery.isFetchingNextPage,
    hasNextPage: activeQuery.hasNextPage ?? false,
    fetchNextPage: activeQuery.fetchNextPage,
  };
}
