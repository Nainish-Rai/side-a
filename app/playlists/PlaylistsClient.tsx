"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ListMusic,
  Loader2,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
import {
  PlaylistDeleteDialog,
  PlaylistEditorDialog,
  YtMusicImportDialog,
} from "@/components/playlists/PlaylistDialogs";
import { getPlaylistCoverUrl, getPlaylistDuration } from "@/components/playlists/playlist-utils";
import { formatDuration } from "@/lib/api/utils";
import type { Playlist, UserPlaylist } from "@/lib/api/types";
import type { PlaylistImportResult } from "@/lib/ytmusic-import/types";

const DEFAULT_LIMIT = 40;

function getRemotePlaylistImage(playlist: Playlist): string | null {
  const imageId = playlist.squareImage || playlist.image;
  if (!imageId) return null;
  return `https://resources.tidal.com/images/${imageId.replace(/-/g, "/")}/160x160.jpg`;
}

function getRemotePlaylistCreator(playlist: Playlist): string {
  if (!playlist.creator) return "UNKNOWN";
  if (typeof playlist.creator === "string") return playlist.creator;
  return playlist.creator.name || "UNKNOWN";
}

export function PlaylistsClient() {
  const { playlists, createPlaylist, updatePlaylist, deletePlaylist } = useLibrary();
  const { setQueue } = useAudioPlayer();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [playlistBeingEdited, setPlaylistBeingEdited] = useState<UserPlaylist | null>(null);
  const [playlistBeingDeleted, setPlaylistBeingDeleted] = useState<UserPlaylist | null>(null);
  const trimmedQuery = debouncedQuery.trim();
  const hasQuery = trimmedQuery.length > 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["playlists", trimmedQuery],
    queryFn: () => api.searchPlaylists(trimmedQuery, { offset: 0, limit: DEFAULT_LIMIT }),
    enabled: hasQuery,
  });

  const remotePlaylists = useMemo(() => data?.items ?? [], [data?.items]);
  const remoteTotal = data?.totalNumberOfItems ?? remotePlaylists.length;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-widest text-foreground/90">
              Your Playlists
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                {playlists.length}
              </span>
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-2 border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/70 transition-colors hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Import YTMusic
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                New Playlist
              </button>
            </div>
          </div>

          {playlists.length === 0 ? (
            <div className="border border-foreground/10 px-8 py-14 text-center">
              <ListMusic className="mx-auto h-8 w-8 text-foreground/20" />
              <p className="mt-4 text-sm font-mono uppercase tracking-widest text-foreground/90">
                No Playlists Yet
              </p>
              <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-foreground/40">
                Create one here or add a track to playlists from any results row.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="mt-6 inline-flex items-center gap-2 border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Playlist
              </button>
            </div>
          ) : (
            <div className="border border-foreground/10">
              <div className="sticky top-0 z-20 border-b border-foreground/10 bg-background/95 backdrop-blur-xl lg:top-[73px]">
                <div className="grid grid-cols-[40px_1fr_80px_100px_210px] gap-4 px-6 py-3">
                  <span className="text-center text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    #
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Playlist
                  </span>
                  <span className="text-right text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Tracks
                  </span>
                  <span className="text-right text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Duration
                  </span>
                  <span className="text-right text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Actions
                  </span>
                </div>
              </div>

              {playlists.map((playlist, index) => {
                const coverUrl = getPlaylistCoverUrl(playlist);
                const duration = getPlaylistDuration(playlist);

                return (
                  <div
                    key={playlist.id}
                    className="grid grid-cols-[40px_1fr_80px_100px_210px] items-center gap-4 border-b border-foreground/10 px-6 py-3 last:border-b-0 hover:bg-foreground/[0.02]"
                  >
                    <span className="text-center text-xs font-mono tabular-nums text-foreground/40">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <Link href={`/playlists/${playlist.id}`} className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-foreground/10 bg-foreground/5">
                          {coverUrl ? (
                            <Image
                              src={coverUrl}
                              alt={playlist.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ListMusic className="h-4 w-4 text-foreground/25" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-foreground/90">
                            {playlist.name}
                          </p>
                          <p className="truncate text-[11px] font-mono uppercase tracking-wider text-foreground/35">
                            {playlist.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <p className="text-right text-[12px] font-mono tabular-nums text-foreground/50">
                      {playlist.tracks.length}
                    </p>
                    <p className="text-right text-[12px] font-mono tabular-nums text-foreground/50">
                      {formatDuration(duration)}
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (playlist.tracks.length === 0) {
                            toast.error("TAPE EMPTY");
                            return;
                          }
                          void setQueue(playlist.tracks, 0);
                        }}
                        className="inline-flex items-center gap-2 border border-foreground/20 px-2.5 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/60 transition-colors hover:text-foreground"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Play
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlaylistBeingEdited(playlist)}
                        className="inline-flex items-center gap-2 border border-foreground/20 px-2.5 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/60 transition-colors hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlaylistBeingDeleted(playlist)}
                        className="inline-flex items-center gap-2 border border-foreground/20 px-2.5 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/60 transition-colors hover:text-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4 border-t border-foreground/10 pt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                Discover
              </p>
              <h2 className="mt-1 text-xs font-mono uppercase tracking-widest text-foreground/90">
                Browse TIDAL Playlists
              </h2>
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

          {!hasQuery ? (
            <div className="border border-foreground/10 px-8 py-14 text-center">
              <Search className="mx-auto h-8 w-8 text-foreground/20" />
              <p className="mt-4 text-sm font-mono uppercase tracking-widest text-foreground/90">
                Search Remote Playlists
              </p>
              <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-foreground/40">
                Discovery stays separate from your local editable playlists.
              </p>
            </div>
          ) : isError ? (
            <div className="border border-foreground/10 px-8 py-14 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-foreground/25" />
              <p className="mt-4 text-sm font-mono uppercase tracking-widest text-foreground/90">
                Request Failed
              </p>
              <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-foreground/40">
                {error instanceof Error ? error.message : "Unable to fetch playlists"}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-5 border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/70 transition-colors hover:text-foreground"
              >
                Retry
              </button>
            </div>
          ) : (
            <section className="border border-foreground/10">
              <div className="border-b border-foreground/10 px-6 py-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  {isLoading
                    ? "Loading discovery playlists"
                    : `${remotePlaylists.length} shown / ${remoteTotal} total`}
                </p>
              </div>

              <div className="sticky top-0 z-20 border-b border-foreground/10 bg-background/95 backdrop-blur-xl lg:top-[73px]">
                <div className="grid grid-cols-[40px_1fr_160px_80px_220px] gap-4 px-6 py-3">
                  <span className="text-center text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    #
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Playlist
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Curator
                  </span>
                  <span className="text-right text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Tracks
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Description
                  </span>
                </div>
              </div>

              {isLoading ? (
                <div>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={`remote-playlist-skeleton-${index}`}
                      className="grid animate-pulse grid-cols-[40px_1fr_160px_80px_220px] items-center gap-4 border-b border-foreground/10 px-6 py-3"
                    >
                      <div className="mx-auto h-3 w-5 bg-foreground/10" />
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 border border-foreground/10 bg-foreground/10" />
                        <div className="min-w-0 flex-1">
                          <div className="h-3 w-2/3 bg-foreground/10" />
                        </div>
                      </div>
                      <div className="h-3 w-2/3 bg-foreground/10" />
                      <div className="ml-auto h-3 w-10 bg-foreground/10" />
                      <div className="h-3 w-full bg-foreground/10" />
                    </div>
                  ))}
                </div>
              ) : remotePlaylists.length === 0 ? (
                <div className="px-8 py-14 text-center">
                  <ListMusic className="mx-auto h-8 w-8 text-foreground/20" />
                  <p className="mt-4 text-sm font-mono uppercase tracking-widest text-foreground/90">
                    No Playlists Found
                  </p>
                </div>
              ) : (
                remotePlaylists.map((playlist, index) => {
                  const coverUrl = getRemotePlaylistImage(playlist);

                  return (
                    <article
                      key={playlist.uuid || playlist.id || `${playlist.title}-${index}`}
                      className="grid grid-cols-[40px_1fr_160px_80px_220px] items-center gap-4 border-b border-foreground/10 px-6 py-3 transition-colors hover:bg-foreground/[0.02] last:border-b-0"
                    >
                      <span className="text-center text-xs font-mono tabular-nums text-foreground/40">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-foreground/10 bg-foreground/5">
                          {coverUrl ? (
                            <Image
                              src={coverUrl}
                              alt={playlist.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ListMusic className="h-4 w-4 text-foreground/25" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-foreground/90">
                            {playlist.title}
                          </p>
                        </div>
                      </div>
                      <p className="truncate text-[12px] text-foreground/50">
                        {getRemotePlaylistCreator(playlist)}
                      </p>
                      <p className="text-right text-[12px] font-mono tabular-nums text-foreground/50">
                        {playlist.numberOfTracks ?? "-"}
                      </p>
                      <p className="truncate text-[12px] text-foreground/40">
                        {playlist.description || "-"}
                      </p>
                    </article>
                  );
                })
              )}
            </section>
          )}
        </section>
      </div>

      {hasQuery && isLoading ? (
        <div className="pointer-events-none fixed bottom-5 right-5 hidden items-center gap-2 border border-foreground/20 bg-background px-3 py-2 lg:flex">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground/50" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
            Loading
          </span>
        </div>
      ) : null}

      <PlaylistEditorDialog
        isOpen={isCreateOpen}
        mode="create"
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(values) => {
          createPlaylist(values);
          toast.success("TAPE CREATED");
        }}
      />
      <YtMusicImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={(result: PlaylistImportResult) => {
          createPlaylist({
            name: result.playlistName,
            description: "Imported from YouTube Music",
            initialTracks: result.matchedTracks,
          });

          if (result.stats.unmatched > 0) {
            toast.success(
              `IMPORTED ${result.stats.matched}/${result.stats.total} TRACKS`,
            );
            return;
          }

          toast.success("YTMusic playlist imported");
        }}
      />
      <PlaylistEditorDialog
        isOpen={playlistBeingEdited !== null}
        mode="edit"
        playlist={playlistBeingEdited || undefined}
        onClose={() => setPlaylistBeingEdited(null)}
        onSubmit={(values) => {
          if (!playlistBeingEdited) return;
          updatePlaylist(playlistBeingEdited.id, values);
          toast.success("TAPE REWINDED");
        }}
      />
      <PlaylistDeleteDialog
        isOpen={playlistBeingDeleted !== null}
        playlist={playlistBeingDeleted || undefined}
        onClose={() => setPlaylistBeingDeleted(null)}
        onConfirm={() => {
          if (!playlistBeingDeleted) return;
          deletePlaylist(playlistBeingDeleted.id);
          toast.success("TAPE EJECTED");
        }}
      />
    </div>
  );
}
