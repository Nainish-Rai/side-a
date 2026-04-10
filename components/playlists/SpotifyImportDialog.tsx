"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  Disc3,
  Link2,
  Loader2,
  Music4,
  Radio,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ImportedPlaylist,
  PlaylistImportProgressSnapshot,
  PlaylistImportResult,
  PlaylistImportStreamEvent,
} from "@/lib/playlist-import/types";

interface SpotifyImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: PlaylistImportResult, sourceDescription: string) => string;
}

interface SpotifyAccountState {
  authenticated: boolean;
  linked: boolean;
}

interface SpotifyImportablePlaylist {
  id: string;
  name: string;
  description: string | null;
  ownerName: string;
  trackCount: number;
  thumbnailUrl: string | null;
}

type SpotifyImportMode = "public" | "account";

function isPlaylistImportResult(value: unknown): value is PlaylistImportResult {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.playlistName === "string" &&
    Array.isArray(candidate.matchedTracks) &&
    Array.isArray(candidate.ambiguousTracks) &&
    Array.isArray(candidate.unmatchedTracks) &&
    Array.isArray(candidate.diagnostics) &&
    typeof candidate.stats === "object" &&
    candidate.stats !== null
  );
}

function createEmptyProgress(): PlaylistImportProgressSnapshot {
  return {
    total: 0,
    completed: 0,
    matched: 0,
    ambiguous: 0,
    unmatched: 0,
  };
}

function SpotifyImportFrame({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[110] bg-black/55"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 34, bounce: 0 }}
            className="fixed inset-x-4 top-[4vh] z-[111] mx-auto flex max-h-[92vh] max-w-2xl flex-col border border-foreground/10 bg-background"
          >
            <div className="border-b border-foreground/10 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Import Playlist
                  </p>
                  <h2 className="mt-1 text-sm font-semibold uppercase tracking-[0.08em] text-foreground/90">
                    Import Spotify
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center text-foreground/45 transition-colors hover:text-foreground/80"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto px-5 py-5">{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

async function readErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function fetchSpotifyAccountState(signal: AbortSignal): Promise<SpotifyAccountState> {
  const response = await fetch("/api/import/spotify/account", {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to load Spotify account status."));
  }

  return (await response.json()) as SpotifyAccountState;
}

async function fetchSpotifyPlaylists(signal: AbortSignal): Promise<SpotifyImportablePlaylist[]> {
  const response = await fetch("/api/import/spotify/playlists", {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to load Spotify playlists."));
  }

  const data = (await response.json()) as { playlists?: SpotifyImportablePlaylist[] };
  return data.playlists ?? [];
}

async function beginSpotifyAccountLink(): Promise<void> {
  const response = await fetch("/api/auth/link-social", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider: "spotify",
      callbackURL: `${window.location.origin}/playlists`,
      disableRedirect: true,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to connect Spotify."));
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) {
    throw new Error("Spotify link flow did not return a redirect URL.");
  }

  window.location.assign(data.url);
}

async function streamSpotifyImport(
  url: string,
  mode: SpotifyImportMode,
  options: {
    signal: AbortSignal;
    selectedPlaylistId: string | null;
    onEvent: (event: PlaylistImportStreamEvent) => void;
  },
): Promise<PlaylistImportResult> {
  const endpoint =
    mode === "public" ? "/api/import/spotify/public" : "/api/import/spotify/authenticated";
  const body =
    mode === "public"
      ? { url }
      : { playlistId: options.selectedPlaylistId };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options.signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Spotify import failed."));
  }

  if (!response.body) {
    throw new Error("Import stream was unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: PlaylistImportResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const event = JSON.parse(trimmedLine) as PlaylistImportStreamEvent;
      options.onEvent(event);

      if (event.type === "error") {
        throw new Error(event.message);
      }

      if (event.type === "complete") {
        if (!isPlaylistImportResult(event.result)) {
          throw new Error("Spotify import response was invalid.");
        }

        finalResult = event.result;
      }
    }
  }

  if (!finalResult) {
    throw new Error("Import ended before a final result was received.");
  }

  return finalResult;
}

export function SpotifyImportDialog({
  isOpen,
  onClose,
  onImport,
}: SpotifyImportDialogProps) {
  const [mode, setMode] = useState<SpotifyImportMode>("public");
  const [publicUrl, setPublicUrl] = useState("");
  const [accountState, setAccountState] = useState<SpotifyAccountState | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyImportablePlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<ImportedPlaylist | null>(null);
  const [progress, setProgress] = useState<PlaylistImportProgressSnapshot>(createEmptyProgress);
  const [result, setResult] = useState<PlaylistImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdPlaylistId, setCreatedPlaylistId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const accountRequestAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    accountRequestAbortRef.current?.abort();
    accountRequestAbortRef.current = controller;

    void fetchSpotifyAccountState(controller.signal)
      .then((state) => {
        setAccountState(state);
        if (!state.linked) {
          setPlaylists([]);
          setSelectedPlaylistId(null);
          return;
        }

        return fetchSpotifyPlaylists(controller.signal).then((loadedPlaylists) => {
          setPlaylists(loadedPlaylists);
          setSelectedPlaylistId((currentId) => currentId ?? loadedPlaylists[0]?.id ?? null);
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load Spotify state.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingAccount(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      accountRequestAbortRef.current?.abort();
    };
  }, []);

  const selectedPlaylist = useMemo(
    () => playlists.find((candidate) => candidate.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId],
  );

  const completion = progress.total > 0 ? progress.completed / progress.total : 0;
  const canStartImport =
    mode === "public" ? publicUrl.trim().length > 0 : Boolean(selectedPlaylistId);

  return (
    <SpotifyImportFrame
      isOpen={isOpen}
      onClose={() => {
        if (!isImporting) {
          onClose();
        }
      }}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("public")}
            className={`border px-3 py-3 text-left transition-colors ${
              mode === "public"
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/15 text-foreground/65 hover:text-foreground/85"
            }`}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest">Public URL</p>
            <p className="mt-2 text-sm font-medium">No Spotify login</p>
          </button>
          <button
            type="button"
            onClick={() => setMode("account")}
            className={`border px-3 py-3 text-left transition-colors ${
              mode === "account"
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/15 text-foreground/65 hover:text-foreground/85"
            }`}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest">Connected Account</p>
            <p className="mt-2 text-sm font-medium">Official Spotify API</p>
          </button>
        </div>

        {mode === "public" ? (
          <div className="space-y-3 border border-foreground/10 p-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/35">
                Public Playlist URL
              </p>
              <input
                value={publicUrl}
                onChange={(event) => setPublicUrl(event.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="mt-3 h-11 w-full border border-foreground/20 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-foreground/30 focus:border-foreground/40"
              />
            </div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-foreground/35">
              Best-effort import using Spotify page metadata.
            </p>
          </div>
        ) : (
          <div className="space-y-3 border border-foreground/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/35">
                  Spotify Account
                </p>
                <p className="mt-2 text-sm text-foreground/75">
                  {accountState?.authenticated
                    ? accountState.linked
                      ? "Connected and ready."
                      : "Signed in to SIDE A, but Spotify is not connected yet."
                    : "Sign in to SIDE A first, then connect Spotify."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void beginSpotifyAccountLink().catch((error) => {
                    toast.error(error instanceof Error ? error.message : "Failed to connect Spotify.");
                  });
                }}
                disabled={!accountState?.authenticated}
                className="inline-flex items-center gap-2 border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/70 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Link2 className="h-3.5 w-3.5" />
                Connect Spotify
              </button>
            </div>

            {isLoadingAccount ? (
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-foreground/40">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading Spotify account
              </div>
            ) : null}

            {accountState?.linked ? (
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/35">
                  Importable Playlists
                </p>
                <div className="max-h-[280px] overflow-y-auto border border-foreground/10">
                  {playlists.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <Music4 className="mx-auto h-6 w-6 text-foreground/20" />
                      <p className="mt-3 text-[11px] font-mono uppercase tracking-wider text-foreground/40">
                        No Spotify playlists found
                      </p>
                    </div>
                  ) : (
                    playlists.map((playlistOption) => {
                      const isSelected = playlistOption.id === selectedPlaylistId;

                      return (
                        <button
                          key={playlistOption.id}
                          type="button"
                          onClick={() => setSelectedPlaylistId(playlistOption.id)}
                          className="grid w-full grid-cols-[24px_1fr_auto] items-center gap-3 border-b border-foreground/10 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.02] last:border-b-0"
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center border ${
                              isSelected
                                ? "border-foreground bg-foreground text-background"
                                : "border-foreground/20 text-transparent"
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium text-foreground/90">
                              {playlistOption.name}
                            </span>
                            <span className="block truncate text-[11px] font-mono uppercase tracking-wider text-foreground/35">
                              {playlistOption.trackCount} tracks · {playlistOption.ownerName}
                            </span>
                          </span>
                          {isSelected ? (
                            <Radio className="h-4 w-4 text-foreground/45" />
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {(playlist || isImporting || result || errorMessage) ? (
          <div className="space-y-3 border border-foreground/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/35">
                  Import Status
                </p>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.08em] text-foreground/90">
                  {result
                    ? "Playlist Saved"
                    : isImporting
                      ? "Matching Playable Tracks"
                      : errorMessage
                        ? "Import Stopped"
                        : "Ready"}
                </p>
              </div>
              {isImporting ? <Disc3 className="h-4 w-4 animate-spin text-foreground/45" /> : null}
            </div>

            <div className="h-1.5 overflow-hidden bg-foreground/8">
              <motion.div
                className="h-full bg-foreground"
                animate={{ scaleX: Math.max(completion, isImporting ? 0.02 : 0) }}
                style={{ transformOrigin: "0% 50%" }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              />
            </div>

            {playlist ? (
              <div className="grid gap-2 text-[11px] font-mono uppercase tracking-wider text-foreground/45 sm:grid-cols-3">
                <span>{playlist.title}</span>
                <span>{progress.completed}/{progress.total || playlist.trackCount} checked</span>
                <span>{progress.matched} ready</span>
              </div>
            ) : null}

            {result ? (
              <div className="grid gap-2 text-[11px] font-mono uppercase tracking-wider text-foreground/45 sm:grid-cols-4">
                <span>{result.stats.total} total</span>
                <span>{result.stats.matched} matched</span>
                <span>{result.stats.ambiguous} ambiguous</span>
                <span>{result.stats.unmatched} unmatched</span>
              </div>
            ) : null}

            {errorMessage ? (
              <p className="text-[11px] font-mono uppercase tracking-wider text-foreground/55">
                {errorMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/35">
            {createdPlaylistId ? "Playlist created" : selectedPlaylist?.name || "Ready"}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isImporting) {
                  abortRef.current?.abort();
                  abortRef.current = null;
                  setIsImporting(false);
                  return;
                }

                onClose();
              }}
              className="border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/55 transition-colors hover:text-foreground/75"
            >
              {isImporting ? "Cancel Import" : "Close"}
            </button>
            <button
              type="button"
              disabled={isImporting || !canStartImport}
              onClick={() => {
                const controller = new AbortController();
                abortRef.current?.abort();
                abortRef.current = controller;
                setPlaylist(null);
                setProgress(createEmptyProgress());
                setResult(null);
                setErrorMessage(null);
                setCreatedPlaylistId(null);
                setIsImporting(true);

                void streamSpotifyImport(publicUrl, mode, {
                  signal: controller.signal,
                  selectedPlaylistId,
                  onEvent: (event) => {
                    if (event.type === "playlist") {
                      setPlaylist(event.playlist);
                      setProgress({
                        total: event.playlist.trackCount,
                        completed: 0,
                        matched: 0,
                        ambiguous: 0,
                        unmatched: 0,
                      });
                      return;
                    }

                    if (event.type === "track-completed") {
                      setProgress(event.payload.progress);
                    }
                  },
                })
                  .then((importResult) => {
                    setResult(importResult);
                    const playlistId = onImport(
                      importResult,
                      mode === "public" ? "Imported from Spotify" : "Imported from Spotify account",
                    );
                    setCreatedPlaylistId(playlistId);
                    setIsImporting(false);
                    toast.success("TAPE RECORDED");
                  })
                  .catch((error) => {
                    if (controller.signal.aborted) {
                      toast.error("IMPORT CANCELLED");
                      return;
                    }

                    setErrorMessage(error instanceof Error ? error.message : "Spotify import failed.");
                    setIsImporting(false);
                    toast.error(error instanceof Error ? error.message : "Spotify import failed.");
                  });
              }}
              className="border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start Import
            </button>
          </div>
        </div>
      </div>
    </SpotifyImportFrame>
  );
}
