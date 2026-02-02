"use client";

import { usePlaybackState, useQueue, useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { getTrackTitle, getTrackArtists } from "@/lib/api/utils";
import { Play, Pause, SkipForward } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo } from "react";

interface MiniPlayerProps {
  onExpand: () => void;
}

export function MiniPlayer({ onExpand }: MiniPlayerProps) {
  const { isPlaying, currentTime, duration } = usePlaybackState();
  const { currentTrack } = useQueue();
  const { togglePlayPause, playNext } = useAudioPlayer();

  const progress = useMemo(() => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const getCoverUrl = useCallback(() => {
    const coverId = currentTrack?.album?.cover || currentTrack?.album?.id;
    if (!coverId) return null;
    const formattedId = String(coverId).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/160x160.jpg`;
  }, [currentTrack]);

  const handlePlayPause = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      togglePlayPause();
    },
    [togglePlayPause]
  );

  const handleSkipNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      playNext();
    },
    [playNext]
  );

  if (!currentTrack) return null;

  const coverUrl = getCoverUrl();

  return (
    <div
      className="bg-black border-t border-white/10 cursor-pointer lg:hidden"
      onClick={onExpand}
      role="button"
      tabIndex={0}
      aria-label="Expand player"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onExpand();
        }
      }}
    >
      {/* Progress bar */}
      <div className="h-[2px] bg-white/10 w-full">
        <div
          className="h-full bg-white transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Player content */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Cover art */}
        {coverUrl ? (
          <div className="relative w-10 h-10 flex-shrink-0 bg-white/5 border border-white/10 overflow-hidden">
            <Image
              src={coverUrl}
              alt={getTrackTitle(currentTrack)}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 flex-shrink-0 bg-white/5 border border-white/10" />
        )}

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white/90 truncate">
            {getTrackTitle(currentTrack)}
          </div>
          <div className="text-xs text-white/50 truncate">
            {getTrackArtists(currentTrack)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePlayPause}
            className="w-11 h-11 flex items-center justify-center text-white active:bg-white/10 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={handleSkipNext}
            className="w-11 h-11 flex items-center justify-center text-white/60 active:bg-white/10 transition-colors"
            aria-label="Next track"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
