"use client";

import { useAudioPlayer, usePlaybackState, useQueue } from "@/contexts/AudioPlayerContext";
import { getTrackTitle, getTrackArtists, formatTime } from "@/lib/api/utils";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music2,
  Shuffle,
  Repeat,
  Repeat1,
  ChevronLeft,
  GripVertical
} from "lucide-react";
import { motion, AnimatePresence, PanInfo, useAnimation } from "motion/react";
import Image from "next/image";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLyrics } from "@/hooks/useLyrics";
import { LyricsPanel } from "./LyricsPanel";
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

interface FullscreenPlayerProps {
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
}

function SortableQueueItem({ id, track, index, isCurrent, onPlay }: SortableQueueItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 border-b border-foreground/10 bg-background ${
        isCurrent
          ? "border-l-2 border-l-foreground pl-[10px] bg-foreground/[0.03]"
          : "hover:bg-foreground/[0.02] border-l-2 border-l-transparent"
      } ${isDragging ? "opacity-50 z-50" : ""}`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none p-1 text-foreground/30 hover:text-foreground/60 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Small Art */}
      <div
        onClick={onPlay}
        className="relative w-10 h-10 shrink-0 bg-foreground/5 border border-foreground/10 overflow-hidden cursor-pointer"
      >
        {track.album?.cover ? (
          <Image
            src={`https://resources.tidal.com/images/${String(track.album.cover).replace(/-/g, "/")}/320x320.jpg`}
            alt=""
            fill
            sizes="40px"
            quality={75}
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <Music2 className="w-4 h-4 text-foreground/20 m-auto" />
        )}
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onPlay}>
        <div
          className={`text-sm font-medium truncate ${
            isCurrent ? "text-foreground" : "text-foreground/90"
          }`}
        >
          {getTrackTitle(track)}
        </div>
        <div className="text-xs text-foreground/50 truncate">
          {getTrackArtists(track)}
        </div>
      </div>

      <div className="text-[11px] font-mono text-foreground/40 tabular-nums">
        {formatTime(track.duration || 0)}
      </div>
    </div>
  );
}

export function FullscreenPlayer({ isOpen, onClose }: FullscreenPlayerProps) {
  // Use split contexts for state
  const { isPlaying, currentTime, duration, volume, isMuted } = usePlaybackState();
  const {
    currentTrack,
    queue,
    currentQueueIndex,
    shuffleActive,
    repeatMode,
  } = useQueue();

  // Still need AudioPlayerContext for methods
  const {
    togglePlayPause,
    playNext,
    playPrev,
    seek,
    setVolume,
    toggleMute,
    setQueue,
    reorderQueue,
    toggleShuffle,
    toggleRepeat,
  } = useAudioPlayer();

  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [activeTab, setActiveTab] = useState<"queue" | "lyrics">("queue");
  const seekBarRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Swipe gesture controls
  const controls = useAnimation();
  const albumArtControls = useAnimation();
  const SWIPE_THRESHOLD = 100;
  const HORIZONTAL_SWIPE_THRESHOLD = 80;

  const handleSwipeEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > SWIPE_THRESHOLD) {
        // Swipe down to close
        controls.start({ y: "100%", opacity: 0 }).then(onClose);
      } else {
        // Snap back
        controls.start({ y: 0, opacity: 1 });
      }
    },
    [controls, onClose]
  );

  // Handle horizontal swipe on album art for prev/next track
  const handleAlbumArtSwipeEnd = useCallback(
    async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;

      if (Math.abs(offset.x) > HORIZONTAL_SWIPE_THRESHOLD || Math.abs(velocity.x) > 500) {
        if (offset.x > 0) {
          // Swipe right = previous track
          await albumArtControls.start({ x: 300, opacity: 0 });
          playPrev();
          albumArtControls.set({ x: -300, opacity: 0 });
          await albumArtControls.start({ x: 0, opacity: 1 });
        } else {
          // Swipe left = next track
          await albumArtControls.start({ x: -300, opacity: 0 });
          playNext();
          albumArtControls.set({ x: 300, opacity: 0 });
          await albumArtControls.start({ x: 0, opacity: 1 });
        }
      } else {
        // Snap back
        albumArtControls.start({ x: 0 });
      }
    },
    [albumArtControls, playPrev, playNext]
  );

  // Reset animation when opening
  useEffect(() => {
    if (isOpen) {
      controls.set({ y: 0, opacity: 1 });
      albumArtControls.set({ x: 0, opacity: 1 });
    }
  }, [isOpen, controls, albumArtControls]);

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

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Use lyrics hook
  const {
    lyrics,
    currentLineIndex,
    isLoading: lyricsLoading,
    hasLyrics,
  } = useLyrics(currentTrack, currentTime, isPlaying);

  // Switch to queue tab if no lyrics available
  useEffect(() => {
    if (!lyricsLoading && !hasLyrics && activeTab === "lyrics") {
      setActiveTab("queue");
    }
  }, [hasLyrics, lyricsLoading, activeTab]);

  const getCoverUrl = (size: "large" | "thumb" = "large") => {
    const coverId = currentTrack?.album?.cover || currentTrack?.album?.id;
    if (!coverId) return null;
    const formattedId = String(coverId).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/${size === "large" ? "1280x1280" : "640x640"}.jpg`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || duration === 0) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    seek(newTime);
  };

  const handleSeekMouseDown = () => setIsDraggingSeek(true);
  const handleSeekMouseUp = () => setIsDraggingSeek(false);
  const handleSeekMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSeek || !seekBarRef.current || duration === 0) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    seek(newTime);
  };

  // Auto-scroll to active lyrics line
  useEffect(() => {
    if (activeTab === "lyrics" && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLineIndex, activeTab]);

  if (!currentTrack) return null;

  const coverUrl = getCoverUrl("large");
  const hasSyncedLyrics = Boolean(lyrics?.parsed && lyrics.parsed.length > 0);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={controls}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ duration: 0.3, ease: "circOut" }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={handleSwipeEnd}
          className="fixed inset-0 z-[100] bg-background text-foreground overflow-hidden flex flex-col touch-pan-x"
        >
          {/* Header - Brutalist Style */}
          <div className="relative z-10 border-b border-foreground/10 px-6 py-4 md:px-8">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-xs font-mono uppercase tracking-widest hidden sm:block">Back</span>
              </button>

              {/* Tab Navigation - Underline Style */}
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab("queue")}
                  className={`relative pb-2 text-xs font-mono uppercase tracking-widest transition-all ${
                    activeTab === "queue"
                      ? "text-foreground"
                      : "text-foreground/40 hover:text-foreground/70"
                  }`}
                >
                  Queue
                  {activeTab === "queue" && (
                    <motion.div
                      layoutId="playerTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
                {hasLyrics && (
                  <button
                    onClick={() => setActiveTab("lyrics")}
                    className={`relative pb-2 text-xs font-mono uppercase tracking-widest transition-all ${
                      activeTab === "lyrics"
                        ? "text-foreground"
                        : "text-foreground/40 hover:text-foreground/70"
                    }`}
                  >
                    Lyrics
                    {activeTab === "lyrics" && (
                      <motion.div
                        layoutId="playerTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors sm:hidden"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-8 hidden sm:block"></div>
            </div>
          </div>

          {/* Main Content - Flexbox Layout */}
          <div className="relative z-10 flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 lg:px-12 flex flex-col lg:flex-row gap-8 lg:gap-16 overflow-y-auto">

            {/* Left Box: Album Art & Controls - Centered */}
            <div className="flex flex-col items-center justify-center w-full lg:w-1/2 lg:sticky lg:top-0 lg:h-[calc(100vh-12rem)]">
              <div className="flex flex-col items-center space-y-6 lg:space-y-8 w-full max-w-[400px]">

                {/* Album Art Container - Swipeable for prev/next on mobile */}
                <motion.div
                  className="relative aspect-square w-full max-w-[280px] md:max-w-[360px] border border-foreground/10 overflow-hidden bg-foreground/5 cursor-grab active:cursor-grabbing touch-pan-y"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleAlbumArtSwipeEnd}
                  animate={albumArtControls}
                  whileTap={{ scale: 0.98 }}
                >
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={getTrackTitle(currentTrack)}
                      fill
                      sizes="(max-width: 768px) 80vw, 420px"
                      quality={90}
                      className="object-cover pointer-events-none"
                      priority={true}
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
                      <Music2 className="w-24 h-24 text-foreground/20" />
                    </div>
                  )}
                  {/* Swipe hint on mobile */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 lg:hidden">
                    <div className="w-1 h-1 bg-foreground/30 rounded-full" />
                    <div className="w-1 h-1 bg-foreground/30 rounded-full" />
                    <div className="w-1 h-1 bg-foreground/30 rounded-full" />
                  </div>
                </motion.div>

                {/* Track Info & Progress */}
                <div className="space-y-4 lg:space-y-6 w-full">
                {/* Track Info */}
                <div className="space-y-2">
                  <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono">
                    Now Playing
                  </div>
                  <h1 className="text-xl md:text-2xl font-medium text-foreground/90 leading-tight line-clamp-2">
                    {getTrackTitle(currentTrack)}
                  </h1>
                  <p className="text-sm md:text-base text-foreground/50 line-clamp-1">
                    {getTrackArtists(currentTrack)}
                  </p>
                </div>

                {/* Progress Bar - Touch-friendly with 48px touch area */}
                <div className="space-y-2">
                  <div
                    ref={seekBarRef}
                    className="relative py-5 -my-4 cursor-pointer group"
                    onClick={handleSeekClick}
                    onMouseDown={handleSeekMouseDown}
                    onMouseMove={handleSeekMouseMove}
                    onMouseUp={handleSeekMouseUp}
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      const rect = seekBarRef.current?.getBoundingClientRect();
                      if (rect && duration > 0) {
                        const x = touch.clientX - rect.left;
                        const percentage = Math.max(0, Math.min(1, x / rect.width));
                        seek(percentage * duration);
                      }
                    }}
                    onTouchMove={(e) => {
                      const touch = e.touches[0];
                      const rect = seekBarRef.current?.getBoundingClientRect();
                      if (rect && duration > 0) {
                        const x = touch.clientX - rect.left;
                        const percentage = Math.max(0, Math.min(1, x / rect.width));
                        seek(percentage * duration);
                      }
                    }}
                  >
                    <div className="h-2 bg-foreground/20 relative overflow-hidden">
                      <div
                        className="h-full bg-foreground relative"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    {/* Thumb indicator */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity"
                      style={{ left: `calc(${progressPercentage}% - 8px)` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-foreground/40 font-mono tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main Controls - Touch-optimized with 48px targets */}
                <div className="flex items-center justify-center gap-4 md:gap-8 pt-4">
                  <button
                    onClick={toggleShuffle}
                    className={`w-12 h-12 flex items-center justify-center transition-colors active:scale-95 ${
                      shuffleActive ? "text-foreground" : "text-foreground/40 hover:text-foreground/70"
                    }`}
                    aria-label={shuffleActive ? "Disable shuffle" : "Enable shuffle"}
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={playPrev}
                    className="w-12 h-12 flex items-center justify-center text-foreground/70 hover:text-foreground active:scale-95 transition-all"
                    aria-label="Previous track"
                  >
                    <SkipBack className="w-7 h-7 fill-current" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="w-16 h-16 flex items-center justify-center border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background active:scale-95 transition-all"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7 fill-current" />
                    ) : (
                      <Play className="w-7 h-7 ml-0.5 fill-current" />
                    )}
                  </button>

                  <button
                    onClick={playNext}
                    className="w-12 h-12 flex items-center justify-center text-foreground/70 hover:text-foreground active:scale-95 transition-all"
                    aria-label="Next track"
                  >
                    <SkipForward className="w-7 h-7 fill-current" />
                  </button>

                  <button
                    onClick={toggleRepeat}
                    className={`w-12 h-12 flex items-center justify-center transition-colors active:scale-95 ${
                      repeatMode !== 'off' ? "text-foreground" : "text-foreground/40 hover:text-foreground/70"
                    }`}
                    aria-label={repeatMode === 'off' ? "Enable repeat" : repeatMode === 'all' ? "Repeat one" : "Disable repeat"}
                  >
                    {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                  </button>
                </div>

                {/* Volume - Desktop Only */}
                <div className="hidden lg:flex items-center gap-3 pt-2 border-t border-foreground/10">
                  <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono pt-3">
                    Volume
                  </div>
                  <div className="flex-1 flex items-center gap-3 pt-3">
                    <button onClick={toggleMute} className="text-foreground/40 hover:text-foreground/70 transition-colors">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume * 100}
                      onChange={(e) => setVolume(Number(e.target.value) / 100)}
                      className="flex-1 h-1 bg-foreground/20 appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none
                               [&::-webkit-slider-thumb]:w-3
                               [&::-webkit-slider-thumb]:h-3
                               [&::-webkit-slider-thumb]:bg-foreground
                               [&::-webkit-slider-thumb]:opacity-0
                               [&::-webkit-slider-thumb]:hover:opacity-100"
                    />
                    <span className="text-xs font-mono tabular-nums text-foreground/40 w-8 text-right">
                      {Math.round(isMuted ? 0 : volume * 100)}
                    </span>
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Right Box: Queue or Lyrics - Brutalist Style */}
            <div className="hidden lg:flex flex-col w-full lg:w-1/2 max-h-[calc(100vh-12rem)] overflow-hidden border-l border-foreground/10 pl-8">
              {activeTab === "queue" && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="h-full overflow-y-auto pr-4">
                    <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono mb-4 sticky top-0 bg-background pt-2 pb-2 z-10 flex items-center justify-between">
                      <span>Up Next ({queue.length - currentQueueIndex - 1})</span>
                      <span className="text-foreground/30">Drag to reorder</span>
                    </div>
                    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                      {queue.map((track, index) => (
                        <SortableQueueItem
                          key={sortableIds[index]}
                          id={sortableIds[index]}
                          track={track}
                          index={index}
                          isCurrent={index === currentQueueIndex}
                          onPlay={() => index !== currentQueueIndex && setQueue(queue, index)}
                        />
                      ))}
                    </SortableContext>
                  </div>
                </DndContext>
              )}

              {activeTab === "lyrics" && (
                <LyricsPanel
                  track={currentTrack}
                  lyrics={lyrics}
                  currentLineIndex={currentLineIndex}
                  isLoading={lyricsLoading}
                  onSeek={seek}
                  className="h-full"
                />
              )}
            </div>

            {/* Mobile Tab Content - Brutalist Style */}
            <div className="lg:hidden mt-6 border-t border-foreground/10 pt-4">
                 <div className="flex justify-center">
                    {activeTab === 'lyrics' ? (
                         hasSyncedLyrics && lyrics?.parsed?.[currentLineIndex] ? (
                             <div className="text-center px-4">
                               <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono mb-2">
                                 Current Line
                               </div>
                               <p className="text-sm text-foreground/90">
                                 {lyrics.parsed[currentLineIndex].text}
                               </p>
                             </div>
                         ) : (
                           <p className="text-xs text-foreground/40 font-mono uppercase tracking-wider">No Lyrics Available</p>
                         )
                    ) : (
                      <div className="text-center">
                        <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono mb-1">
                          Up Next
                        </div>
                        <p className="text-sm text-foreground/70 font-mono tabular-nums">
                          {queue.length - currentQueueIndex - 1} tracks
                        </p>
                      </div>
                    )}
                 </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document root level
  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
}
