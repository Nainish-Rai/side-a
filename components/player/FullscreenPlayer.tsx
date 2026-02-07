"use client";

import { useAudioPlayer, usePlaybackState, useQueue } from "@/contexts/AudioPlayerContext";
import { getTrackTitle, getTrackArtists, formatTime } from "@/lib/api/utils";
import {
  ChevronDown,
  MoreVertical,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Music2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLyrics } from "@/hooks/useLyrics";
import type { Track } from "@/lib/api/types";

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "upnext" | "lyrics" | "related";

export function FullscreenPlayer({ isOpen, onClose }: FullscreenPlayerProps) {
  const { isPlaying, currentTime, duration } = usePlaybackState();
  const { currentTrack, queue, currentQueueIndex, shuffleActive, repeatMode } = useQueue();
  const {
    togglePlayPause,
    playNext,
    playPrev,
    seek,
    setQueue,
    toggleShuffle,
    toggleRepeat,
  } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<Tab>("upnext");
  const [autoPlay, setAutoPlay] = useState(true);
  const seekBarRef = useRef<HTMLDivElement>(null);

  const {
    lyrics,
    currentLineIndex,
    isLoading: lyricsLoading,
    hasLyrics,
  } = useLyrics(currentTrack, currentTime, isPlaying);

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

  const getCoverUrl = () => {
    const coverId = currentTrack?.album?.cover || currentTrack?.album?.id;
    if (!coverId) return null;
    const formattedId = String(coverId).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/640x640.jpg`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekTouch = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || duration === 0) return;
    const touch = e.touches[0];
    const rect = seekBarRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    seek(percentage * duration);
  }, [duration, seek]);

  const handleTrackPlay = (track: Track, index: number) => {
    if (index !== currentQueueIndex) {
      setQueue(queue, index);
    }
  };

  if (!currentTrack) return null;

  const coverUrl = getCoverUrl();
  const upNextTracks = queue.slice(currentQueueIndex + 1);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-background text-foreground overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-foreground"
              aria-label="Close"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center text-foreground"
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Player View - Always Visible */}
            <div className="flex flex-col">
              {/* Album Art */}
              <div className="px-8 py-8">
                  <div className="relative aspect-square w-full max-w-md mx-auto bg-foreground/5 overflow-hidden rounded-lg">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={getTrackTitle(currentTrack)}
                        fill
                        sizes="(max-width: 768px) 90vw, 500px"
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-24 h-24 text-foreground/20" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Track Info */}
                <div className="px-6 pb-4">
                  <h1 className="text-xl font-medium text-foreground truncate">
                    {getTrackTitle(currentTrack)}
                  </h1>
                  <p className="text-sm text-foreground/60 truncate mt-1">
                    {getTrackArtists(currentTrack)}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="px-6 pb-2">
                  <div
                    ref={seekBarRef}
                    className="relative h-1 bg-foreground/20 rounded-full cursor-pointer"
                    onTouchStart={handleSeekTouch}
                    onTouchMove={handleSeekTouch}
                  >
                    <div
                      className="absolute h-full bg-foreground rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-foreground/50 mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 px-6 py-6">
                  <button
                    onClick={toggleShuffle}
                    className={`w-10 h-10 flex items-center justify-center ${
                      shuffleActive ? "text-foreground" : "text-foreground/40"
                    }`}
                    aria-label="Shuffle"
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={playPrev}
                    className="w-12 h-12 flex items-center justify-center text-foreground"
                    aria-label="Previous"
                  >
                    <SkipBack className="w-7 h-7 fill-current" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="w-20 h-20 rounded-full bg-foreground text-background flex items-center justify-center"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 fill-current" />
                    ) : (
                      <Play className="w-8 h-8 ml-1 fill-current" />
                    )}
                  </button>

                  <button
                    onClick={playNext}
                    className="w-12 h-12 flex items-center justify-center text-foreground"
                    aria-label="Next"
                  >
                    <SkipForward className="w-7 h-7 fill-current" />
                  </button>

                  <button
                    onClick={toggleRepeat}
                    className={`w-10 h-10 flex items-center justify-center ${
                      repeatMode !== "off" ? "text-foreground" : "text-foreground/40"
                    }`}
                    aria-label="Repeat"
                  >
                    {repeatMode === "one" ? (
                      <Repeat1 className="w-5 h-5" />
                    ) : (
                      <Repeat className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

            {/* Tabs */}
            <div className="border-t border-b border-foreground/10 sticky top-0 bg-background z-10">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("upnext")}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    activeTab === "upnext"
                      ? "text-foreground border-b-2 border-foreground"
                      : "text-foreground/60"
                  }`}
                >
                  Up next
                </button>
                <button
                  onClick={() => setActiveTab("lyrics")}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    activeTab === "lyrics"
                      ? "text-foreground border-b-2 border-foreground"
                      : "text-foreground/60"
                  }`}
                >
                  Lyrics
                </button>
                <button
                  onClick={() => setActiveTab("related")}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    activeTab === "related"
                      ? "text-foreground border-b-2 border-foreground"
                      : "text-foreground/60"
                  }`}
                >
                  Related
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "upnext" && (
              <div className="px-4 py-4">
                {/* Currently Playing */}
                <div className="mb-4">
                  <div className="text-xs text-foreground/50 mb-2">Playing from</div>
                  <div className="text-sm font-medium text-foreground">
                    {currentTrack.album?.title || "Unknown Album"}
                  </div>
                </div>

                {/* Auto-play Toggle */}
                <div className="flex items-center justify-between py-3 border-b border-foreground/10 mb-2">
                  <div>
                    <div className="text-sm font-medium text-foreground">Auto-play</div>
                    <div className="text-xs text-foreground/50">
                      Add similar content to the end of the queue
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoPlay(!autoPlay)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      autoPlay ? "bg-blue-500" : "bg-foreground/30"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        autoPlay ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Queue List */}
                <div className="space-y-0">
                  {upNextTracks.length > 0 ? (
                    upNextTracks.map((track, idx) => {
                      const globalIndex = currentQueueIndex + 1 + idx;
                      return (
                        <div
                          key={`${track.id}-${globalIndex}`}
                          className="flex items-center gap-3 py-2"
                        >
                          <div
                            className="relative w-12 h-12 bg-foreground/5 flex-shrink-0 rounded overflow-hidden cursor-pointer"
                            onClick={() => handleTrackPlay(track, globalIndex)}
                          >
                            {track.album?.cover ? (
                              <Image
                                src={`https://resources.tidal.com/images/${String(track.album.cover).replace(/-/g, "/")}/160x160.jpg`}
                                alt=""
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <Music2 className="w-6 h-6 text-foreground/20 m-auto" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Play className="w-5 h-5 text-white fill-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground truncate">
                              {getTrackTitle(track)}
                            </div>
                            <div className="text-xs text-foreground/50 truncate">
                              {getTrackArtists(track)}
                            </div>
                          </div>
                          <div className="text-xs text-foreground/50">
                            {formatTime(track.duration || 0)}
                          </div>
                          <button className="w-8 h-8 flex items-center justify-center text-foreground/50">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-foreground/40 text-sm">
                      No upcoming tracks
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "lyrics" && (
              <div className="px-6 py-8 text-center">
                {hasLyrics && lyrics?.parsed ? (
                  <div className="space-y-4">
                    {lyrics.parsed.map((line, idx) => (
                      <p
                        key={idx}
                        className={`text-base transition-all ${
                          idx === currentLineIndex
                            ? "text-foreground font-medium scale-110"
                            : "text-foreground/40"
                        }`}
                      >
                        {line.text}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="text-foreground/40">No lyrics available</div>
                )}
              </div>
            )}

            {activeTab === "related" && (
              <div className="px-6 py-8 text-center text-foreground/40">
                Related tracks coming soon
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof window !== "undefined" ? createPortal(content, document.body) : null;
}
