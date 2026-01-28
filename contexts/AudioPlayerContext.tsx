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

// Re-export the new split contexts
export {
  PlaybackStateProvider,
  usePlaybackState,
} from "./PlaybackStateContext";
export { QueueProvider, useQueue } from "./QueueContext";

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
  currentQuality: string;
  streamUrl: string | null;
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
  getAudioElement: () => HTMLAudioElement | null;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

const STORAGE_KEY = "audio-player-state";

// Interface for what we persist to localStorage
interface PersistedState {
  volume: number;
  isMuted: boolean;
  shuffleActive: boolean;
  repeatMode: RepeatMode;
  queue: Track[];
  currentQueueIndex: number;
  currentTrack: Track | null;
  currentTime: number;
}

// Helper function to load persisted state from localStorage
function getPersistedState(): Partial<PersistedState> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(
      "Failed to load audio player state from localStorage:",
      error
    );
  }

  return {};
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const persistedState = getPersistedState();

  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: persistedState.currentTrack || null,
    isPlaying: false, // Never auto-play on reload
    currentTime: persistedState.currentTime || 0,
    duration: 0,
    volume: persistedState.volume ?? 1,
    isMuted: persistedState.isMuted ?? false,
    queue: persistedState.queue || [],
    currentQueueIndex: persistedState.currentQueueIndex ?? -1,
    shuffleActive: persistedState.shuffleActive ?? false,
    repeatMode: persistedState.repeatMode || "off",
    currentQuality: "LOSSLESS",
    streamUrl: null,
  });

  const preloadCache = useRef<Map<number, string>>(new Map());
  const originalQueueBeforeShuffle = useRef<Track[]>([]);
  const shuffledQueue = useRef<Track[]>([]);
  const playNextRef = useRef<(() => Promise<void>) | null>(null);
  const isFirstRender = useRef(true);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    try {
      const stateToPersist: PersistedState = {
        volume: state.volume,
        isMuted: state.isMuted,
        shuffleActive: state.shuffleActive,
        repeatMode: state.repeatMode,
        queue: state.queue,
        currentQueueIndex: state.currentQueueIndex,
        currentTrack: state.currentTrack,
        currentTime: state.currentTime,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (error) {
      console.error(
        "Failed to save audio player state to localStorage:",
        error
      );
    }
  }, [
    state.volume,
    state.isMuted,
    state.shuffleActive,
    state.repeatMode,
    state.queue,
    state.currentQueueIndex,
    state.currentTrack,
    state.currentTime,
  ]);

  // Restore the audio element state from persisted data
  useEffect(() => {
    const restoreAudioState = async () => {
      if (!audioRef.current || !persistedState.currentTrack) return;

      try {
        // Get stream URL for the persisted track
        const streamUrl = await api.getStreamUrl(
          persistedState.currentTrack.id
        );
        if (streamUrl) {
          audioRef.current.src = streamUrl;
          audioRef.current.currentTime = persistedState.currentTime || 0;
          audioRef.current.volume = persistedState.volume ?? 1;
          audioRef.current.muted = persistedState.isMuted ?? false;

          setState((prev) => ({
            ...prev,
            streamUrl: streamUrl,
            duration: audioRef.current?.duration || 0,
          }));
        }
      } catch (error) {
        console.error("Failed to restore audio state:", error);
      }
    };

    restoreAudioState();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Determine quality from track metadata
    const quality = track.audioQuality || "HIGH";

    setState((prev) => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      currentQuality: quality,
      streamUrl: streamUrl,
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

          const quality = track.audioQuality || "HIGH";

          setState((prev) => ({
            ...prev,
            currentTrack: track,
            isPlaying: true,
            currentTime: 0,
            currentQuality: quality,
            streamUrl: streamUrl,
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

      const quality = track.audioQuality || "HIGH";

      setState((prev) => ({
        ...prev,
        currentTrack: track,
        currentQueueIndex: nextIndex,
        isPlaying: true,
        currentTime: 0,
        currentQuality: quality,
        streamUrl: streamUrl,
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

      const quality = track.audioQuality || "HIGH";

      setState((prev) => ({
        ...prev,
        currentTrack: track,
        currentQueueIndex: prevIndex,
        isPlaying: true,
        currentTime: 0,
        currentQuality: quality,
        streamUrl: streamUrl,
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

  const getAudioElement = useCallback(() => {
    return audioRef.current;
  }, []);

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
    getAudioElement,
  };

  // Manually sync with split contexts using refs to avoid circular dependencies
  useEffect(() => {
    // Update PlaybackStateContext via a custom event
    const event = new CustomEvent("playbackStateUpdate", {
      detail: {
        isPlaying: state.isPlaying,
        currentTime: state.currentTime,
        duration: state.duration,
        volume: state.volume,
        isMuted: state.isMuted,
      },
    });
    window.dispatchEvent(event);
  }, [
    state.isPlaying,
    state.currentTime,
    state.duration,
    state.volume,
    state.isMuted,
  ]);

  useEffect(() => {
    // Update QueueContext via a custom event
    const event = new CustomEvent("queueStateUpdate", {
      detail: {
        currentTrack: state.currentTrack,
        queue: state.queue,
        currentQueueIndex: state.currentQueueIndex,
        shuffleActive: state.shuffleActive,
        repeatMode: state.repeatMode,
        currentQuality: state.currentQuality,
        streamUrl: state.streamUrl,
      },
    });
    window.dispatchEvent(event);
  }, [
    state.currentTrack,
    state.queue,
    state.currentQueueIndex,
    state.shuffleActive,
    state.repeatMode,
    state.currentQuality,
    state.streamUrl,
  ]);

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
