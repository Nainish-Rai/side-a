"use client";

import { usePlaybackState, useQueue, useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { getTrackTitle, getTrackArtists } from "@/lib/api/utils";
import { Play, Pause, SkipForward, SkipBack, Volume2, Repeat, Maximize2 } from "lucide-react";
import { motion, PanInfo, useAnimation } from "motion/react";
import Image from "next/image";
import { useCallback, useMemo } from "react";

interface MiniPlayerProps {
  onExpand: () => void;
}

const SWIPE_UP_THRESHOLD = -50; // Negative because up is negative Y

export function MiniPlayer({ onExpand }: MiniPlayerProps) {
  const { isPlaying, currentTime, duration } = usePlaybackState();
  const { currentTrack } = useQueue();
  const { togglePlayPause, playNext, playPrevious } = useAudioPlayer();
  const controls = useAnimation();

  const progress = useMemo(() => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCoverUrl = useCallback(() => {
    const coverId = currentTrack?.album?.cover || currentTrack?.album?.id;
    if (!coverId) return null;
    const formattedId = String(coverId).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/160x160.jpg`;
  }, [currentTrack]);

  const handlePlayPause = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      togglePlayPause();
    },
    [togglePlayPause]
  );

  const handleSkipNext = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      playNext();
    },
    [playNext]
  );

  const handleSkipPrevious = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      playPrevious();
    },
    [playPrevious]
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y < SWIPE_UP_THRESHOLD) {
        // Swipe up to expand
        controls.start({ y: -100, opacity: 0 }).then(() => {
          onExpand();
          // Reset position after expansion
          controls.set({ y: 0, opacity: 1 });
        });
      } else {
        // Snap back
        controls.start({ y: 0 });
      }
    },
    [controls, onExpand]
  );

  if (!currentTrack) return null;

  const coverUrl = getCoverUrl();

  return (
    <motion.div
      className="bg-background border-t border-foreground/10 lg:hidden relative"
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.5, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
    >
      {/* Single row layout matching screenshot */}
      <div className="flex items-center gap-2 px-2 py-2">
        {/* Cover art */}
        {coverUrl ? (
          <button
            onClick={onExpand}
            className="relative w-12 h-12 flex-shrink-0 bg-foreground/5 overflow-hidden"
          >
            <Image
              src={coverUrl}
              alt={getTrackTitle(currentTrack)}
              fill
              sizes="48px"
              className="object-cover"
            />
          </button>
        ) : (
          <button
            onClick={onExpand}
            className="w-12 h-12 flex-shrink-0 bg-foreground/5"
          />
        )}

        {/* Volume */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center text-foreground/40"
          aria-label="Volume"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        {/* Previous */}
        <button
          onClick={handleSkipPrevious}
          onTouchEnd={(e) => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center text-foreground/60"
          aria-label="Previous track"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        {/* Play/Pause - larger */}
        <button
          onClick={handlePlayPause}
          onTouchEnd={(e) => e.stopPropagation()}
          className="w-10 h-10 flex items-center justify-center bg-foreground text-background rounded-sm"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={handleSkipNext}
          onTouchEnd={(e) => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center text-foreground/60"
          aria-label="Next track"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>

        {/* Repeat */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center text-foreground/40"
          aria-label="Repeat"
        >
          <Repeat className="w-4 h-4" />
        </button>

        {/* Time display */}
        <div className="flex items-center gap-1 text-[10px] text-foreground/50 font-mono ml-auto">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Expand */}
        <button
          onClick={onExpand}
          className="w-8 h-8 flex items-center justify-center text-foreground/40"
          aria-label="Expand player"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
