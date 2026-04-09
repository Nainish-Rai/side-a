"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Disc3,
  ListMusic,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Track, UserPlaylist } from "@/lib/api/types";
import { useLibrary } from "@/contexts/LibraryContext";
import { getTrackArtists, getTrackTitle } from "@/lib/api/utils";
import type {
  ImportedPlaylist,
  ImportedPlaylistTrack,
  PlaylistImportProgressSnapshot,
  PlaylistImportResult,
  PlaylistImportStreamEvent,
  TrackMatchDiagnostic,
} from "@/lib/ytmusic-import/types";

interface BaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function PlaylistDialogFrame({
  isOpen,
  onClose,
  title,
  eyebrow,
  children,
  footer,
}: BaseDialogProps) {
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
            className="fixed inset-x-4 top-[4vh] z-[111] mx-auto flex max-h-[92vh] max-w-lg flex-col border border-foreground/10 bg-background"
          >
            <div className="border-b border-foreground/10 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    {eyebrow}
                  </p>
                  <h2 className="mt-1 text-sm font-semibold uppercase tracking-[0.08em] text-foreground/90">
                    {title}
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
            {footer ? <div className="border-t border-foreground/10 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

interface PlaylistEditorDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  playlist?: UserPlaylist;
  onClose: () => void;
  onSubmit: (values: { name: string; description: string }) => void;
}

export function PlaylistEditorDialog({
  isOpen,
  mode,
  playlist,
  onClose,
  onSubmit,
}: PlaylistEditorDialogProps) {
  return (
    <PlaylistDialogFrame
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={mode === "create" ? "Playlist" : "Edit Playlist"}
      title={mode === "create" ? "New Playlist" : playlist?.name || "Edit Playlist"}
    >
      <PlaylistEditorDialogBody
        key={`${mode}-${playlist?.id ?? "new"}-${isOpen ? "open" : "closed"}`}
        mode={mode}
        playlist={playlist}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </PlaylistDialogFrame>
  );
}

function PlaylistEditorDialogBody({
  mode,
  playlist,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  playlist?: UserPlaylist;
  onClose: () => void;
  onSubmit: (values: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState(playlist?.name ?? "");
  const [description, setDescription] = useState(playlist?.description ?? "");
  const submitLabel = mode === "create" ? "Create Playlist" : "Save Changes";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) {
          toast.error("NAME REQUIRED");
          return;
        }
        onSubmit({ name, description });
        onClose();
      }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label
          htmlFor="playlist-name"
          className="block text-[10px] font-mono uppercase tracking-widest text-foreground/40"
        >
          Name
        </label>
        <input
          id="playlist-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Night Drive"
          className="h-11 w-full border border-foreground/20 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-foreground/30 focus:border-foreground/40"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="playlist-description"
          className="block text-[10px] font-mono uppercase tracking-widest text-foreground/40"
        >
          Description
        </label>
        <textarea
          id="playlist-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="Late-night rotation, weightless and precise."
          className="w-full border border-foreground/20 bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-foreground/30 focus:border-foreground/40"
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/55 transition-colors hover:text-foreground/75"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-opacity hover:opacity-90"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

interface PlaylistDeleteDialogProps {
  isOpen: boolean;
  playlist?: UserPlaylist;
  onClose: () => void;
  onConfirm: () => void;
}

export function PlaylistDeleteDialog({
  isOpen,
  playlist,
  onClose,
  onConfirm,
}: PlaylistDeleteDialogProps) {
  return (
    <PlaylistDialogFrame
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Delete Playlist"
      title={playlist?.name || "Delete Playlist"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/55 transition-colors hover:text-foreground/75"
          >
            Keep
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/85 transition-colors hover:border-foreground/40"
          >
            Delete
          </button>
        </div>
      }
    >
      <p className="max-w-md text-sm leading-relaxed text-foreground/60">
        Delete this playlist and remove its ordering. Tracks stay in your library and can remain in other playlists.
      </p>
    </PlaylistDialogFrame>
  );
}

interface YtMusicImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: PlaylistImportResult) => string;
}

type ImportTrackVisualStatus =
  | "queued"
  | "searching"
  | "matched"
  | "ambiguous"
  | "unmatched";

interface ImportTrackRow {
  index: number;
  track: ImportedPlaylistTrack;
  status: ImportTrackVisualStatus;
  diagnostic: TrackMatchDiagnostic | null;
}

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

function createTrackRows(playlist: ImportedPlaylist): ImportTrackRow[] {
  return playlist.tracks.map((track, index) => ({
    index,
    track,
    status: "queued",
    diagnostic: null,
  }));
}

function withUpdatedTrackRow(
  rows: ImportTrackRow[],
  index: number,
  updater: (row: ImportTrackRow) => ImportTrackRow,
): ImportTrackRow[] {
  return rows.map((row) => (row.index === index ? updater(row) : row));
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

function getTrackVisualStatus(diagnostic: TrackMatchDiagnostic): ImportTrackVisualStatus {
  if (diagnostic.status === "matched") return "matched";
  if (diagnostic.status === "ambiguous") return "ambiguous";
  return "unmatched";
}

function getTrackStatusLabel(status: ImportTrackVisualStatus): string {
  switch (status) {
    case "searching":
      return "Searching";
    case "matched":
      return "Matched";
    case "ambiguous":
      return "Needs Review";
    case "unmatched":
      return "No Match";
    default:
      return "Queued";
  }
}

function getTrackStatusClasses(status: ImportTrackVisualStatus): string {
  switch (status) {
    case "searching":
      return "border-foreground/30 text-foreground/70";
    case "matched":
      return "border-foreground/35 bg-foreground text-background";
    case "ambiguous":
      return "border-foreground/25 text-foreground/80";
    case "unmatched":
      return "border-foreground/18 text-foreground/45";
    default:
      return "border-foreground/12 text-foreground/35";
  }
}

async function streamYtMusicPlaylistImport(
  url: string,
  options: {
    signal: AbortSignal;
    onEvent: (event: PlaylistImportStreamEvent) => void;
  },
): Promise<PlaylistImportResult> {
  const response = await fetch("/api/import/ytmusic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
    signal: options.signal,
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || "Import failed.");
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
          throw new Error("Import response was invalid.");
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

function YtMusicImportMiniTray({
  playlist,
  progress,
  onRestore,
}: {
  playlist: ImportedPlaylist | null;
  progress: PlaylistImportProgressSnapshot;
  onRestore: () => void;
}) {
  if (typeof window === "undefined") return null;

  const completion =
    progress.total > 0 ? Math.max(progress.completed / progress.total, 0.08) : 0.08;

  return createPortal(
    <motion.button
      type="button"
      onClick={onRestore}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="fixed bottom-5 right-5 z-[112] w-[320px] overflow-hidden border border-foreground/15 bg-background text-left shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
    >
      <div className="border-b border-foreground/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-foreground/35">
              Import Running
            </p>
            <p className="mt-1 truncate text-sm font-medium uppercase tracking-[0.08em] text-foreground/90">
              {playlist?.title || "Fetching Playlist"}
            </p>
          </div>
          <Disc3 className="h-4 w-4 animate-spin text-foreground/45" />
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">
        <div className="h-1.5 overflow-hidden bg-foreground/8">
          <motion.div
            className="h-full bg-foreground"
            animate={{ scaleX: completion }}
            style={{ transformOrigin: "0% 50%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/45">
          <span>{progress.completed}/{progress.total || "--"} Checked</span>
          <span>{progress.matched} Ready</span>
        </div>
      </div>
    </motion.button>,
    document.body,
  );
}

export function YtMusicImportDialog({
  isOpen,
  onClose,
  onImport,
}: YtMusicImportDialogProps) {
  const shouldReduceMotion = useReducedMotion();
  const [url, setUrl] = useState("");
  const [playlist, setPlaylist] = useState<ImportedPlaylist | null>(null);
  const [trackRows, setTrackRows] = useState<ImportTrackRow[]>([]);
  const [progress, setProgress] = useState<PlaylistImportProgressSnapshot>(createEmptyProgress);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [result, setResult] = useState<PlaylistImportResult | null>(null);
  const [createdPlaylistId, setCreatedPlaylistId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      abortRef.current = null;
      setPlaylist(null);
      setTrackRows([]);
      setProgress(createEmptyProgress());
      setErrorMessage(null);
      setIsImporting(false);
      setIsMinimized(false);
      setResult(null);
      setCreatedPlaylistId(null);
      setIsExpanded(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const handleDismiss = () => {
    if (isImporting) {
      setIsMinimized(true);
      return;
    }
    onClose();
  };

  const orderedRows = useMemo(
    () => [...trackRows].sort((left, right) => left.index - right.index),
    [trackRows],
  );

  const visibleRows = isExpanded ? orderedRows : orderedRows.slice(0, 8);
  const searchingCount = orderedRows.filter((row) => row.status === "searching").length;
  const doneCount = progress.completed;
  const completion = progress.total > 0 ? progress.completed / progress.total : 0;
  const hasStarted = playlist !== null || isImporting || result !== null || errorMessage !== null;

  const stageLabel = result
    ? "Playlist Saved"
    : playlist
      ? isImporting
        ? doneCount < progress.total
          ? "Matching Playable Tracks"
          : "Saving Local Playlist"
        : errorMessage
          ? "Import Paused"
          : "Playlist Loaded"
      : isImporting
        ? "Reading Playlist"
        : "Ready To Import";

  return (
    <>
      <PlaylistDialogFrame
        isOpen={isOpen && !isMinimized}
        onClose={handleDismiss}
        eyebrow="Import Playlist"
        title="Import YTMusic"
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 border border-foreground/10 px-4 py-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground/35">
                Deck Status
              </p>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.08em] text-foreground/90">
                {stageLabel}
              </p>
            </div>
            {isImporting ? (
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="inline-flex h-9 w-9 items-center justify-center border border-foreground/15 text-foreground/50 transition-colors hover:text-foreground/85"
                aria-label="Minimize import"
              >
                <Minus className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {!hasStarted ? (
            <form
              onSubmit={async (event) => {
                event.preventDefault();

                if (!url.trim()) {
                  toast.error("URL REQUIRED");
                  return;
                }

                const controller = new AbortController();
                abortRef.current = controller;
                setPlaylist(null);
                setTrackRows([]);
                setProgress(createEmptyProgress());
                setErrorMessage(null);
                setResult(null);
                setCreatedPlaylistId(null);
                setIsImporting(true);
                setIsExpanded(false);

                try {
                  const streamedResult = await streamYtMusicPlaylistImport(url, {
                    signal: controller.signal,
                    onEvent: (event) => {
                      if (event.type === "playlist") {
                        setPlaylist(event.playlist);
                        setTrackRows(createTrackRows(event.playlist));
                        setProgress({
                          total: event.playlist.tracks.length,
                          completed: 0,
                          matched: 0,
                          ambiguous: 0,
                          unmatched: 0,
                        });
                        return;
                      }

                      if (event.type === "track-started") {
                        setProgress(event.payload.progress);
                        setTrackRows((prev) =>
                          withUpdatedTrackRow(prev, event.payload.index, (row) => ({
                            ...row,
                            status: row.status === "queued" ? "searching" : row.status,
                          })),
                        );
                        return;
                      }

                      if (event.type === "track-completed") {
                        setProgress(event.payload.progress);
                        setTrackRows((prev) =>
                          withUpdatedTrackRow(prev, event.payload.index, (row) => ({
                            ...row,
                            status: getTrackVisualStatus(event.payload.diagnostic),
                            diagnostic: event.payload.diagnostic,
                          })),
                        );
                      }
                    },
                  });

                  const playlistId = onImport(streamedResult);
                  setResult(streamedResult);
                  setCreatedPlaylistId(playlistId);
                  setIsImporting(false);
                  setIsMinimized(false);
                  toast.success(
                    streamedResult.stats.unmatched > 0 || streamedResult.stats.ambiguous > 0
                      ? `IMPORTED ${streamedResult.stats.matched}/${streamedResult.stats.total} TRACKS`
                      : "YT MUSIC IMPORTED",
                  );
                } catch (error) {
                  if (controller.signal.aborted) return;
                  setErrorMessage(error instanceof Error ? error.message : "Import failed.");
                  setIsImporting(false);
                  toast.error(error instanceof Error ? error.message : "Import failed.");
                } finally {
                  if (abortRef.current === controller) {
                    abortRef.current = null;
                  }
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="ytmusic-playlist-url"
                  className="block text-[10px] font-mono uppercase tracking-widest text-foreground/40"
                >
                  Playlist URL
                </label>
                <input
                  id="ytmusic-playlist-url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://music.youtube.com/playlist?list=..."
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="h-11 w-full border border-foreground/20 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-foreground/30 focus:border-foreground/40"
                />
              </div>

              <div className="grid gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-foreground/45 sm:grid-cols-3">
                <div className="border border-foreground/10 px-3 py-2">Fetch</div>
                <div className="border border-foreground/10 px-3 py-2">Match</div>
                <div className="border border-foreground/10 px-3 py-2">Save</div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/55 transition-colors hover:text-foreground/75"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-transform duration-200 ease-out hover:opacity-90 active:scale-[0.97]"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Start Import
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {playlist ? (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  className="border border-foreground/10 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold uppercase tracking-[0.08em] text-foreground/90">
                        {playlist.title}
                      </p>
                      <p className="mt-1 truncate text-[12px] text-foreground/50">
                        {playlist.creatorName} · {playlist.trackCount} tracks
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-foreground/12 bg-foreground/[0.03]">
                      <ListMusic className="h-4 w-4 text-foreground/35" />
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {playlist ? (
                <div className="space-y-3 border border-foreground/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-foreground/70">
                      {searchingCount > 0
                        ? `${searchingCount} searching`
                        : result
                          ? "Import complete"
                          : "Working"}
                    </p>
                    <div className="text-right text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/45">
                      <p>{progress.completed}/{progress.total}</p>
                    </div>
                  </div>

                  <div className="h-1.5 overflow-hidden bg-foreground/8">
                    <motion.div
                      className="h-full bg-foreground"
                      animate={{ scaleX: Math.max(completion, isImporting ? 0.02 : 0) }}
                      style={{ transformOrigin: "0% 50%" }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono uppercase tracking-[0.16em] text-foreground/45">
                    <div className="border border-foreground/10 px-2 py-2">
                      <p className="text-foreground/90">{progress.matched}</p>
                      <p className="mt-1">Ready</p>
                    </div>
                    <div className="border border-foreground/10 px-2 py-2">
                      <p className="text-foreground/90">{progress.ambiguous}</p>
                      <p className="mt-1">Maybe</p>
                    </div>
                    <div className="border border-foreground/10 px-2 py-2">
                      <p className="text-foreground/90">{progress.unmatched}</p>
                      <p className="mt-1">Miss</p>
                    </div>
                  </div>
                </div>
              ) : null}

                  {orderedRows.length > 0 ? (
                    <div className="border border-foreground/10">
                      <div className="flex items-center justify-between gap-3 border-b border-foreground/10 px-4 py-3">
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground/35">
                            Tape Roll
                          </p>
                          <p className="mt-1 text-[12px] text-foreground/50">
                            Live song-by-song import status, kept in original playlist order.
                          </p>
                        </div>
                        {orderedRows.length > 8 ? (
                          <button
                            type="button"
                            onClick={() => setIsExpanded((prev) => !prev)}
                            className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/45 transition-colors hover:text-foreground/80"
                          >
                            {isExpanded ? "Collapse" : "View All"}
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        ) : null}
                      </div>

                      <div className="max-h-[320px] overflow-y-auto">
                        <AnimatePresence initial={false}>
                          {visibleRows.map((row) => (
                            <motion.div
                              key={row.track.sourceId}
                              layout={!shouldReduceMotion}
                              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                              className="grid grid-cols-[34px_1fr_auto] items-center gap-3 border-b border-foreground/8 px-4 py-3 last:border-b-0"
                            >
                              <div className="text-center text-[11px] font-mono tabular-nums text-foreground/35">
                                {String(row.index + 1).padStart(2, "0")}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-foreground/88">
                                  {row.track.title}
                                </p>
                                <p className="truncate text-[11px] uppercase tracking-[0.12em] text-foreground/42">
                                  {row.track.artistName}
                                </p>
                              </div>
                              <div
                                className={`inline-flex items-center gap-2 border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${getTrackStatusClasses(row.status)}`}
                              >
                                {row.status === "searching" ? (
                                  <Search className="h-3 w-3" />
                                ) : row.status === "matched" ? (
                                  <Check className="h-3 w-3" />
                                ) : row.status === "queued" ? (
                                  <Disc3 className="h-3 w-3" />
                                ) : (
                                  <span className="h-3 w-3 rounded-full border border-current" />
                                )}
                                <span>{getTrackStatusLabel(row.status)}</span>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : null}

                  {errorMessage ? (
                    <div className="border border-foreground/15 px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground/35">
                        Import Error
                      </p>
                      <p className="mt-2 text-sm text-foreground/70">{errorMessage}</p>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
                    {result && createdPlaylistId ? (
                      <>
                        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-foreground/42">
                          {result.stats.matched} ready · {result.stats.unmatched + result.stats.ambiguous} not carried over
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={onClose}
                            className="border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/55 transition-colors hover:text-foreground/75"
                          >
                            Done
                          </button>
                          <Link
                            href={`/playlists/${createdPlaylistId}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-2 border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-transform duration-200 ease-out hover:opacity-90 active:scale-[0.97]"
                          >
                            Open Playlist
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            abortRef.current?.abort();
                            abortRef.current = null;
                            onClose();
                          }}
                          className="border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/55 transition-colors hover:text-foreground/75"
                        >
                          {isImporting ? "Cancel Import" : "Close"}
                        </button>
                        {isImporting ? (
                          <button
                            type="button"
                            onClick={() => setIsMinimized(true)}
                            className="inline-flex items-center gap-2 border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-transform duration-200 ease-out hover:opacity-90 active:scale-[0.97]"
                          >
                            Minimize
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              )}
        </div>
      </PlaylistDialogFrame>

      <AnimatePresence>
        {isOpen && isMinimized && isImporting ? (
          <YtMusicImportMiniTray
            playlist={playlist}
            progress={progress}
            onRestore={() => setIsMinimized(false)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

interface TrackPlaylistPickerDialogProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
}

export function TrackPlaylistPickerDialog({
  isOpen,
  track,
  onClose,
}: TrackPlaylistPickerDialogProps) {
  return (
    <PlaylistDialogFrame
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Add To Playlist"
      title={track ? getTrackTitle(track) : "Track"}
    >
      {track ? (
        <TrackPlaylistPickerDialogBody
          key={`${track.id}-${isOpen ? "open" : "closed"}`}
          track={track}
          onClose={onClose}
        />
      ) : null}
    </PlaylistDialogFrame>
  );
}

function TrackPlaylistPickerDialogBody({
  track,
  onClose,
}: {
  track: Track;
  onClose: () => void;
}) {
  const {
    playlists,
    createPlaylist,
    getPlaylistsForTrack,
    setTrackPlaylistMemberships,
  } = useLibrary();
  const [selectedIds, setSelectedIds] = useState(
    getPlaylistsForTrack(track.id).map((playlist) => playlist.id),
  );
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const membershipCount = selectedIds.length;

  return (
    <div className="space-y-5">
      <div className="border border-foreground/10 px-4 py-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/35">
          Track
        </p>
        <p className="mt-2 truncate text-sm font-medium text-foreground/90">
          {getTrackTitle(track)}
        </p>
        <p className="mt-1 truncate text-[12px] text-foreground/50">
          {getTrackArtists(track)}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
          Playlists
        </p>
        <div className="max-h-[280px] overflow-y-auto border border-foreground/10">
          {playlists.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <ListMusic className="mx-auto h-6 w-6 text-foreground/20" />
              <p className="mt-3 text-[11px] font-mono uppercase tracking-wider text-foreground/40">
                No playlists yet
              </p>
            </div>
          ) : (
            playlists.map((playlist) => {
              const isSelected = selectedIds.includes(playlist.id);

              return (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() =>
                    setSelectedIds((prev) =>
                      isSelected
                        ? prev.filter((id) => id !== playlist.id)
                        : [...prev, playlist.id],
                    )
                  }
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
                      {playlist.name}
                    </span>
                    <span className="block truncate text-[11px] font-mono uppercase tracking-wider text-foreground/35">
                      {playlist.tracks.length} tracks
                    </span>
                  </span>
                  {isSelected ? (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/45">
                      Selected
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-2 border-t border-foreground/10 pt-5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
          Quick Create
        </p>
        <div className="flex items-center gap-2">
          <input
            value={newPlaylistName}
            onChange={(event) => setNewPlaylistName(event.target.value)}
            placeholder="New playlist"
            className="h-10 flex-1 border border-foreground/20 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-foreground/30 focus:border-foreground/40"
          />
          <button
            type="button"
            onClick={() => {
              if (!newPlaylistName.trim()) {
                toast.error("NAME REQUIRED");
                return;
              }
              const id = createPlaylist({
                name: newPlaylistName,
                initialTracks: [track],
              });
              setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
              setNewPlaylistName("");
              toast.success("TAPE RECORDED");
            }}
            className="inline-flex h-10 items-center gap-2 border border-foreground/20 px-3 text-[10px] font-mono uppercase tracking-widest text-foreground/70 transition-colors hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Create
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/35">
          {membershipCount} selected
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/55 transition-colors hover:text-foreground/75"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setTrackPlaylistMemberships(track, selectedIds);
              toast.success("TRACK ASSIGNED");
              onClose();
            }}
            className="border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-opacity hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
