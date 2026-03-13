"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  GripVertical,
  ListMusic,
  Music2,
  Pencil,
  Play,
  Shuffle,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAudioPlayer, useQueue } from "@/contexts/AudioPlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
import {
  PlaylistDeleteDialog,
  PlaylistEditorDialog,
} from "@/components/playlists/PlaylistDialogs";
import { getPlaylistCoverUrl, getPlaylistDuration } from "@/components/playlists/playlist-utils";
import { formatDuration, formatTime, getTrackArtists, getTrackTitle } from "@/lib/api/utils";

function shuffleTracks<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

interface PlaylistDetailClientProps {
  playlistId: string;
}

interface SortablePlaylistTrackProps {
  id: number;
  track: NonNullable<ReturnType<typeof useLibrary>["playlists"]>[number]["tracks"][number];
  index: number;
  isCurrent: boolean;
  onPlay: () => void;
  onRemove: () => void;
}

function SortablePlaylistTrack({
  id,
  track,
  index,
  isCurrent,
  onPlay,
  onRemove,
}: SortablePlaylistTrackProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const coverId = track.album?.cover || track.album?.id;
  const coverUrl = coverId
    ? `https://resources.tidal.com/images/${String(coverId).replace(/-/g, "/")}/160x160.jpg`
    : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`grid grid-cols-[24px_40px_1fr_90px_72px_24px] items-center gap-4 border-b border-foreground/10 px-6 py-3 ${
        isCurrent
          ? "border-l-[3px] border-l-foreground pl-[21px]"
          : "border-l-[3px] border-l-transparent"
      } ${isDragging ? "opacity-50" : "hover:bg-foreground/[0.02]"}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none text-foreground/30 transition-colors hover:text-foreground/60"
        aria-label="Reorder track"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onPlay}
        className="relative h-10 w-10 overflow-hidden border border-foreground/10 bg-foreground/5"
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={track.album?.title || getTrackTitle(track)}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Music2 className="h-4 w-4 text-foreground/25" />
          </span>
        )}
      </button>
      <button type="button" onClick={onPlay} className="min-w-0 text-left">
        <span className="block truncate text-[13px] font-medium text-foreground/90">
          {String(index + 1).padStart(2, "0")} {getTrackTitle(track)}
        </span>
        <span className="block truncate text-[12px] text-foreground/50">
          {getTrackArtists(track)}
        </span>
      </button>
      <div className="truncate text-right text-[12px] text-foreground/35">
        {track.album?.title || "-"}
      </div>
      <div className="text-right text-[12px] font-mono text-foreground/40 tabular-nums">
        {formatTime(track.duration || 0)}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-foreground/30 transition-colors hover:text-foreground/75"
        aria-label="Remove track"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PlaylistDetailClient({ playlistId }: PlaylistDetailClientProps) {
  const router = useRouter();
  const { currentTrack } = useQueue();
  const { setQueue } = useAudioPlayer();
  const {
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
  } = useLibrary();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const playlist = getPlaylistById(playlistId);
  const trackIds = useMemo(() => playlist?.tracks.map((track) => track.id) || [], [playlist]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (!playlist) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-6 py-24">
          <div className="border border-foreground/10 px-10 py-14 text-center">
            <ListMusic className="mx-auto h-8 w-8 text-foreground/20" />
            <p className="mt-4 text-sm font-mono uppercase tracking-widest text-foreground/90">
              Playlist Not Found
            </p>
            <Link
              href="/playlists"
              className="mt-4 inline-block text-[10px] font-mono uppercase tracking-widest text-foreground/40 transition-colors hover:text-foreground/70"
            >
              Return to playlists
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coverUrl = getPlaylistCoverUrl(playlist);
  const totalDuration = getPlaylistDuration(playlist);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => router.push("/playlists")}
            className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground/45 transition-colors hover:text-foreground/75"
          >
            <ArrowLeft className="h-4 w-4" />
            Playlists
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-2 border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/60 transition-colors hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex items-center gap-2 border border-foreground/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-foreground/60 transition-colors hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <section className="grid gap-8 border-b border-foreground/10 pb-8 md:grid-cols-[240px_1fr]">
          <div className="relative aspect-square overflow-hidden border border-foreground/10 bg-foreground/5">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={playlist.name}
                fill
                sizes="240px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ListMusic className="h-12 w-12 text-foreground/20" />
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/35">
                Local Playlist
              </p>
              <h1 className="mt-2 text-3xl font-semibold uppercase tracking-[0.04em] text-foreground/92">
                {playlist.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/55">
                {playlist.description || "No description set."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6 border-t border-foreground/10 pt-4">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-foreground/35">
                  Tracks
                </p>
                <p className="mt-1 text-sm font-mono tabular-nums text-foreground/70">
                  {playlist.tracks.length}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-foreground/35">
                  Duration
                </p>
                <p className="mt-1 text-sm font-mono tabular-nums text-foreground/70">
                  {formatDuration(totalDuration)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-foreground/35">
                  Updated
                </p>
                <p className="mt-1 text-sm font-mono tabular-nums text-foreground/70">
                  {new Date(playlist.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (playlist.tracks.length === 0) {
                    toast.error("TAPE EMPTY");
                    return;
                  }
                  void setQueue(playlist.tracks, 0);
                }}
                className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-background transition-opacity hover:opacity-90"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Play Playlist
                </button>
              <button
                type="button"
                onClick={() => {
                  if (playlist.tracks.length === 0) {
                    toast.error("TAPE EMPTY");
                    return;
                  }

                  const shuffledTracks = shuffleTracks(playlist.tracks);
                  void setQueue(shuffledTracks, 0);
                  toast.success("SHUFFLE MODE ACTIVE");
                }}
                className="inline-flex items-center gap-2 border border-foreground/20 px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-foreground/65 transition-colors hover:text-foreground"
              >
                <Shuffle className="h-3.5 w-3.5" />
                Shuffle Playlist
              </button>
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/35">
                Drag rows to reorder
              </p>
            </div>
          </div>
        </section>

        <section className="pt-8">
          <div className="border-t border-foreground/10">
            <div className="sticky top-[73px] z-20 border-b border-foreground/10 bg-background/95 backdrop-blur-xl">
              <div className="grid grid-cols-[24px_40px_1fr_90px_72px_24px] gap-4 px-6 py-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Move
                </span>
                <span />
                <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Track
                </span>
                <span className="text-right text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Album
                </span>
                <span className="text-right text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Time
                </span>
                <span />
              </div>
            </div>

            {playlist.tracks.length === 0 ? (
              <div className="border-b border-foreground/10 px-8 py-14 text-center">
                <ListMusic className="mx-auto h-8 w-8 text-foreground/20" />
                <p className="mt-4 text-sm font-mono uppercase tracking-widest text-foreground/90">
                  No Tracks Yet
                </p>
                <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-foreground/40">
                  Use add-to-playlist from any track row to populate this list.
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;
                  reorderPlaylistTracks(playlist.id, Number(active.id), Number(over.id));
                }}
              >
                <SortableContext items={trackIds} strategy={verticalListSortingStrategy}>
                  {playlist.tracks.map((track, index) => (
                    <SortablePlaylistTrack
                      key={`${track.id}-${index}`}
                      id={track.id}
                      track={track}
                      index={index}
                      isCurrent={currentTrack?.id === track.id}
                      onPlay={() => void setQueue(playlist.tracks, index)}
                      onRemove={() => removeTrackFromPlaylist(playlist.id, track.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </section>
      </div>

      <PlaylistEditorDialog
        isOpen={isEditOpen}
        mode="edit"
        playlist={playlist}
        onClose={() => setIsEditOpen(false)}
        onSubmit={(values) => {
          updatePlaylist(playlist.id, values);
          toast.success("TAPE REWINDED");
        }}
      />
      <PlaylistDeleteDialog
        isOpen={isDeleteOpen}
        playlist={playlist}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          deletePlaylist(playlist.id);
          toast.success("TAPE EJECTED");
          router.push("/playlists");
        }}
      />
    </div>
  );
}
