"use client";

import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { formatTime, getTrackTitle, getTrackArtists } from "@/lib/api/utils";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  Info,
  Music2,
  Maximize2,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { StatsForNerds } from "./StatsForNerds";

const Queue = dynamic(() => import('./Queue').then(mod => ({ default: mod.Queue })), {
  loading: () => null,
  ssr: false,
});

const FullscreenPlayer = dynamic(
  () => import('./FullscreenPlayer').then(mod => ({ default: mod.FullscreenPlayer })),
  {
    loading: () => null,
    ssr: false,
  }
);

const FullscreenLyrics = dynamic(
  () => import('./FullscreenLyrics').then(mod => ({ default: mod.FullscreenLyrics })),
  {
    loading: () => null,
    ssr: false,
  }
);
import { useLyrics } from "@/hooks/useLyrics";
import Image from "next/image";
import { motion } from "motion/react";

export function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffleActive,
    repeatMode,
    queue,
    currentQuality,
    togglePlayPause,
    playNext,
    playPrev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    getAudioElement,
  } = useAudioPlayer();

  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [spectrumBars, setSpectrumBars] = useState([0, 0, 0]);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Use lyrics hook
  const {
    lyrics,
    currentLineIndex,
    isLoading: lyricsLoading,
    error: lyricsError,
    hasLyrics,
  } = useLyrics(currentTrack, currentTime, isPlaying);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Get album cover URL
  const getCoverUrl = () => {
    const coverId = currentTrack?.album?.cover || currentTrack?.album?.id;
    if (!coverId) return null;
    const formattedId = String(coverId).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/160x160.jpg`;
  };

  // Initialize audio analyzer for spectrum
  useEffect(() => {
    const audioElement = getAudioElement();
    if (!audioElement) return;

    // Create audio context and analyzer
    if (!audioContextRef.current) {
      const AudioContext =
        window.AudioContext ||
        (
          window as unknown as {
            webkitAudioContext: typeof window.AudioContext;
          }
        ).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.minDecibels = -80;
      analyserRef.current.maxDecibels = -20;

      const source =
        audioContextRef.current.createMediaElementSource(audioElement);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [getAudioElement]);

  // Animate spectrum bars
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      const timeoutId = setTimeout(() => setSpectrumBars([0, 0, 0]), 0);
      return () => clearTimeout(timeoutId);
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateSpectrum = () => {
      analyser.getByteFrequencyData(dataArray);

      const bars = [
        Math.floor((dataArray[2] / 255) * 100),
        Math.floor((dataArray[5] / 255) * 100),
        Math.floor((dataArray[8] / 255) * 100),
      ];

      setSpectrumBars(bars);
      animationFrameRef.current = requestAnimationFrame(updateSpectrum);
    };

    updateSpectrum();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

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

  // Keyboard shortcut for stats (i key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "i" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        setIsStatsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!currentTrack) return null;

  const coverUrl = getCoverUrl();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/10 z-50">
      {/* Progress Bar - Minimal Apple Music Style */}
      <div
        ref={progressBarRef}
        className="h-1 bg-white/10 cursor-pointer relative group hover:h-1.5 transition-all duration-150"
        onClick={handleProgressClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          className="h-full bg-white/90 transition-none relative"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
        </div>
      </div>

      {/* Player Content */}
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Left: Track Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Album Art */}
            {coverUrl && (
              <motion.div
                className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden shadow-xl"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src={coverUrl}
                  alt={getTrackTitle(currentTrack)}
                  fill
                  sizes="48px"
                  quality={85}
                  className="object-cover"
                  priority={true}
                />
              </motion.div>
            )}

            {/* Track Details */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate text-white">
                {getTrackTitle(currentTrack)}
              </div>
              <div className="text-xs text-white/50 truncate">
                {getTrackArtists(currentTrack)}
              </div>
            </div>

            {/* Spectrum Visualizer - Minimal 3 bars */}
            <div className="hidden md:flex items-end gap-1.5 h-6 flex-shrink-0">
              {spectrumBars.map((intensity, i) => {
                const heightPercent = Math.max(20, Math.min(100, intensity * 0.8));
                return (
                  <motion.div
                    key={i}
                    className="w-1 bg-white/60 rounded-full"
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                  />
                );
              })}
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            {/* Control Buttons */}
            <div className="flex items-center gap-4">
              {/* Shuffle Button */}
              <motion.button
                onClick={toggleShuffle}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  shuffleActive
                    ? "text-white bg-white/10"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
                aria-label="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </motion.button>

              {/* Previous Button */}
              <motion.button
                onClick={playPrev}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Previous"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </motion.button>

              {/* Play/Pause Button */}
              <motion.button
                onClick={togglePlayPause}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-white hover:bg-white/90
                           transition-all duration-200 flex items-center justify-center
                           shadow-lg"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-black fill-black" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5 text-black fill-black" />
                )}
              </motion.button>

              {/* Next Button */}
              <motion.button
                onClick={playNext}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Next"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </motion.button>

              {/* Repeat Button */}
              <motion.button
                onClick={toggleRepeat}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  repeatMode !== "off"
                    ? "text-white bg-white/10"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
                aria-label="Repeat"
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </motion.button>
            </div>

            {/* Time Display */}
            <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-white/50">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/30">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume & Actions */}
          <div className="flex items-center gap-3 flex-shrink-0 flex-1 justify-end">
            {/* Action Buttons - Always visible */}
            <div className="flex items-center gap-2">
              {/* Fullscreen Player Button - Always visible */}
              <motion.button
                onClick={() => setIsFullscreenOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                aria-label="Fullscreen Player"
                title="Open Fullscreen Player"
              >
                <Maximize2 className="w-4 h-4 text-white/60 hover:text-white transition-colors" />
              </motion.button>

              {/* Lyrics Button */}
              {hasLyrics && (
                <motion.button
                  onClick={() => setIsLyricsOpen(true)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                  aria-label="View Lyrics"
                  title="View Lyrics"
                >
                  <Music2 className="w-4 h-4 text-white/60 hover:text-white transition-colors" />
                  {lyrics && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full" />
                  )}
                </motion.button>
              )}

              {/* Queue Button */}
              <motion.button
                onClick={() => setIsQueueOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                aria-label="View Queue"
                title="View Queue"
              >
                <ListMusic className="w-4 h-4 text-white/60 hover:text-white transition-colors" />
                {queue.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {queue.length > 9 ? "9+" : queue.length}
                  </span>
                )}
              </motion.button>
            </div>

            {/* Volume Controls */}
            <div className="hidden md:flex items-center gap-3">
              <motion.button
                onClick={toggleMute}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-white/60" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white/60" />
                )}
              </motion.button>

              {/* Volume Slider */}
              <div className="w-24 group">
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
                             [&::-webkit-slider-thumb]:cursor-pointer
                             [&::-webkit-slider-thumb]:opacity-0
                             [&::-webkit-slider-thumb]:group-hover:opacity-100
                             [&::-webkit-slider-thumb]:transition-opacity
                             [&::-webkit-slider-thumb]:shadow-lg"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${
                      isMuted ? 0 : volume * 100
                    }%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) 100%)`,
                  }}
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      <Queue isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />

      {/* Stats for Nerds */}
      <StatsForNerds
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />

      {/* Fullscreen Lyrics */}
      {currentTrack && (
        <FullscreenLyrics
          isOpen={isLyricsOpen}
          onClose={() => setIsLyricsOpen(false)}
          track={currentTrack}
          lyrics={lyrics}
          currentLineIndex={currentLineIndex}
          isLoading={lyricsLoading}
          error={lyricsError}
          onSeek={seek}
        />
      )}

      {/* Fullscreen Player */}
      <FullscreenPlayer
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
      />
    </div>
  );
}
