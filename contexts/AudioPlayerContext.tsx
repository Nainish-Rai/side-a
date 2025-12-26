"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { Track } from "@/lib/api/types";
import { api } from "@/lib/api";

type RepeatMode = "off" | "all" | "one";

interface AudioPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Track[];
  currentQueueIndex: number;
  shuffleActive: boolean;
  repeatMode: RepeatMode;
}

interface AudioPlayerContextValue extends AudioPlayerState {
  playTrack: (track: Track, streamUrl: string) => void;
  addToQueue: (track: Track) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    queue: [],
    currentQueueIndex: -1,
    shuffleActive: false,
    repeatMode: "off",
  });

  const preloadCache = useRef<Map<number, string>>(new Map());
  const originalQueueBeforeShuffle = useRef<Track[]>([]);
  const shuffledQueue = useRef<Track[]>([]);
  const playNextRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
      }));
    };

    const handleEnded = () => {
      // Auto-play next track based on repeat mode
      if (state.repeatMode === "one" && audio) {
        audio.currentTime = 0;
        audio.play();
      } else if (
        state.repeatMode === "all" ||
        state.currentQueueIndex < state.queue.length - 1
      ) {
        if (playNextRef.current) {
          playNextRef.current();
        }
      } else {
        setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
      }
    };

    const handleLoadedMetadata = () => {
      setState((prev) => ({ ...prev, duration: audio.duration || 0 }));
    };

    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
    };
  }, [state.currentQueueIndex, state.queue.length, state.repeatMode]);

  const playTrack = useCallback((track: Track, streamUrl: string) => {
    if (!audioRef.current) return;

    audioRef.current.src = streamUrl;
    audioRef.current.play().catch((error) => {
      console.error("Playback failed:", error);
    });

    setState((prev) => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
    }));

    // Update Media Session metadata
    if ("mediaSession" in navigator) {
      const coverUrl =
        track.album?.cover || track.album?.id
          ? api.getCoverUrl(track.album.cover || track.album.id, "1280")
          : undefined;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist:
          track.artist?.name || track.artists?.[0]?.name || "Unknown Artist",
        album: track.album?.title || "Unknown Album",
        artwork: coverUrl
          ? [{ src: coverUrl, sizes: "1280x1280", type: "image/jpeg" }]
          : [],
      });
    }
  }, []);

  const play = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.play().catch((error) => {
      console.error("Playback failed:", error);
    });
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audioRef.current.volume = clampedVolume;
    setState((prev) => ({ ...prev, volume: clampedVolume }));
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !state.isMuted;
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, [state.isMuted]);

  // Queue management functions
  const addToQueue = useCallback((track: Track) => {
    setState((prev) => ({
      ...prev,
      queue: [...prev.queue, track],
    }));
  }, []);

  const setQueue = useCallback(
    async (tracks: Track[], startIndex: number = 0) => {
      setState((prev) => ({
        ...prev,
        queue: tracks,
        currentQueueIndex: startIndex,
      }));

      if (tracks.length > 0 && startIndex >= 0 && startIndex < tracks.length) {
        const track = tracks[startIndex];
        const streamUrl = await api.getStreamUrl(track.id);
        if (streamUrl && audioRef.current) {
          audioRef.current.src = streamUrl;
          audioRef.current.play().catch((error) => {
            console.error("Playback failed:", error);
          });

          setState((prev) => ({
            ...prev,
            currentTrack: track,
            isPlaying: true,
            currentTime: 0,
          }));
        }
      }
    },
    []
  );

  const playNext = useCallback(async () => {
    const currentQueue = state.shuffleActive
      ? shuffledQueue.current
      : state.queue;
    if (currentQueue.length === 0) return;

    let nextIndex: number;
    if (state.repeatMode === "all") {
      nextIndex = (state.currentQueueIndex + 1) % currentQueue.length;
    } else {
      nextIndex = state.currentQueueIndex + 1;
      if (nextIndex >= currentQueue.length) {
        setState((prev) => ({ ...prev, isPlaying: false }));
        return;
      }
    }

    const track = currentQueue[nextIndex];
    const streamUrl =
      preloadCache.current.get(track.id) || (await api.getStreamUrl(track.id));

    if (streamUrl && audioRef.current) {
      audioRef.current.src = streamUrl;
      await audioRef.current.play();
      setState((prev) => ({
        ...prev,
        currentTrack: track,
        currentQueueIndex: nextIndex,
        isPlaying: true,
        currentTime: 0,
      }));

      // Update Media Session metadata
      if ("mediaSession" in navigator) {
        const coverUrl =
          track.album?.cover || track.album?.id
            ? api.getCoverUrl(track.album.cover || track.album.id, "1280")
            : undefined;

        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist:
            track.artist?.name || track.artists?.[0]?.name || "Unknown Artist",
          album: track.album?.title || "Unknown Album",
          artwork: coverUrl
            ? [{ src: coverUrl, sizes: "1280x1280", type: "image/jpeg" }]
            : [],
        });
      }
    }
  }, [
    state.queue,
    state.currentQueueIndex,
    state.repeatMode,
    state.shuffleActive,
  ]);

  // Keep ref updated
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const playPrev = useCallback(async () => {
    const currentQueue = state.shuffleActive
      ? shuffledQueue.current
      : state.queue;
    if (currentQueue.length === 0) return;

    // If more than 3 seconds into the song, restart it
    if (state.currentTime > 3) {
      seek(0);
      return;
    }

    let prevIndex: number;
    if (state.repeatMode === "all") {
      prevIndex = state.currentQueueIndex - 1;
      if (prevIndex < 0) {
        prevIndex = currentQueue.length - 1;
      }
    } else {
      prevIndex = Math.max(0, state.currentQueueIndex - 1);
    }

    const track = currentQueue[prevIndex];
    const streamUrl = await api.getStreamUrl(track.id);

    if (streamUrl && audioRef.current) {
      audioRef.current.src = streamUrl;
      await audioRef.current.play();
      setState((prev) => ({
        ...prev,
        currentTrack: track,
        currentQueueIndex: prevIndex,
        isPlaying: true,
        currentTime: 0,
      }));
    }
  }, [
    state.queue,
    state.currentQueueIndex,
    state.currentTime,
    state.repeatMode,
    state.shuffleActive,
    seek,
  ]);

  const toggleShuffle = useCallback(() => {
    setState((prev) => {
      const newShuffleActive = !prev.shuffleActive;

      if (newShuffleActive) {
        originalQueueBeforeShuffle.current = [...prev.queue];
        const currentTrack = prev.queue[prev.currentQueueIndex];
        const newShuffled = [...prev.queue].sort(() => Math.random() - 0.5);
        shuffledQueue.current = newShuffled;
        const newIndex = newShuffled.findIndex(
          (t) => t.id === currentTrack?.id
        );

        return {
          ...prev,
          shuffleActive: true,
          currentQueueIndex: newIndex !== -1 ? newIndex : 0,
        };
      } else {
        const currentTrack = prev.queue[prev.currentQueueIndex];
        const originalQueue = originalQueueBeforeShuffle.current;
        const newIndex = originalQueue.findIndex(
          (t) => t.id === currentTrack?.id
        );

        return {
          ...prev,
          queue: originalQueue,
          shuffleActive: false,
          currentQueueIndex: newIndex !== -1 ? newIndex : 0,
        };
      }
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((prev) => {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const currentIndex = modes.indexOf(prev.repeatMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];

      return {
        ...prev,
        repeatMode: nextMode,
      };
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setState((prev) => {
      const newQueue = [...prev.queue];
      newQueue.splice(index, 1);

      let newIndex = prev.currentQueueIndex;
      if (index < prev.currentQueueIndex) {
        newIndex--;
      } else if (index === prev.currentQueueIndex) {
        newIndex = Math.min(newIndex, newQueue.length - 1);
      }

      return {
        ...prev,
        queue: newQueue,
        currentQueueIndex: newIndex,
      };
    });
  }, []);

  const clearQueue = useCallback(() => {
    setState((prev) => ({
      ...prev,
      queue: [],
      currentQueueIndex: -1,
    }));
    preloadCache.current.clear();
  }, []);

  // Setup Media Session API for hardware controls
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => play());
    navigator.mediaSession.setActionHandler("pause", () => pause());
    navigator.mediaSession.setActionHandler("previoustrack", () => playPrev());
    navigator.mediaSession.setActionHandler("nexttrack", () => playNext());
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) {
        seek(details.seekTime);
      }
    });

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      }
    };
  }, [play, pause, playPrev, playNext, seek]);

  const value: AudioPlayerContextValue = {
    ...state,
    playTrack,
    addToQueue,
    setQueue,
    play,
    pause,
    togglePlayPause,
    playNext,
    playPrev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    removeFromQueue,
    clearQueue,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}
