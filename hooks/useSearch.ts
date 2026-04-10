import { useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SearchResponse, Track, Album, Artist } from "@/lib/api/types";

export type SearchContentType = "tracks" | "albums" | "artists" | "playlists";

type SearchPage =
  | SearchResponse<Track>
  | SearchResponse<Album>
  | SearchResponse<Artist>;

interface UseSearchOptions {
  query: string;
  currentTab: SearchContentType;
}

export function useSearch({ query, currentTab }: UseSearchOptions) {
  const queryClient = useQueryClient();

  const tracksQuery = useInfiniteQuery({
    queryKey: ["search", "tracks", query],
    queryFn: async ({ pageParam, signal }) => {
      if (!query) {
        return { items: [], totalNumberOfItems: 0, offset: 0, limit: 0 };
      }

      const offset = pageParam ?? 0;
      const result = await api.searchTracks(query, { offset, limit: 25, signal });
      return { ...result, offset };
    },
    getNextPageParam: (lastPage) => {
      const currentOffset = lastPage.offset ?? 0;
      const currentLimit = lastPage.limit ?? 25;
      const totalItems = lastPage.totalNumberOfItems ?? 0;
      const nextOffset = currentOffset + currentLimit;

      return nextOffset >= totalItems ? undefined : nextOffset;
    },
    initialPageParam: 0,
    enabled: !!query && currentTab === "tracks",
  });

  const albumsQuery = useInfiniteQuery({
    queryKey: ["search", "albums", query],
    queryFn: async ({ pageParam, signal }) => {
      if (!query) {
        return { items: [], totalNumberOfItems: 0, offset: 0, limit: 0 };
      }

      const offset = pageParam ?? 0;
      const result = await api.searchAlbums(query, { offset, limit: 25, signal });
      return { ...result, offset };
    },
    getNextPageParam: (lastPage) => {
      const currentOffset = lastPage.offset ?? 0;
      const currentLimit = lastPage.limit ?? 25;
      const totalItems = lastPage.totalNumberOfItems ?? 0;
      const nextOffset = currentOffset + currentLimit;

      return nextOffset >= totalItems ? undefined : nextOffset;
    },
    initialPageParam: 0,
    enabled: !!query && currentTab === "albums",
  });

  const artistsQuery = useInfiniteQuery({
    queryKey: ["search", "artists", query],
    queryFn: async ({ pageParam, signal }) => {
      if (!query) {
        return { items: [], totalNumberOfItems: 0, offset: 0, limit: 0 };
      }

      const offset = pageParam ?? 0;
      const result = await api.searchArtists(query, { offset, limit: 25, signal });
      return { ...result, offset };
    },
    getNextPageParam: (lastPage) => {
      const currentOffset = lastPage.offset ?? 0;
      const currentLimit = lastPage.limit ?? 25;
      const totalItems = lastPage.totalNumberOfItems ?? 0;
      const nextOffset = currentOffset + currentLimit;

      return nextOffset >= totalItems ? undefined : nextOffset;
    },
    initialPageParam: 0,
    enabled: !!query && currentTab === "artists",
  });

  const tracks = tracksQuery.data?.pages.flatMap((page) => page.items) || [];
  const albums = albumsQuery.data?.pages.flatMap((page) => page.items) || [];
  const artists = artistsQuery.data?.pages.flatMap((page) => page.items) || [];

  const firstTracksPage = tracksQuery.data?.pages[0];
  const firstAlbumsPage = albumsQuery.data?.pages[0];
  const firstArtistsPage = artistsQuery.data?.pages[0];

  const activeQuery =
    currentTab === "tracks"
      ? tracksQuery
      : currentTab === "albums"
        ? albumsQuery
        : artistsQuery;

  const activeItems =
    currentTab === "tracks"
      ? tracks
      : currentTab === "albums"
        ? albums
        : artists;

  const prefetchTab = useCallback(
    (tab: "tracks" | "albums" | "artists") => {
      if (!query) return;

      const queryKey =
        tab === "tracks"
          ? ["search", "tracks", query]
          : tab === "albums"
            ? ["search", "albums", query]
            : ["search", "artists", query];

      queryClient.prefetchInfiniteQuery({
        queryKey,
        queryFn: async ({
          pageParam = 0,
          signal,
        }: {
          pageParam: number;
          signal?: AbortSignal;
        }): Promise<SearchPage> => {
          if (tab === "tracks") {
            return api.searchTracks(query, {
              offset: pageParam,
              limit: 25,
              signal,
            });
          }

          if (tab === "albums") {
            return api.searchAlbums(query, {
              offset: pageParam,
              limit: 25,
              signal,
            });
          }

          return api.searchArtists(query, {
            offset: pageParam,
            limit: 25,
            signal,
          });
        },
        initialPageParam: 0,
      });
    },
    [query, queryClient],
  );

  return {
    tracks,
    albums,
    artists,
    searchMetadata: {
      totalNumberOfItems:
        currentTab === "tracks"
          ? firstTracksPage?.totalNumberOfItems || 0
          : currentTab === "albums"
            ? firstAlbumsPage?.totalNumberOfItems || 0
            : firstArtistsPage?.totalNumberOfItems || 0,
      offset:
        currentTab === "tracks"
          ? firstTracksPage?.offset || 0
          : currentTab === "albums"
            ? firstAlbumsPage?.offset || 0
            : firstArtistsPage?.offset || 0,
      limit:
        currentTab === "tracks"
          ? firstTracksPage?.limit || 0
          : currentTab === "albums"
            ? firstAlbumsPage?.limit || 0
            : firstArtistsPage?.limit || 0,
    },
    isLoading: activeQuery.isLoading && activeItems.length === 0,
    isTracksLoading: tracksQuery.isLoading,
    isAlbumsLoading: albumsQuery.isLoading,
    isArtistsLoading: artistsQuery.isLoading,
    isFetchingMore: activeQuery.isFetchingNextPage,
    hasNextPage:
      currentTab === "tracks"
        ? tracksQuery.hasNextPage
        : currentTab === "albums"
          ? albumsQuery.hasNextPage
          : artistsQuery.hasNextPage,
    fetchNextPage: () => {
      if (currentTab === "tracks") {
        return tracksQuery.fetchNextPage();
      }

      if (currentTab === "albums") {
        return albumsQuery.fetchNextPage();
      }

      return artistsQuery.fetchNextPage();
    },
    currentTab,
    lastQuery: query,
    prefetchTab,
  };
}
