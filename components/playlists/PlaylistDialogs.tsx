"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, ListMusic, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { Track, UserPlaylist } from "@/lib/api/types";
import { useLibrary } from "@/contexts/LibraryContext";
import { getTrackArtists, getTrackTitle } from "@/lib/api/utils";
import type { PlaylistImportResult } from "@/lib/ytmusic-import/types";

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
            className="fixed inset-x-4 top-[8vh] z-[111] mx-auto max-w-lg border border-foreground/10 bg-background"
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
            <div className="px-5 py-5">{children}</div>
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
  onImport: (result: PlaylistImportResult) => void;
}

export function YtMusicImportDialog({
  isOpen,
  onClose,
  onImport,
}: YtMusicImportDialogProps) {
  return (
    <PlaylistDialogFrame
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Import Playlist"
      title="Import YTMusic"
    >
      <YtMusicImportDialogBody
        key={isOpen ? "open" : "closed"}
        onClose={onClose}
        onImport={onImport}
      />
    </PlaylistDialogFrame>
  );
}

async function importYtMusicPlaylist(url: string): Promise<PlaylistImportResult> {
  const response = await fetch("/api/import/ytmusic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = (await response.json()) as { error?: string } & Partial<PlaylistImportResult>;
  if (!response.ok) {
    throw new Error(data.error || "Import failed.");
  }

  if (
    typeof data.playlistName !== "string" ||
    !Array.isArray(data.matchedTracks) ||
    !Array.isArray(data.unmatchedTracks) ||
    !data.stats
  ) {
    throw new Error("Import response was invalid.");
  }

  return data as PlaylistImportResult;
}

function YtMusicImportDialogBody({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (result: PlaylistImportResult) => void;
}) {
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();

        if (!url.trim()) {
          toast.error("URL REQUIRED");
          return;
        }

        setIsSubmitting(true);

        try {
          const result = await importYtMusicPlaylist(url);
          onImport(result);
          onClose();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Import failed.");
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="space-y-5"
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

      <div className="border border-foreground/10 px-4 py-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/35">
          Phase 1
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/60">
          Imports a public YouTube Music playlist, matches tracks against playable TIDAL
          results, and saves the matched tracks as a normal local playlist.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/55 transition-colors hover:text-foreground/75 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Import Playlist
        </button>
      </div>
    </form>
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
