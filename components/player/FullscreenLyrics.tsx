"use client";

import { useEffect, useRef } from "react";
import { X, Download } from "lucide-react";
import { Track, LyricsData } from "@/lib/api/types";
import { getTrackTitle, getTrackArtists } from "@/lib/api/utils";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

interface FullscreenLyricsProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  lyrics: LyricsData | null;
  currentLineIndex: number;
  isLoading: boolean;
  error: string | null;
  onSeek: (time: number) => void;
}

export function FullscreenLyrics({
  isOpen,
  onClose,
  track,
  lyrics,
  currentLineIndex,
  isLoading,
  error,
  onSeek,
}: FullscreenLyricsProps) {
  const activeLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get album cover URL
  const getCoverUrl = () => {
    const coverId = track?.album?.cover || track?.album?.id;
    if (!coverId) return null;
    const formattedId = String(coverId).replace(/-/g, "/");
    return `https://resources.tidal.com/images/${formattedId}/320x320.jpg`;
  };

  // Auto-scroll to active line with smooth behavior
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeLine = activeLineRef.current;

      // Use a small timeout to ensure DOM has updated
      requestAnimationFrame(() => {
        // Calculate the position to scroll to (center the active line)
        const containerHeight = container.clientHeight;
        const lineTop = activeLine.offsetTop;
        const lineHeight = activeLine.clientHeight;

        // Calculate target scroll position to center the active line
        const targetScrollTop = lineTop - containerHeight / 2 + lineHeight / 2;

        // Smooth scroll to the calculated position
        container.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      });
    }
  }, [currentLineIndex]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Generate LRC file for download
  const downloadLRC = () => {
    if (!lyrics?.subtitles || !track) return;

    let lrcContent = `[ti:${getTrackTitle(track)}]\n`;
    lrcContent += `[ar:${getTrackArtists(track)}]\n`;
    lrcContent += `[al:${track.album?.title || ""}]\n`;
    lrcContent += "\n";
    lrcContent += lyrics.subtitles;

    const blob = new Blob([lrcContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getTrackTitle(track)}.lrc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const coverUrl = getCoverUrl();
  const hasSyncedLyrics = Boolean(lyrics?.parsed && lyrics.parsed.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] bg-bone dark:bg-carbon transition-colors duration-300"
        >
          {/* Retro Noise Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none retro-grain" />

          {/* Header - Walkman Style */}
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 left-0 right-0 h-20 border-b-2 border-carbon dark:border-bone bg-bone dark:bg-carbon z-10"
          >
            <div className="max-w-6xl mx-auto h-full px-8 flex items-center justify-between">
              {/* Walkman-Style Label */}
              <div className="flex items-center gap-4">
                {/* Retro Icon */}
                <div className="w-10 h-10 border-2 border-carbon dark:border-bone rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-walkman-orange rounded-full animate-pulse" />
                </div>

                <div className="flex flex-col">
                  <div className="text-[9px] font-mono font-bold tracking-[0.25em] text-gray-500 dark:text-gray-500">
                    STEREO
                  </div>
                  <div className="text-sm font-mono font-bold tracking-[0.15em] text-carbon dark:text-bone">
                    LYRICS MODE
                  </div>
                </div>

                {hasSyncedLyrics && (
                  <div className="flex items-center gap-2 ml-4">
                    <div className="px-3 py-1 bg-walkman-orange text-white text-[10px] font-mono font-bold tracking-[0.15em] shadow-[2px_2px_0px_0px_rgba(16,16,16,0.2)]">
                      SYNC
                    </div>
                    <div className="text-[10px] font-mono tracking-wider text-gray-500 dark:text-gray-400">
                      TAP TO SEEK
                    </div>
                  </div>
                )}
              </div>

              {/* Actions - Retro Button Style */}
              <div className="flex items-center gap-3">
                {/* Download LRC Button */}
                {hasSyncedLyrics && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadLRC}
                    className="w-10 h-10 flex items-center justify-center border-2 border-carbon dark:border-bone
                           bg-bone dark:bg-carbon hover:bg-carbon hover:text-bone dark:hover:bg-bone dark:hover:text-carbon
                           transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(16,16,16,0.3)] dark:shadow-[2px_2px_0px_0px_rgba(242,239,233,0.3)]
                           active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                    aria-label="Download LRC"
                    title="Download LRC File"
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                )}

                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center border-2 border-carbon dark:border-bone
                         bg-bone dark:bg-carbon hover:bg-carbon hover:text-bone dark:hover:bg-bone dark:hover:text-carbon
                         transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(16,16,16,0.3)] dark:shadow-[2px_2px_0px_0px_rgba(242,239,233,0.3)]
                         active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="h-full pt-20 pb-32 overflow-hidden"
          >
            <div className="max-w-6xl mx-auto h-full px-8 py-12">
              {/* Retro Track Info Card - Walkman Cassette Style */}
              <motion.div
                initial={{ y: 30, opacity: 0, filter: "blur(10px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{
                  duration: 0.7,
                  delay: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mb-16 border-2 border-carbon dark:border-bone p-8
                         shadow-[6px_6px_0px_0px_rgba(16,16,16,1)] dark:shadow-[6px_6px_0px_0px_rgba(242,239,233,1)]
                         bg-bone dark:bg-carbon relative overflow-hidden"
              >
                {/* Decorative Lines - Cassette Style */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-walkman-orange to-transparent opacity-50" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-walkman-orange to-transparent opacity-50" />

                <div className="flex items-center gap-8">
                  {/* Album Art - Retro Photo Style */}
                  {coverUrl && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className="relative w-32 h-32 flex-shrink-0 border-2 border-carbon dark:border-bone
                               shadow-[4px_4px_0px_0px_rgba(16,16,16,0.4)] dark:shadow-[4px_4px_0px_0px_rgba(242,239,233,0.4)]
                               overflow-hidden group"
                    >
                      <Image
                        src={coverUrl}
                        alt={getTrackTitle(track)}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                      {/* Retro Photo Border Effect */}
                      <div className="absolute inset-0 border-4 border-white/10" />
                    </motion.div>
                  )}

                  {/* Track Details - Retro Typography */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-[10px] font-mono font-bold tracking-[0.25em] text-gray-500 dark:text-gray-400">
                        NOW PLAYING
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-gray-300 dark:from-gray-700 to-transparent" />
                    </div>

                    <div className="text-3xl font-bold mb-3 text-carbon dark:text-bone font-mono tracking-tight leading-tight">
                      {getTrackTitle(track)}
                    </div>

                    <div className="text-lg text-gray-600 dark:text-gray-400 font-mono tracking-wide">
                      {getTrackArtists(track)}
                    </div>

                    {track.album?.title && (
                      <div className="mt-3 text-sm text-gray-500 dark:text-gray-500 font-mono tracking-wider">
                        {track.album.title}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Lyrics Content */}
              <div
                ref={containerRef}
                className="h-[calc(100%-280px)] overflow-y-auto overflow-x-hidden px-4 lyrics-scroll"
              >
                {isLoading && (
                  <div className="flex flex-col items-center justify-center h-full">
                    {/* Retro Loading Animation */}
                    <div className="relative w-20 h-20 mb-6">
                      <div className="absolute inset-0 border-4 border-carbon/20 dark:border-bone/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-transparent border-t-walkman-orange rounded-full animate-spin" />
                    </div>
                    <div className="text-sm font-mono tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      LOADING LYRICS...
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-7xl mb-6 text-gray-400 dark:text-gray-600">
                      ♪
                    </div>
                    <div className="text-sm font-mono tracking-[0.15em] text-gray-500 dark:text-gray-400 text-center px-8">
                      {error}
                    </div>
                  </div>
                )}

                {!isLoading && !error && !lyrics && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-7xl mb-6 text-gray-400 dark:text-gray-600">
                      ♪
                    </div>
                    <div className="text-sm font-mono tracking-[0.15em] text-gray-500 dark:text-gray-400">
                      NO LYRICS AVAILABLE
                    </div>
                  </div>
                )}

                {/* Synced Lyrics - Apple Music Inspired with Retro Feel */}
                {hasSyncedLyrics && lyrics?.parsed && (
                  <div className="space-y-6 py-12">
                    {lyrics.parsed.map((line, index) => {
                      const isActive = index === currentLineIndex;
                      const isPast = index < currentLineIndex;
                      const isUpcoming = index === currentLineIndex + 1;
                      const isNear = Math.abs(index - currentLineIndex) <= 3;

                      return (
                        <motion.div
                          key={index}
                          ref={isActive ? activeLineRef : null}
                          initial={{ opacity: 0, filter: "blur(8px)" }}
                          animate={{
                            opacity: isActive
                              ? 1
                              : isPast
                              ? 0.4
                              : isUpcoming
                              ? 0.65
                              : isNear
                              ? 0.45
                              : 0.25,
                            filter: isActive
                              ? "blur(0px)"
                              : isPast
                              ? "blur(0.5px)"
                              : isUpcoming
                              ? "blur(0.3px)"
                              : isNear
                              ? "blur(1px)"
                              : "blur(1.5px)",
                          }}
                          whileHover={{
                            opacity: isActive ? 1 : 0.85,
                            filter: "blur(0px)",
                            transition: { duration: 0.2 },
                          }}
                          whileTap={{
                            scale: 0.98,
                            transition: { duration: 0.1 },
                          }}
                          transition={{
                            duration: 0.8,
                            ease: [0.22, 1, 0.36, 1], // Apple-like easing
                          }}
                          onClick={() => onSeek(line.time)}
                          className={`
                            font-mono text-center px-6 cursor-pointer select-none
                            transition-all duration-300
                            ${
                              isActive
                                ? "text-3xl md:text-4xl font-bold text-carbon dark:text-bone leading-snug"
                                : isPast
                                ? "text-lg md:text-xl text-gray-500 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-400"
                                : isUpcoming
                                ? "text-xl md:text-2xl font-medium text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                : "text-lg md:text-xl text-gray-400 dark:text-gray-700 hover:text-gray-600 dark:hover:text-gray-500"
                            }
                          `}
                        >
                          {/* Active Line with Subtle Orange Accent */}
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5 }}
                              className="relative"
                            >
                              {/* Subtle top accent line */}
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{
                                  duration: 0.6,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-walkman-orange origin-center"
                              />

                              <motion.span
                                className="relative inline-block"
                                animate={{
                                  textShadow: [
                                    "0 0 0px rgba(255, 107, 53, 0)",
                                    "0 0 25px rgba(255, 107, 53, 0.2)",
                                    "0 0 0px rgba(255, 107, 53, 0)",
                                  ],
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              >
                                {line.text}
                              </motion.span>

                              {/* Subtle bottom accent line */}
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{
                                  duration: 0.6,
                                  delay: 0.1,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-walkman-orange origin-center"
                              />
                            </motion.div>
                          )}
                          {!isActive && line.text}
                        </motion.div>
                      );
                    })}
                    {/* Spacer for last line */}
                    <div className="h-80" />
                  </div>
                )}

                {/* Static Lyrics - Retro Typography */}
                {!hasSyncedLyrics && lyrics?.lyrics && (
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(10px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="py-16 max-w-3xl mx-auto"
                  >
                    <div className="text-lg md:text-xl font-mono leading-loose text-carbon dark:text-bone whitespace-pre-wrap text-center">
                      {lyrics.lyrics}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
