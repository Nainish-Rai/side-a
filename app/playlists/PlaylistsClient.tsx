"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ListMusic, Loader2, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Playlist } from "@/lib/api/types";

const DEFAULT_LIMIT = 40;

function getPlaylistImage(playlist: Playlist): string | null {
  const imageId = playlist.squareImage || playlist.image;
  if (!imageId) return null;
  return `https://resources.tidal.com/images/${imageId.replace(/-/g, "/")}/160x160.jpg`;
}

function getPlaylistCreator(playlist: Playlist): string {
  if (!playlist.creator) return "UNKNOWN";
  if (typeof playlist.creator === "string") return playlist.creator;
  return playlist.creator.name || "UNKNOWN";
}

export function PlaylistsClient() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const trimmedQuery = debouncedQuery.trim();
  const hasQuery = trimmedQuery.length > 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["playlists", trimmedQuery],
    queryFn: () => api.searchPlaylists(trimmedQuery, { offset: 0, limit: DEFAULT_LIMIT }),
    enabled: hasQuery,
  });

  const playlists = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.totalNumberOfItems ?? playlists.length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                Browse
              </p>
              <h1 className="text-base font-semibold tracking-tight text-foreground/90">
                PLAYLISTS
              </h1>
            </div>

            <div className="w-full max-w-md">
              <label
                htmlFor="playlist-search"
                className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-foreground/40"
              >
                Search
              </label>
              <div className="flex items-center border border-foreground/20 px-3">
                <Search className="h-3.5 w-3.5 shrink-0 text-foreground/40" />
                <input
                  id="playlist-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="editorial, focus, house"
                  className="h-10 w-full bg-transparent px-3 text-sm text-foreground/90 outline-none placeholder:text-foreground/30"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {!hasQuery && (
          <div className="flex min-h-[45vh] items-center justify-center border border-foreground/10 px-8 py-14 text-center">
            <div>
              <Search className="mx-auto mb-5 h-8 w-8 text-foreground/25" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-foreground/90">
                SEARCH PLAYLISTS
              </h2>
              <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-foreground/40">
                Enter a keyword to load playlists
              </p>
            </div>
          </div>
        )}

        {hasQuery && isError && (
          <div className="flex min-h-[45vh] items-center justify-center border border-foreground/10 px-8 py-14 text-center">
            <div>
              <AlertCircle className="mx-auto mb-4 h-8 w-8 text-foreground/35" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-foreground/90">
                REQUEST FAILED
              </h2>
              <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-foreground/40">
                {error instanceof Error ? error.message : "Unable to fetch playlists"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-5 border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/70 transition-colors hover:text-foreground"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {hasQuery && !isError && (
          <section className="border border-foreground/10">
            <div className="border-b border-foreground/10 px-6 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                {isLoading
                  ? "LOADING PLAYLISTS"
                  : `${playlists.length} shown / ${total} total`}
              </p>
            </div>

            <div className="sticky top-[73px] z-20 border-b border-foreground/10 bg-background/95 backdrop-blur-xl">
              <div className="grid grid-cols-[40px_1fr_120px_80px] gap-4 px-6 py-3 lg:grid-cols-[40px_1fr_180px_80px_220px]">
                <span className="text-center text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  #
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Playlist
                </span>
                <span className="hidden text-[10px] font-mono uppercase tracking-widest text-foreground/40 lg:block">
                  Curator
                </span>
                <span className="text-right text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Tracks
                </span>
                <span className="hidden text-[10px] font-mono uppercase tracking-widest text-foreground/40 lg:block">
                  Description
                </span>
              </div>
            </div>

            {isLoading && (
              <div>
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={`playlist-skeleton-${index}`}
                    className="grid animate-pulse grid-cols-[40px_1fr_120px_80px] items-center gap-4 border-b border-foreground/10 px-6 py-3 lg:grid-cols-[40px_1fr_180px_80px_220px]"
                  >
                    <div className="mx-auto h-3 w-5 bg-foreground/10" />
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 border border-foreground/10 bg-foreground/10" />
                      <div className="min-w-0 flex-1">
                        <div className="h-3 w-2/3 bg-foreground/10" />
                        <div className="mt-2 h-3 w-1/2 bg-foreground/10 lg:hidden" />
                      </div>
                    </div>
                    <div className="hidden h-3 w-2/3 bg-foreground/10 lg:block" />
                    <div className="ml-auto h-3 w-10 bg-foreground/10" />
                    <div className="hidden h-3 w-full bg-foreground/10 lg:block" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && playlists.length === 0 && (
              <div className="flex min-h-[38vh] items-center justify-center px-8 py-14 text-center">
                <div>
                  <ListMusic className="mx-auto mb-4 h-8 w-8 text-foreground/25" />
                  <h2 className="text-sm font-mono uppercase tracking-widest text-foreground/90">
                    NO PLAYLISTS FOUND
                  </h2>
                  <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-foreground/40">
                    Try a broader keyword
                  </p>
                </div>
              </div>
            )}

            {!isLoading &&
              playlists.map((playlist, index) => {
                const coverUrl = getPlaylistImage(playlist);

                return (
                  <article
                    key={playlist.uuid || playlist.id || `${playlist.title}-${index}`}
                    className="grid grid-cols-[40px_1fr_120px_80px] items-center gap-4 border-b border-foreground/10 px-6 py-3 transition-all duration-200 hover:bg-foreground/[0.02] lg:grid-cols-[40px_1fr_180px_80px_220px]"
                  >
                    <span className="text-center text-xs font-mono tabular-nums text-foreground/40">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden border border-foreground/10 bg-foreground/5">
                        {coverUrl ? (
                          <Image
                            src={coverUrl}
                            alt={playlist.title}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ListMusic className="h-4 w-4 text-foreground/30" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-medium text-foreground/90">
                          {playlist.title}
                        </h3>
                        <p className="truncate text-[12px] text-foreground/50 lg:hidden">
                          {getPlaylistCreator(playlist)}
                        </p>
                      </div>
                    </div>

                    <p className="hidden truncate text-[12px] text-foreground/50 lg:block">
                      {getPlaylistCreator(playlist)}
                    </p>

                    <p className="text-right text-[12px] font-mono tabular-nums text-foreground/50">
                      {playlist.numberOfTracks ?? "-"}
                    </p>

                    <p className="hidden truncate text-[12px] text-foreground/40 lg:block">
                      {playlist.description || "-"}
                    </p>
                  </article>
                );
              })}
          </section>
        )}
      </div>

      {hasQuery && isLoading && (
        <div className="pointer-events-none fixed bottom-5 right-5 hidden items-center gap-2 border border-foreground/20 bg-background px-3 py-2 lg:flex">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground/50" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
            Loading
          </span>
        </div>
      )}
    </div>
  );
}
