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
  const [activeTab, setActiveTab] = useState<"queue" | "lyrics">("queue");
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
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "circOut" }}
          className="fixed inset-0 z-[100] bg-background text-foreground overflow-hidden flex flex-col"
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

          {/* Main Content Grid - Brutalist Layout */}
          <div className="relative z-10 flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start overflow-y-auto">

            {/* Left Side: Album Art & Controls */}
            <div className="flex flex-col justify-center w-full max-w-xl mx-auto lg:mx-0 lg:max-w-none space-y-6 lg:space-y-8">

              {/* Album Art Container - Square with Border */}
              <div className="relative aspect-square w-full max-w-[280px] md:max-w-[360px] mx-auto lg:mx-0 border border-foreground/10 overflow-hidden bg-foreground/5">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={getTrackTitle(currentTrack)}
                    fill
                    sizes="(max-width: 768px) 80vw, 420px"
                    quality={90}
                    className="object-cover"
                    priority={true}
                  />
                ) : (
                  <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
                    <Music2 className="w-24 h-24 text-foreground/20" />
                  </div>
                )}
              </div>

              {/* Track Info & Progress */}
              <div className="space-y-4 lg:space-y-6 w-full max-w-[360px] mx-auto lg:mx-0">
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

                {/* Progress Bar - Sharp Corners */}
                <div className="space-y-2">
                  <div
                    ref={seekBarRef}
                    className="h-2 bg-foreground/20 cursor-pointer relative overflow-hidden group"
                    onClick={handleSeekClick}
                    onMouseDown={handleSeekMouseDown}
                    onMouseMove={handleSeekMouseMove}
                    onMouseUp={handleSeekMouseUp}
                  >
                    <div
                      className="h-full bg-foreground relative"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-foreground/40 font-mono tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main Controls - Minimal Brutalist Style */}
                <div className="flex items-center justify-center gap-8 pt-4">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2 transition-colors ${
                      shuffleActive ? "text-foreground" : "text-foreground/40 hover:text-foreground/70"
                    }`}
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={playPrev}
                    className="p-2 text-foreground/70 hover:text-foreground transition-colors"
                  >
                    <SkipBack className="w-7 h-7 fill-current" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="w-14 h-14 flex items-center justify-center border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 ml-0.5 fill-current" />
                    )}
                  </button>

                  <button
                    onClick={playNext}
                    className="p-2 text-foreground/70 hover:text-foreground transition-colors"
                  >
                    <SkipForward className="w-7 h-7 fill-current" />
                  </button>

                  <button
                    onClick={toggleRepeat}
                    className={`p-2 transition-colors ${
                      repeatMode !== 'off' ? "text-foreground" : "text-foreground/40 hover:text-foreground/70"
                    }`}
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

            {/* Right Side: Lyrics or Queue - Brutalist Style */}
            <div className="hidden lg:block max-h-[calc(100vh-12rem)] overflow-hidden border-l border-foreground/10 pl-8">
              {activeTab === "queue" && (
                 <div className="h-full max-h-[calc(100vh-12rem)] overflow-y-auto pr-4 space-y-1">
                     <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono mb-6 sticky top-0 bg-background pt-2 pb-2 z-10">
                       Up Next ({queue.length - currentQueueIndex - 1})
                     </div>
                     {queue.map((track, index) => {
                        const isCurrent = index === currentQueueIndex;
                        return (
                          <div
                            key={`${track.id}-${index}`}
                            onClick={() => !isCurrent && setQueue(queue, index)}
                            className={`group flex items-center gap-4 p-3 border-b border-foreground/10 transition-all ${
                                isCurrent ? "border-l-2 border-l-white pl-[10px]" : "hover:bg-foreground/[0.02] cursor-pointer border-l-2 border-l-transparent"
                            }`}
                          >
                             {/* Small Art - Square with Border */}
                             <div className="relative w-10 h-10 shrink-0 bg-foreground/5 border border-foreground/10 overflow-hidden">
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

                             <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium truncate transition-colors ${isCurrent ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"}`}>
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
