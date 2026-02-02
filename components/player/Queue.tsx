"use client";

import { useAudioPlayer, useQueue } from "@/contexts/AudioPlayerContext";
import { getTrackTitle, getTrackArtists, formatTime } from "@/lib/api/utils";
import { X, Music, GripVertical } from "lucide-react";
import { useMemo, useCallback } from "react";
import Image from "next/image";
import type { Track } from "@/lib/api/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface QueueProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sortable item component
interface SortableQueueItemProps {
  id: string;
  track: Track;
  index: number;
  isCurrent: boolean;
  onPlay: () => void;
  onRemove: () => void;
}

function SortableQueueItem({ id, track, index, isCurrent, onPlay, onRemove }: SortableQueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getCoverUrl = () => {
    const coverId = track?.album?.cover || track?.album?.id;
    if (!coverId) return null;
    const formattedId = String(coverId).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/160x160.jpg`;
  };

  const coverUrl = getCoverUrl();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative p-3 bg-background border transition-all duration-150 ${
        isCurrent
          ? "border-foreground border-2"
          : "border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5"
      } ${isDragging ? "opacity-50 z-50" : ""}`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="touch-none p-1 text-foreground/30 hover:text-foreground/60 cursor-grab active:cursor-grabbing flex-shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Track Number / Playing Indicator */}
        <div className="flex-shrink-0 w-6 text-xs font-mono text-foreground/40">
          {isCurrent ? (
            <div className="w-3 h-3 bg-foreground animate-pulse" />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>

        {/* Cover Art */}
        {coverUrl && (
          <div
            onClick={onPlay}
            className="relative w-10 h-10 flex-shrink-0 overflow-hidden bg-foreground/5 cursor-pointer"
          >
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes="40px"
              quality={75}
              className="object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Track Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onPlay}>
          <div
            className={`text-sm font-mono truncate ${
              isCurrent ? "text-foreground font-bold" : "text-foreground"
            }`}
          >
            {getTrackTitle(track)}
          </div>
          <div className="text-xs text-foreground/60 truncate font-mono mt-0.5">
            {getTrackArtists(track)}
          </div>
        </div>

        {/* Duration */}
        <div className="text-[11px] font-mono text-foreground/40 tabular-nums flex-shrink-0">
          {formatTime(track.duration || 0)}
        </div>

        {/* Remove Button */}
        {!isCurrent && (
          <button
            onClick={onRemove}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center
                       opacity-0 group-hover:opacity-100 hover:bg-foreground/10
                       transition-all duration-150"
            aria-label="Remove from queue"
          >
            <X className="w-4 h-4 text-foreground/50 hover:text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

export function Queue({ isOpen, onClose }: QueueProps) {
  const { queue, currentQueueIndex } = useQueue();
  const { removeFromQueue, clearQueue, reorderQueue, setQueue } = useAudioPlayer();

  // Create unique IDs for sortable items (track.id + index to handle duplicates)
  const sortableIds = useMemo(() =>
    queue.map((track, index) => `${track.id}-${index}`),
    [queue]
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortableIds.indexOf(active.id as string);
      const newIndex = sortableIds.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newQueue = arrayMove([...queue], oldIndex, newIndex);

        // Calculate new current index
        let newCurrentIndex = currentQueueIndex;
        if (oldIndex === currentQueueIndex) {
          newCurrentIndex = newIndex;
        } else if (oldIndex < currentQueueIndex && newIndex >= currentQueueIndex) {
          newCurrentIndex = currentQueueIndex - 1;
        } else if (oldIndex > currentQueueIndex && newIndex <= currentQueueIndex) {
          newCurrentIndex = currentQueueIndex + 1;
        }

        // Use reorderQueue to avoid interrupting playback
        reorderQueue(newQueue, newCurrentIndex);
      }
    }
  }, [queue, sortableIds, currentQueueIndex, reorderQueue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-end justify-end">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close queue"
      />

      <div className="relative bg-background border-l border-foreground w-full max-w-md h-full md:h-[600px] shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="border-b border-foreground p-4 bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-mono font-bold text-foreground tracking-tight">
                QUEUE
              </h2>
              <p className="text-xs font-mono text-foreground/50 mt-1">
                {queue.length} {queue.length === 1 ? "track" : "tracks"} · Drag to reorder
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-foreground/5
                         transition-colors duration-150"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="mt-3 px-4 py-1.5 text-xs font-mono tracking-wide
                         bg-foreground text-background hover:opacity-80
                         transition-opacity duration-200"
            >
              CLEAR QUEUE
            </button>
          )}
        </div>

        {/* Queue List */}
        <div className="overflow-y-auto h-[calc(100%-120px)]">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Music className="w-12 h-12 text-foreground/20 mb-3" />
              <p className="text-sm font-mono text-foreground/50">
                Queue is empty
              </p>
              <p className="text-xs font-mono text-foreground/40 mt-1">
                Add tracks to start playing
              </p>
            </div>
          ) : (
            <div className="p-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {queue.map((track, index) => (
                      <SortableQueueItem
                        key={sortableIds[index]}
                        id={sortableIds[index]}
                        track={track}
                        index={index}
                        isCurrent={index === currentQueueIndex}
                        onPlay={() => index !== currentQueueIndex && setQueue(queue, index)}
                        onRemove={() => removeFromQueue(index)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
