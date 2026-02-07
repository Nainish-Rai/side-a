"use client";

import { usePlaybackState, useQueue, useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { getTrackTitle, getTrackArtists } from "@/lib/api/utils";
import { Play, Pause, SkipForward, ChevronUp } from "lucide-react";
import { motion, PanInfo, useAnimation } from "motion/react";
import Image from "next/image";
import { useCallback } from "react";

interface MiniPlayerProps {
  onExpand: () => void;
}

const SWIPE_UP_THRESHOLD = -50; // Negative because up is negative Y

export function MiniPlayer({ onExpand }: MiniPlayerProps) {
  const { isPlaying } = usePlaybackState();
  const { currentTrack } = useQueue();
  const { togglePlayPause, playNext } = useAudioPlayer();
  const controls = useAnimation();

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
      <div className="flex items-center gap-3 px-3 py-2">
        {/* Cover art */}
        {coverUrl ? (
          <button
            onClick={onExpand}
            className="relative w-10 h-10 flex-shrink-0 bg-foreground/5 border border-foreground/10 overflow-hidden"
          >
            <Image
              src={coverUrl}
              alt={getTrackTitle(currentTrack)}
              fill
              sizes="40px"
              className="object-cover"
            />
          </button>
        ) : (
          <button
            onClick={onExpand}
            className="w-10 h-10 flex-shrink-0 bg-foreground/5 border border-foreground/10"
          />
        )}

        {/* Title & Artist */}
        <button onClick={onExpand} className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-medium text-foreground/90 truncate leading-tight">
            {getTrackTitle(currentTrack)}
          </p>
          <p className="text-[11px] text-foreground/50 truncate leading-tight">
            {getTrackArtists(currentTrack)}
          </p>
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          onTouchEnd={(e) => e.stopPropagation()}
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-foreground text-background"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={handleSkipNext}
          onTouchEnd={(e) => e.stopPropagation()}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-foreground/60"
          aria-label="Next track"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>

        {/* Expand */}
        <button
          onClick={onExpand}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-foreground/40"
          aria-label="Expand player"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
