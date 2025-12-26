"use client";

import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { formatTime, getTrackTitle, getTrackArtists } from "@/lib/api/utils";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useRef, useEffect, useState } from "react";

export function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
  } = useAudioPlayer();

  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    seek(newTime);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressBarRef.current || duration === 0) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;

    seek(newTime);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging]);

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bone border-t border-carbon z-50 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      {/* Progress Bar - Clean Spotify Style */}
      <div
        ref={progressBarRef}
        className="h-1 bg-gray-300 cursor-pointer relative group"
        onClick={handleProgressClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          className="h-full bg-carbon transition-none relative"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-carbon rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Single Row Layout */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          
          {/* Left: Track Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-carbon hover:bg-walkman-orange
                         transition-colors duration-200 flex items-center justify-center
                         shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]
                         hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]
                         active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" fill="white" />
              ) : (
                <Play className="w-5 h-5 ml-0.5 text-white" fill="white" />
              )}
            </button>

            {/* Track Details */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate text-carbon font-mono">
                {getTrackTitle(currentTrack)}
              </div>
              <div className="text-xs text-gray-600 truncate font-mono">
                {getTrackArtists(currentTrack)}
              </div>
            </div>
          </div>

          {/* Center: Time Display */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-xs font-mono tabular-nums text-carbon">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-gray-400">/</div>
            <div className="text-xs font-mono tabular-nums text-gray-500">
              {formatTime(duration)}
            </div>
          </div>

          {/* Right: Volume Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="w-8 h-8 flex items-center justify-center hover:bg-white
                         rounded transition-colors duration-150"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-carbon" />
              ) : (
                <Volume2 className="w-4 h-4 text-carbon" />
              )}
            </button>

            {/* Volume Slider */}
            <div className="w-24 group">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume * 100}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                className="w-full h-1 bg-gray-300 appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-3
                           [&::-webkit-slider-thumb]:h-3
                           [&::-webkit-slider-thumb]:bg-carbon
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:opacity-0
                           [&::-webkit-slider-thumb]:group-hover:opacity-100
                           [&::-webkit-slider-thumb]:transition-opacity
                           [&::-moz-range-thumb]:w-3
                           [&::-moz-range-thumb]:h-3
                           [&::-moz-range-thumb]:bg-carbon
                           [&::-moz-range-thumb]:rounded-full
                           [&::-moz-range-thumb]:border-0
                           [&::-moz-range-thumb]:cursor-pointer
                           [&::-webkit-slider-runnable-track]:bg-carbon
                           [&::-webkit-slider-runnable-track]:h-1"
                style={{
                  background: `linear-gradient(to right, #101010 0%, #101010 ${isMuted ? 0 : volume * 100}%, #d1d5db ${isMuted ? 0 : volume * 100}%, #d1d5db 100%)`
                }}
                aria-label="Volume"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
