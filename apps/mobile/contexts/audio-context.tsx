import React, { createContext, useContext, useCallback, useRef, useEffect, useState, useMemo } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { api } from "@/lib/api";
import type { Track } from "@side-a/shared/api/types";

type RepeatMode = "off" | "all" | "one";

interface AudioState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  isBuffering: boolean;
  repeatMode: RepeatMode;
  shuffleActive: boolean;
}

interface AudioContextValue extends AudioState {
  playTrack: (track: Track) => void;
  playAlbum: (tracks: Track[], startIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  seekTo: (position: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  clearQueue: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [shuffleActive, setShuffleActive] = useState(false);
  const [isLoadingStream, setIsLoadingStream] = useState(false);

  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const repeatModeRef = useRef(repeatMode);
  queueRef.current = queue;
  queueIndexRef.current = queueIndex;
  repeatModeRef.current = repeatMode;

  const isPlaying = status?.playing ?? false;
  const position = status?.currentTime ?? 0;
  const duration = status?.duration ?? 0;
  const isBuffering = status?.isBuffering ?? false;

  const loadAndPlay = useCallback(
    async (track: Track) => {
      setIsLoadingStream(true);
      try {
        const streamUrl = await api.getStreamUrl(track.id, "LOSSLESS");
        if (!streamUrl) {
          console.error("No stream URL for track:", track.id);
          return;
        }
        player.replace({ uri: streamUrl });
        player.play();
        setCurrentTrack(track);
      } catch (err) {
        console.error("Failed to load track:", err);
      } finally {
        setIsLoadingStream(false);
      }
    },
    [player]
  );

  const playTrack = useCallback(
    (track: Track) => {
      setQueue([track]);
      setQueueIndex(0);
      loadAndPlay(track);
    },
    [loadAndPlay]
  );

  const playAlbum = useCallback(
    (tracks: Track[], startIndex = 0) => {
      setQueue(tracks);
      setQueueIndex(startIndex);
      loadAndPlay(tracks[startIndex]);
    },
    [loadAndPlay]
  );

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const resume = useCallback(() => {
    player.play();
  }, [player]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, isPlaying]);

  const skipNext = useCallback(() => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    const rm = repeatModeRef.current;

    if (rm === "one") {
      player.seekTo(0);
      player.play();
      return;
    }

    if (idx < q.length - 1) {
      const nextIdx = idx + 1;
      setQueueIndex(nextIdx);
      loadAndPlay(q[nextIdx]);
    } else if (rm === "all" && q.length > 0) {
      setQueueIndex(0);
      loadAndPlay(q[0]);
    }
  }, [player, loadAndPlay]);

  const skipPrevious = useCallback(() => {
    if (position > 3) {
      player.seekTo(0);
      return;
    }

    const q = queueRef.current;
    const idx = queueIndexRef.current;

    if (idx > 0) {
      const prevIdx = idx - 1;
      setQueueIndex(prevIdx);
      loadAndPlay(q[prevIdx]);
    } else {
      player.seekTo(0);
    }
  }, [player, position, loadAndPlay]);

  const seekTo = useCallback(
    (pos: number) => {
      player.seekTo(pos);
    },
    [player]
  );

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setQueueIndex((prev) => {
      if (index < prev) return prev - 1;
      return prev;
    });
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setQueueIndex((prev) => {
      if (prev === fromIndex) return toIndex;
      if (fromIndex < prev && toIndex >= prev) return prev - 1;
      if (fromIndex > prev && toIndex <= prev) return prev + 1;
      return prev;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffleActive((prev) => !prev);
  }, []);

  const clearQueue = useCallback(() => {
    player.pause();
    setQueue([]);
    setQueueIndex(-1);
    setCurrentTrack(null);
  }, [player]);

  useEffect(() => {
    if (status?.didJustFinish) {
      skipNext();
    }
  }, [status?.didJustFinish, skipNext]);

  const value = useMemo<AudioContextValue>(
    () => ({
      currentTrack,
      queue,
      queueIndex,
      isPlaying,
      position,
      duration,
      isBuffering: isBuffering || isLoadingStream,
      repeatMode,
      shuffleActive,
      playTrack,
      playAlbum,
      pause,
      resume,
      togglePlayPause,
      skipNext,
      skipPrevious,
      seekTo,
      addToQueue,
      removeFromQueue,
      reorderQueue,
      setRepeatMode,
      toggleShuffle,
      clearQueue,
    }),
    [
      currentTrack, queue, queueIndex, isPlaying, position, duration,
      isBuffering, isLoadingStream, repeatMode, shuffleActive,
      playTrack, playAlbum, pause, resume, togglePlayPause,
      skipNext, skipPrevious, seekTo, addToQueue, removeFromQueue,
      reorderQueue, toggleShuffle, clearQueue,
    ]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}
