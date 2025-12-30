"use client";

import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { getTrackTitle, getTrackArtists, formatTime } from "@/lib/api/utils";
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music2, ListMusic } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { useLyrics } from "@/hooks/useLyrics";

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenPlayer({ isOpen, onClose }: FullscreenPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    queue,
    currentQueueIndex,
    togglePlayPause,
    playNext,
    playPrev,
    seek,
    setVolume,
    toggleMute,
    removeFromQueue,
    setQueue,
  } = useAudioPlayer();

  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [activeTab, setActiveTab] = useState<"queue" | "lyrics">("queue");
  const seekBarRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Use lyrics hook
  const {
    lyrics,
    currentLineIndex,
    isLoading: lyricsLoading,
    hasLyrics,
  } = useLyrics(currentTrack, currentTime, isPlaying);

  const getCoverUrl = () => {
    const coverId = currentTrack?.album?.cover || currentTrack?.album?.id;
    if (!coverId) return null;
    const formattedId = String(coverId).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/640x640.jpg`;
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
    if (activeTab === "lyrics" && activeLineRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeLine = activeLineRef.current;

      requestAnimationFrame(() => {
        const containerHeight = container.clientHeight;
        const lineTop = activeLine.offsetTop;
        const lineHeight = activeLine.clientHeight;
        const targetScrollTop = lineTop - containerHeight / 2 + lineHeight / 2;

        container.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      });
    }
  }, [currentLineIndex, activeTab]);

  if (!isOpen || !currentTrack) return null;

  const coverUrl = getCoverUrl();
  const hasSyncedLyrics = Boolean(lyrics?.parsed && lyrics.parsed.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-100 bg-bone dark:bg-carbon"
          style={{ height: "100vh", overflow: "hidden" }}
        >
          {/* Header */}
          <div className="h-14 border-b border-gray-200 dark:border-gray-800 bg-bone/80 dark:bg-carbon/80 backdrop-blur-xl flex items-center justify-between px-6">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-carbon dark:text-bone" />
            </button>

            <div className="text-sm font-medium text-carbon dark:text-bone">
              Now Playing
            </div>

            <div className="w-8" />
          </div>

          {/* Main Content - Fixed height with no scroll */}
          <div className="flex h-[calc(100vh-56px)] overflow-hidden">
            {/* Left Side - Album Art & Controls */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
              <div className="w-full max-w-md space-y-6">
                {/* Album Art */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="relative max-w-80 mx-auto aspect-square rounded-lg overflow-hidden shadow-2xl"
                >
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={getTrackTitle(currentTrack)}
                      fill
                      className="object-cover"
                      unoptimized
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                      <Music2 className="w-24 h-24 text-gray-400" />
                    </div>
                  )}
                </motion.div>

                {/* Track Info */}
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-semibold text-carbon dark:text-bone truncate">
                    {getTrackTitle(currentTrack)}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 truncate">
                    {getTrackArtists(currentTrack)}
                  </p>
                  {currentTrack.album?.title && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 truncate">
                      {currentTrack.album.title}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div
                    ref={seekBarRef}
                    className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full cursor-pointer relative group"
                    onClick={handleSeekClick}
                    onMouseDown={handleSeekMouseDown}
                    onMouseMove={handleSeekMouseMove}
                    onMouseUp={handleSeekMouseUp}
                  >
                    <div
                      className="h-full bg-walkman-orange rounded-full relative transition-none"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-walkman-orange rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={playPrev}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Previous"
                  >
                    <SkipBack className="w-5 h-5 text-carbon dark:text-bone" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-walkman-orange hover:bg-[#ff8c61] text-white shadow-lg transition-all"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7" fill="white" />
                    ) : (
                      <Play className="w-7 h-7 ml-1" fill="white" />
                    )}
                  </button>

                  <button
                    onClick={playNext}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Next"
                  >
                    <SkipForward className="w-5 h-5 text-carbon dark:text-bone" />
                  </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleMute}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-carbon dark:text-bone" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-carbon dark:text-bone" />
                    )}
                  </button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume * 100}
                      onChange={(e) => setVolume(Number(e.target.value) / 100)}
                      className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none
                               [&::-webkit-slider-thumb]:w-3
                               [&::-webkit-slider-thumb]:h-3
                               [&::-webkit-slider-thumb]:bg-walkman-orange
                               [&::-webkit-slider-thumb]:rounded-full
                               [&::-webkit-slider-thumb]:cursor-pointer
                               [&::-moz-range-thumb]:w-3
                               [&::-moz-range-thumb]:h-3
                               [&::-moz-range-thumb]:bg-walkman-orange
                               [&::-moz-range-thumb]:rounded-full
                               [&::-moz-range-thumb]:border-0
                               [&::-moz-range-thumb]:cursor-pointer"
                      aria-label="Volume"
                    />
                  </div>
                  <span className="shrink-0 w-10 text-sm text-gray-500 dark:text-gray-500 text-right">
                    {Math.round((isMuted ? 0 : volume) * 100)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side - Queue/Lyrics */}
            <div className="w-[420px] border-l border-gray-200 dark:border-gray-800 flex flex-col bg-white/50 dark:bg-black/20 backdrop-blur-xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setActiveTab("queue")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative
                    ${activeTab === "queue"
                      ? "text-walkman-orange"
                      : "text-gray-600 dark:text-gray-400 hover:text-carbon dark:hover:text-bone"
                    }`}
                >
                  <ListMusic className="w-4 h-4" />
                  Queue
                  {activeTab === "queue" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-walkman-orange"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("lyrics")}
                  disabled={!hasLyrics}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative
                    ${activeTab === "lyrics"
                      ? "text-walkman-orange"
                      : hasLyrics
                        ? "text-gray-600 dark:text-gray-400 hover:text-carbon dark:hover:text-bone"
                        : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    }`}
                >
                  <Music2 className="w-4 h-4" />
                  Lyrics
                  {activeTab === "lyrics" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-walkman-orange"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden h-0">
                {activeTab === "queue" && (
                  <div className="h-full overflow-y-auto">
                    {queue.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <ListMusic className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-500">Queue is empty</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {queue.map((track, index) => {
                          const isCurrentTrack = index === currentQueueIndex;

                          return (
                            <div
                              key={`${track.id}-${index}`}
                              onClick={() => !isCurrentTrack && setQueue(queue, index)}
                              className={`group flex items-center gap-3 p-4 transition-colors
                                ${isCurrentTrack
                                  ? "bg-walkman-orange/5 dark:bg-walkman-orange/10"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                                }`}
                            >
                              {/* Track Number */}
                              <div className="shrink-0 w-6 text-center">
                                {isCurrentTrack ? (
                                  <div className="w-1.5 h-1.5 bg-walkman-orange rounded-full mx-auto animate-pulse" />
                                ) : (
                                  <span className="text-xs text-gray-500 dark:text-gray-500">
                                    {index + 1}
                                  </span>
                                )}
                              </div>

                              {/* Track Info */}
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm truncate ${
                                  isCurrentTrack
                                    ? "text-walkman-orange font-medium"
                                    : "text-carbon dark:text-bone"
                                }`}>
                                  {getTrackTitle(track)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                  {getTrackArtists(track)}
                                </div>
                              </div>

                              {/* Duration */}
                              <div className="shrink-0 text-xs text-gray-500 dark:text-gray-500">
                                {formatTime(track.duration || 0)}
                              </div>

                              {/* Remove Button */}
                              {!isCurrentTrack && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromQueue(index);
                                  }}
                                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full
                                           opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-800
                                           transition-all duration-150"
                                  aria-label="Remove from queue"
                                >
                                  <X className="w-3.5 h-3.5 text-gray-500" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "lyrics" && (
                  <div ref={lyricsContainerRef} className="h-full overflow-y-auto px-6 py-8">
                    {lyricsLoading && (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-walkman-orange rounded-full animate-spin mb-4" />
                        <p className="text-sm text-gray-500 dark:text-gray-500">Loading lyrics...</p>
                      </div>
                    )}

                    {!lyricsLoading && !hasLyrics && (
                      <div className="flex flex-col items-center justify-center h-full">
                        <Music2 className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-500">No lyrics available</p>
                      </div>
                    )}

                    {hasSyncedLyrics && lyrics?.parsed && (
                      <div className="space-y-6 py-8">
                        {lyrics.parsed.map((line, index) => {
                          const isActive = index === currentLineIndex;
                          const isPast = index < currentLineIndex;

                          return (
                            <motion.div
                              key={index}
                              ref={isActive ? activeLineRef : null}
                              initial={{ opacity: 0.3 }}
                              animate={{
                                opacity: isActive ? 1 : isPast ? 0.4 : 0.3,
                                scale: isActive ? 1.05 : 1,
                              }}
                              transition={{ duration: 0.3 }}
                              onClick={() => seek(line.time)}
                              className={`cursor-pointer text-center transition-all duration-300
                                ${isActive
                                  ? "text-xl font-semibold text-walkman-orange"
                                  : "text-base text-gray-600 dark:text-gray-400 hover:text-carbon dark:hover:text-bone"
                                }`}
                            >
                              {line.text}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {!hasSyncedLyrics && lyrics?.lyrics && (
                      <div className="text-sm leading-relaxed text-carbon dark:text-bone whitespace-pre-wrap">
                        {lyrics.lyrics}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
