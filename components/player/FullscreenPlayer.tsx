"use client";

import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { usePlaybackState } from "@/contexts/PlaybackStateContext";
import { useQueue } from "@/contexts/QueueContext";
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
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLyrics } from "@/hooks/useLyrics";
import { LyricsPanel } from "./LyricsPanel";

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
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
    toggleShuffle,
    toggleRepeat,
  } = useAudioPlayer();

  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [activeTab, setActiveTab] = useState<"queue" | "lyrics">("lyrics");
  const seekBarRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

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

  // Switch to queue tab if no lyrics available, but only once when track changes or initial load
  useEffect(() => {
    if (!lyricsLoading && !hasLyrics && activeTab === "lyrics") {
      // Optional: Auto-switch to queue if no lyrics.
      // Keeping it on lyrics tab with "No lyrics" message is also fine and less jarring.
      // setActiveTab("queue");
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
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "circOut" }}
          className="fixed inset-0 z-[100] bg-black text-white overflow-hidden flex flex-col"
        >
          {/* Background Layer - Blurry Album Art */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {coverUrl && (
              <div className="absolute inset-0">
                <Image
                  src={coverUrl}
                  alt=""
                  fill
                  sizes="100vw"
                  quality={20}
                  className="object-cover opacity-60 blur-[80px] scale-110"
                  priority={false}
                  loading="eager"
                />
                <div className="absolute inset-0 bg-black/40" /> {/* Dim overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/20" />
              </div>
            )}
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-6 py-4 md:px-8 md:py-6">
            <button
              onClick={onClose}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-white/90" />
              <span className="text-sm font-medium text-white/90 hidden sm:block">Back</span>
            </button>

            <div className="flex bg-black/20 backdrop-blur-md rounded-full p-1 border border-white/5">
               <button
                  onClick={() => setActiveTab("queue")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === "queue"
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Playing Next
                </button>
                <button
                  onClick={() => setActiveTab("lyrics")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === "lyrics"
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Lyrics
                </button>
            </div>

             <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all sm:hidden"
            >
               <X className="w-5 h-5" />
            </button>
             <div className="w-10 hidden sm:block"></div> {/* Spacer */}
          </div>

          {/* Main Content Grid */}
          <div className="relative z-10 flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center overflow-hidden">

            {/* Left Side: Album Art & Controls */}
            <div className="flex flex-col justify-center h-full max-h-[80vh] w-full max-w-xl mx-auto lg:mx-0 lg:max-w-none">

              {/* Album Art Container */}
              <div className="relative aspect-square w-full max-w-[320px] x-auto lg:mx-0 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] rounded-xl overflow-hidden mb-8 lg:mb-12 ">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={getTrackTitle(currentTrack)}
                    fill
                    sizes="(max-width: 768px) 80vw, 400px"
                    quality={90}
                    className="object-cover"
                    priority={true}
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                    <Music2 className="w-24 h-24 text-neutral-600" />
                  </div>
                )}
              </div>

              {/* Track Info & Progress */}
              <div className="space-y-6 w-full max-w-[480px] mx-auto lg:mx-0">
                <div className="space-y-1 text-center lg:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight line-clamp-1">
                    {getTrackTitle(currentTrack)}
                  </h1>
                  <p className="text-lg md:text-xl text-white/70 line-clamp-1">
                    {getTrackArtists(currentTrack)}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 group">
                  <div
                    ref={seekBarRef}
                    className="h-1.5 bg-white/20 rounded-full cursor-pointer relative overflow-hidden hover:h-2 transition-all"
                    onClick={handleSeekClick}
                    onMouseDown={handleSeekMouseDown}
                    onMouseMove={handleSeekMouseMove}
                    onMouseUp={handleSeekMouseUp}
                  >
                    <div
                      className="h-full bg-white/90 rounded-full relative"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-medium text-white/50 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-between lg:justify-start lg:gap-10">
                   <button
                    onClick={toggleShuffle}
                    className={`p-2 rounded-full transition-colors ${
                      shuffleActive ? "text-walkman-orange bg-white/10" : "text-white/60 hover:text-white"
                    }`}
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-6">
                    <button
                      onClick={playPrev}
                      className="p-2 text-white/80 hover:text-white transition-transform active:scale-95"
                    >
                      <SkipBack className="w-8 h-8 fill-current" />
                    </button>

                    <button
                      onClick={togglePlayPause}
                      className="w-16 h-16 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 fill-current" />
                      ) : (
                        <Play className="w-8 h-8 ml-1 fill-current" />
                      )}
                    </button>

                    <button
                      onClick={playNext}
                      className="p-2 text-white/80 hover:text-white transition-transform active:scale-95"
                    >
                      <SkipForward className="w-8 h-8 fill-current" />
                    </button>
                  </div>

                  <button
                    onClick={toggleRepeat}
                    className={`p-2 rounded-full transition-colors ${
                      repeatMode !== 'off' ? "text-walkman-orange bg-white/10" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                  </button>
                </div>

                 {/* Volume - Desktop Only */}
                <div className="hidden lg:flex items-center gap-3 mt-4 max-w-[200px]">
                  <button onClick={toggleMute} className="text-white/70 hover:text-white">
                     {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume * 100}
                    onChange={(e) => setVolume(Number(e.target.value) / 100)}
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-3
                             [&::-webkit-slider-thumb]:h-3
                             [&::-webkit-slider-thumb]:bg-white
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:opacity-0
                             [&::-webkit-slider-thumb]:hover:opacity-100"
                  />
                </div>
              </div>
            </div>

            {/* Right Side: Lyrics or Queue */}
            <div className="hidden lg:block h-full overflow-hidden mask-gradient-b">
              {activeTab === "queue" && (
                 <div className="h-full overflow-y-auto pr-4 lyrics-scroll space-y-2">
                     <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-6 sticky top-0 bg-transparent backdrop-blur-none z-10">Up Next</h3>
                     {queue.map((track, index) => {
                        const isCurrent = index === currentQueueIndex;
                        return (
                          <div
                            key={`${track.id}-${index}`}
                            onClick={() => !isCurrent && setQueue(queue, index)}
                            className={`group flex items-center gap-4 p-3 rounded-lg transition-all ${
                                isCurrent ? "bg-white/10" : "hover:bg-white/5 cursor-pointer"
                            }`}
                          >
                             {/* Small Art */}
                             <div className="relative w-12 h-12 rounded overflow-hidden shrink-0 bg-neutral-800">
                                {track.album?.cover ? (
                                     <Image
                                        src={`https://resources.tidal.com/images/${String(track.album.cover).replace(/-/g, "/")}/320x320.jpg`}
                                        alt=""
                                        fill
                                        sizes="48px"
                                        quality={75}
                                        className="object-cover"
                                        loading="lazy"
                                     />
                                ) : (
                                    <Music2 className="w-5 h-5 text-white/20 m-auto" />
                                )}
                                {isCurrent && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                         <div className="w-1.5 h-1.5 bg-walkman-orange rounded-full animate-pulse" />
                                    </div>
                                )}
                             </div>

                             <div className="flex-1 min-w-0">
                                <div className={`font-medium truncate ${isCurrent ? "text-walkman-orange" : "text-white/90"}`}>
                                    {getTrackTitle(track)}
                                </div>
                                <div className="text-sm text-white/60 truncate">
                                    {getTrackArtists(track)}
                                </div>
                             </div>

                             <div className="text-xs text-white/40 tabular-nums">
                                {formatTime(track.duration || 0)}
                             </div>
                          </div>
                        );
                     })}
                 </div>
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

            {/* Mobile Tab Content (Overlay or Stack) - For now simplified for mobile */}
            <div className="lg:hidden mt-8">
                 {/* Simplified content for mobile could go here if we wanted to show lyrics below controls */}
                 <div className="flex justify-center text-white/40 text-sm">
                    {activeTab === 'lyrics' ? (
                         hasSyncedLyrics && lyrics?.parsed?.[currentLineIndex] ? (
                             <p className="text-center px-4 font-medium text-white/90 animate-pulse">
                                 {lyrics.parsed[currentLineIndex].text}
                             </p>
                         ) : <p>Swipe up for lyrics</p>
                    ) : <p>{queue.length - currentQueueIndex - 1} tracks up next</p>}
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
