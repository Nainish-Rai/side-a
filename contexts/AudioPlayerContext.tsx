"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { Track } from "@/lib/api/types";
import { api } from "@/lib/api";
import { getTrackTitle } from "@/lib/api/utils";
import { CrossfadeController } from '@/lib/crossfade';
import { getSettings } from '@/lib/settings';
import {
  fetchRecommendationSections,
  flattenRecommendationTracks,
} from "@/lib/recommendations/client";

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

interface AudioPlayerActions {
  playTrack: (track: Track, streamUrl: string) => void;
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  reorderQueue: (newQueue: Track[], newCurrentIndex: number) => void;
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

const AudioPlayerStateContext = createContext<AudioPlayerState | null>(null);
const AudioPlayerActionsContext = createContext<AudioPlayerActions | null>(null);

const STORAGE_KEY = "audio-player-state";

// Generate multiple artwork sizes for Media Session API
function getMediaSessionArtwork(coverId: string | number | undefined): MediaImage[] {
  if (!coverId) return [];

  const coverIdStr = String(coverId);
  const sizes = [
    { size: "96", dimensions: "96x96" },
    { size: "160", dimensions: "160x160" },
    { size: "320", dimensions: "320x320" },
    { size: "640", dimensions: "640x640" },
    { size: "1280", dimensions: "1280x1280" },
  ];

  return sizes.map(({ size, dimensions }) => ({
    src: api.getCoverUrl(coverIdStr, size),
    sizes: dimensions,
    type: "image/jpeg",
  }));
}

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

interface PendingCrossfadeTrack {
  track: Track;
  index: number;
  quality: string;
  streamUrl: string;
}

function getPrimaryArtistName(track: Track | null): string {
  if (!track) return "";

  return (
    track.artist?.name ||
    track.artists?.find((artist) => artist.type === "MAIN")?.name ||
    track.artists?.[0]?.name ||
    ""
  );
}

function inferTrackProvider(track: Track | null): "tidal" | "qobuz" {
  if (!track) return "tidal";
  return String(track.id).startsWith("q:") ? "qobuz" : "tidal";
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
  const secondaryAudioRef = useRef<HTMLAudioElement | null>(null);
  const crossfadeControllerRef = useRef<CrossfadeController | null>(null);
  const crossfadeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentPlayPromiseRef = useRef<Promise<void> | null>(null);
  const pendingCrossfadeTrackRef = useRef<PendingCrossfadeTrack | null>(null);
  const lastProgressCommitRef = useRef(0);
  const [activeAudioVersion, setActiveAudioVersion] = useState(0);

  // Initialize state from localStorage using lazy initialization
  const [state, setState] = useState<AudioPlayerState>(() => {
    const persistedState = getPersistedState();
    return {
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
    };
  });

const preloadCache = useRef<Map<number, string>>(new Map());
  const originalQueueBeforeShuffle = useRef<Track[]>([]);
  const shuffledQueue = useRef<Track[]>([]);
  const playNextRef = useRef<(() =>Promise<void>)| null>(null);
  const persistTimerRef = useRef<NodeJS.Timeout | null>(null);
  const volumeRef = useRef(state.volume);
  const mutedRef = useRef(state.isMuted);

  const insertTrackAt = useCallback((tracks: Track[], index: number, track: Track) => {
    const nextTracks = [...tracks];
    nextTracks.splice(index, 0, track);
    return nextTracks;
  }, []);

  const updateMediaSessionMetadata = useCallback((track: Track) => {
    if (!("mediaSession" in navigator)) return;

    const coverId = track.album?.cover || track.album?.id;
    const artwork = getMediaSessionArtwork(coverId);
    const artistName =
      track.artist?.name ||
      track.artists?.find((a) => a.type === "MAIN")?.name ||
      track.artists?.[0]?.name ||
      "Unknown Artist";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: artistName,
      album: track.album?.title || "Unknown Album",
      artwork,
    });
  }, []);

  const resetCrossfadeState = useCallback(() => {
    pendingCrossfadeTrackRef.current = null;
    crossfadeControllerRef.current?.cancelCrossfade();
  }, []);

  const finalizeCrossfade = useCallback(() => {
    const nextTrack = pendingCrossfadeTrackRef.current;
    const currentAudio = audioRef.current;
    const secondaryAudio = secondaryAudioRef.current;

    if (!nextTrack || !currentAudio || !secondaryAudio) {
      resetCrossfadeState();
      return;
    }

    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.src = "";

    audioRef.current = secondaryAudio;
    secondaryAudioRef.current = currentAudio;

    audioRef.current.volume = volumeRef.current;
    audioRef.current.muted = mutedRef.current;

    secondaryAudioRef.current.pause();
    secondaryAudioRef.current.currentTime = 0;
    secondaryAudioRef.current.src = "";
    secondaryAudioRef.current.volume = 0;
    secondaryAudioRef.current.muted = mutedRef.current;

    crossfadeControllerRef.current?.setAudioElements(
      audioRef.current,
      secondaryAudioRef.current
    );

    setState((prev) => ({
      ...prev,
      currentTrack: nextTrack.track,
      currentQueueIndex: nextTrack.index,
      currentQuality: nextTrack.quality,
      streamUrl: nextTrack.streamUrl,
      currentTime: audioRef.current?.currentTime ?? 0,
      duration: audioRef.current?.duration || 0,
      isPlaying: !(audioRef.current?.paused ?? true),
    }));

    updateMediaSessionMetadata(nextTrack.track);
    pendingCrossfadeTrackRef.current = null;
    lastProgressCommitRef.current = audioRef.current?.currentTime ?? 0;
    setActiveAudioVersion((prev) => prev + 1);
  }, [resetCrossfadeState, updateMediaSessionMetadata]);

  // Helper function to safely play audio, handling AbortError from interrupted loads
  const safePlay = useCallback(async (audio: HTMLAudioElement) => {
    // Wait for any pending play promise to settle first
    if (currentPlayPromiseRef.current) {
      await currentPlayPromiseRef.current.catch(() => {
        // Silently ignore errors from previous play attempts
      });
    }

    // Create new play promise
    const playPromise = audio.play().catch((error) => {
      // AbortError is expected when switching tracks rapidly
      // Only log other types of errors
      if (error.name !== 'AbortError') {
        console.error("Playback failed:", error);
        setState((prev) => ({ ...prev, isPlaying: false }));
      }
    });

    // Store the promise so we can wait for it if needed
    currentPlayPromiseRef.current = playPromise;

    return playPromise;
  }, []);

  const continueWithRecommendations = useCallback(
    async (seedTrack: Track, quality: string) => {
      try {
        const sections = await fetchRecommendationSections({
          title: getTrackTitle(seedTrack),
          artist: getPrimaryArtistName(seedTrack),
          album: seedTrack.album?.title,
          duration: seedTrack.duration,
          provider: inferTrackProvider(seedTrack),
          perSectionLimit: 20,
          sectionIds: ["up-next"],
        });
        const tracks = flattenRecommendationTracks(sections);
        const nextTrack = tracks[0];

        if (!nextTrack) {
          setState((prev) => ({ ...prev, isPlaying: false }));
          return;
        }

        const streamUrl =
          preloadCache.current.get(nextTrack.id) ||
          (await api.getStreamUrl(nextTrack.id, quality));

        if (!streamUrl) {
          setState((prev) => ({ ...prev, isPlaying: false }));
          return;
        }

        if (audioRef.current) {
          audioRef.current.src = streamUrl;

          setState((prev) => ({
            ...prev,
            queue: tracks,
            currentTrack: nextTrack,
            currentQueueIndex: 0,
            currentTime: 0,
            currentQuality: nextTrack.audioQuality || "HIGH",
            streamUrl,
            shuffleActive: false,
            isPlaying: true,
          }));

          await safePlay(audioRef.current);
          updateMediaSessionMetadata(nextTrack);
        }
      } catch (error) {
        console.error("Failed to continue with recommendations:", error);
        setState((prev) => ({ ...prev, isPlaying: false }));
      }
    },
    [safePlay, updateMediaSessionMetadata],
  );

  // Debounce persistence to avoid frequent localStorage writes
  useEffect(() => {
    // Clear any existing timer
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }

    // Don't persist currentTime changes immediately - debounce them
    persistTimerRef.current = setTimeout(() => {
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
    }, 1000); // Debounce by 1 second

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
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

// Create Audio element once on mount
  useEffect(() => {
    const audio = new Audio();
    // Set crossOrigin to allow Web Audio API access for spectrum analyzer
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Create secondary Audio element for crossfade
  useEffect(() => {
    const secondaryAudio = new Audio();
    secondaryAudio.crossOrigin = "anonymous";
    secondaryAudioRef.current = secondaryAudio;

    return () => {
      secondaryAudio.pause();
      secondaryAudio.src = "";
    };
  }, []);

  // Initialize crossfade controller
  useEffect(() => {
    const settings = getSettings();
    
    if (settings.crossfade.enabled && audioRef.current && secondaryAudioRef.current) {
      crossfadeControllerRef.current = new CrossfadeController({
        duration: settings.crossfade.duration,
        prebufferTime: settings.crossfade.prebufferTime,
        onCrossfadeEnd: finalizeCrossfade,
      });
      crossfadeControllerRef.current.setAudioElements(
        audioRef.current,
        secondaryAudioRef.current
      );
    }

    return () => {
      if (crossfadeControllerRef.current) {
        crossfadeControllerRef.current.destroy();
        crossfadeControllerRef.current = null;
      }
    };
  }, [finalizeCrossfade]);

  // Restore the audio element state from persisted data once audio is ready
  useEffect(() => {
    const currentTrack = state.currentTrack;
    if (!audioRef.current || !currentTrack || state.streamUrl) return;

    let cancelled = false;
    const restoreAudioState = async () => {
      try {
        const streamUrl = await api.getStreamUrl(
          currentTrack.id,
          state.currentQuality
        );
        if (streamUrl && !cancelled && audioRef.current) {
          audioRef.current.src = streamUrl;
          audioRef.current.currentTime = state.currentTime;
          audioRef.current.volume = state.volume;
          audioRef.current.muted = state.isMuted;

          setState((prev) => ({
            ...prev,
            streamUrl,
            duration: audioRef.current?.duration || 0,
          }));
        }
      } catch (error) {
        console.error("Failed to restore audio state:", error);
      }
    };

    void restoreAudioState();

    return () => {
      cancelled = true;
    };
  }, [
    state.currentQuality,
    state.currentTime,
    state.currentTrack,
    state.isMuted,
    state.streamUrl,
    state.volume,
  ]);

  // Monitor for crossfade trigger point
  useEffect(() => {
    if (!crossfadeControllerRef.current) return;

    const settings = getSettings();
    if (!settings.crossfade.enabled) return;

    const checkCrossfadeTrigger = () => {
      if (!audioRef.current || !secondaryAudioRef.current) return;
      
      const { currentTime, duration } = audioRef.current;
      const triggerTime = duration - settings.crossfade.prebufferTime;
      
      if (
        currentTime >= triggerTime &&
        !crossfadeControllerRef.current?.isActive() &&
        !pendingCrossfadeTrackRef.current
      ) {
        // Get next track
        const currentQueue = state.shuffleActive
          ? shuffledQueue.current
          : state.queue;
        const nextIndex = state.repeatMode === 'all'
          ? (state.currentQueueIndex + 1) % currentQueue.length
          : state.currentQueueIndex + 1;
        
        if (nextIndex < currentQueue.length) {
          const nextTrack = currentQueue[nextIndex];
          
          // Pre-buffer next track
          (async () => {
            try {
              const streamUrl = await api.getStreamUrl(nextTrack.id, state.currentQuality);
              if (streamUrl && secondaryAudioRef.current) {
                pendingCrossfadeTrackRef.current = {
                  track: nextTrack,
                  index: nextIndex,
                  quality: nextTrack.audioQuality || "HIGH",
                  streamUrl,
                };
                secondaryAudioRef.current.src = streamUrl;
                secondaryAudioRef.current.muted = state.isMuted;
                // Start crossfade at duration - settings.crossfade.duration
                const crossfadeStart = duration - settings.crossfade.duration;
                if (currentTime >= crossfadeStart) {
                  crossfadeControllerRef.current?.startCrossfade();
                }
              }
            } catch (error) {
              console.error('Failed to pre-buffer next track:', error);
            }
          })();
        }
      }
    };

    // Check every second
    crossfadeCheckIntervalRef.current = setInterval(checkCrossfadeTrigger, 1000);

    return () => {
      if (crossfadeCheckIntervalRef.current) {
        clearInterval(crossfadeCheckIntervalRef.current);
      }
    };
  }, [state.shuffleActive, state.queue, state.currentQueueIndex, state.repeatMode, state.currentQuality, state.isMuted]);

  // Set up event listeners with stable refs
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const nextTime = audio.currentTime;
      const nextDuration = audio.duration || 0;

      if (Math.abs(nextTime - lastProgressCommitRef.current) < 0.25) {
        return;
      }

      lastProgressCommitRef.current = nextTime;
      setState((prev) => ({
        ...prev,
        currentTime: nextTime,
        duration: nextDuration,
      }));
    };

    const handleEnded = () => {
      // Handle ended via ref callback that has access to current state
      if (playNextRef.current) {
        playNextRef.current();
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

    const handleError = (e: Event) => {
      console.error("Audio element error:", e);
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    const handleCanPlay = () => {
      // Audio is ready to play
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [activeAudioVersion]);

const playTrack = useCallback((track: Track, streamUrl: string) => {
  resetCrossfadeState();

  if (!audioRef.current || !streamUrl) return;

    audioRef.current.src = streamUrl;
    safePlay(audioRef.current);

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

    updateMediaSessionMetadata(track);
  }, [resetCrossfadeState, safePlay, updateMediaSessionMetadata]);

  const play = useCallback(async () => {
    if (!audioRef.current) return;

    // If no source is set, try to load the current track
    if (!audioRef.current.src && state.currentTrack) {
      try {
        const streamUrl = await api.getStreamUrl(
          state.currentTrack.id,
          state.currentQuality
        );
        if (streamUrl && audioRef.current) {
          resetCrossfadeState();
          audioRef.current.src = streamUrl;
          setState((prev) => ({ ...prev, streamUrl }));
        } else {
          console.error("Failed to get stream URL for current track");
          return;
        }
      } catch (error) {
        console.error("Failed to load track for playback:", error);
        return;
      }
    }

    if (!audioRef.current.src) {
      console.error("No audio source set and no current track to load");
      return;
    }

    await safePlay(audioRef.current);
  }, [resetCrossfadeState, state.currentTrack, state.currentQuality, safePlay]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (state.isPlaying) {
      pause();
    } else {
      await play();
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
    if (secondaryAudioRef.current) {
      secondaryAudioRef.current.volume = clampedVolume;
    }
    setState((prev) => ({ ...prev, volume: clampedVolume }));
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !state.isMuted;
    if (secondaryAudioRef.current) {
      secondaryAudioRef.current.muted = !state.isMuted;
    }
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, [state.isMuted]);

  // Queue management functions
  const addToQueue = useCallback((track: Track) => {
    setState((prev) => {
      const nextQueue = [...prev.queue, track];

      if (prev.shuffleActive) {
        originalQueueBeforeShuffle.current = [
          ...(originalQueueBeforeShuffle.current.length > 0
            ? originalQueueBeforeShuffle.current
            : prev.queue),
          track,
        ];
        shuffledQueue.current = [
          ...(shuffledQueue.current.length > 0 ? shuffledQueue.current : prev.queue),
          track,
        ];
      }

      return {
        ...prev,
        queue: nextQueue,
      };
    });
  }, []);

  const playNextInQueue = useCallback(
    (track: Track) => {
      setState((prev) => {
        const displayInsertIndex = prev.currentTrack
          ? Math.max(
              prev.queue.findIndex((queueTrack) => queueTrack.id === prev.currentTrack?.id),
              -1,
            ) + 1
          : 0;

        if (prev.shuffleActive) {
          const baseOriginalQueue =
            originalQueueBeforeShuffle.current.length > 0
              ? originalQueueBeforeShuffle.current
              : prev.queue;
          const baseShuffledQueue =
            shuffledQueue.current.length > 0 ? shuffledQueue.current : prev.queue;

          originalQueueBeforeShuffle.current = insertTrackAt(
            baseOriginalQueue,
            displayInsertIndex,
            track,
          );
          shuffledQueue.current = insertTrackAt(
            baseShuffledQueue,
            Math.max(prev.currentQueueIndex, -1) + 1,
            track,
          );
        }

        return {
          ...prev,
          queue: insertTrackAt(prev.queue, displayInsertIndex, track),
        };
      });
    },
    [insertTrackAt],
  );

  // Reorder queue without interrupting playback
  const reorderQueue = useCallback((newQueue: Track[], newCurrentIndex: number) => {
    setState((prev) => ({
      ...prev,
      queue: newQueue,
      currentQueueIndex: newCurrentIndex,
    }));
  }, []);

  const setQueue = useCallback(
    async (tracks: Track[], startIndex: number = 0) => {
      resetCrossfadeState();
      setState((prev) => {
        const quality = prev.currentQuality;

        // Start async loading after state update
        if (tracks.length > 0 && startIndex >= 0 && startIndex < tracks.length) {
          const track = tracks[startIndex];

          // Load and play asynchronously
          (async () => {
            try {
              const streamUrl = await api.getStreamUrl(track.id, quality);
              if (!streamUrl) {
                console.error("Failed to get stream URL for track:", track.id);
                return;
              }

              if (audioRef.current) {
                audioRef.current.src = streamUrl;

                const trackQuality = track.audioQuality || "HIGH";

                setState((prev) => ({
                  ...prev,
                  currentTrack: track,
                  currentTime: 0,
                  currentQuality: trackQuality,
                  streamUrl: streamUrl,
                }));

                // Play after state is set
                await safePlay(audioRef.current);
              }
            } catch (error) {
              console.error("Error setting up playback:", error);
            }
          })();
        }

        return {
          ...prev,
          queue: tracks,
          currentQueueIndex: startIndex,
        };
      });
    },
    [resetCrossfadeState, safePlay]
  );

  const playNext = useCallback(async () => {
    resetCrossfadeState();
    setState((prev) => {
      // Handle repeat-one mode
      if (prev.repeatMode === "one" && audioRef.current) {
        audioRef.current.currentTime = 0;
        safePlay(audioRef.current);
        return prev;
      }

      const currentQueue = prev.shuffleActive
        ? shuffledQueue.current
        : prev.queue;
      if (currentQueue.length === 0) return prev;

      let nextIndex: number;
      if (prev.repeatMode === "all") {
        nextIndex = (prev.currentQueueIndex + 1) % currentQueue.length;
      } else {
        nextIndex = prev.currentQueueIndex + 1;
        if (nextIndex >= currentQueue.length) {
          if (prev.currentTrack) {
            void continueWithRecommendations(prev.currentTrack, prev.currentQuality);
            return prev;
          }
          return { ...prev, isPlaying: false };
        }
      }

      const track = currentQueue[nextIndex];

      // Load and play asynchronously
      (async () => {
        try {
          const streamUrl =
            preloadCache.current.get(track.id) ||
            (await api.getStreamUrl(track.id, prev.currentQuality));

          if (!streamUrl) {
            console.error("Failed to get stream URL for track:", track.id);
            return;
          }

          if (audioRef.current) {
            audioRef.current.src = streamUrl;

            const quality = track.audioQuality || "HIGH";

            setState((s) => ({
              ...s,
              currentTrack: track,
              currentQueueIndex: nextIndex,
              currentTime: 0,
              currentQuality: quality,
              streamUrl: streamUrl,
            }));

            await safePlay(audioRef.current);

            updateMediaSessionMetadata(track);
          }
        } catch (error) {
          console.error("Error playing next track:", error);
        }
      })();

      return prev;
    });
  }, [continueWithRecommendations, resetCrossfadeState, safePlay, updateMediaSessionMetadata]);

  // Keep ref updated
useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  useEffect(() => {
    volumeRef.current = state.volume;
  }, [state.volume]);

  useEffect(() => {
    mutedRef.current = state.isMuted;
  }, [state.isMuted]);

  const playPrev = useCallback(async () => {
    resetCrossfadeState();
    setState((prev) => {
      const currentQueue = prev.shuffleActive
        ? shuffledQueue.current
        : prev.queue;
      if (currentQueue.length === 0) return prev;

      // If more than 3 seconds into the song, restart it
      if (prev.currentTime > 3) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
        return { ...prev, currentTime: 0 };
      }

      let prevIndex: number;
      if (prev.repeatMode === "all") {
        prevIndex = prev.currentQueueIndex - 1;
        if (prevIndex < 0) {
          prevIndex = currentQueue.length - 1;
        }
      } else {
        prevIndex = Math.max(0, prev.currentQueueIndex - 1);
      }

      const track = currentQueue[prevIndex];

      // Load and play asynchronously
      (async () => {
        try {
          const streamUrl = await api.getStreamUrl(track.id, prev.currentQuality);

          if (!streamUrl) {
            console.error("Failed to get stream URL for track:", track.id);
            return;
          }

          if (audioRef.current) {
            audioRef.current.src = streamUrl;

            const quality = track.audioQuality || "HIGH";

            setState((s) => ({
              ...s,
              currentTrack: track,
              currentQueueIndex: prevIndex,
              currentTime: 0,
              currentQuality: quality,
              streamUrl: streamUrl,
            }));

            await safePlay(audioRef.current);
          }
        } catch (error) {
          console.error("Error playing previous track:", error);
        }
      })();

      return prev;
    });
  }, [resetCrossfadeState, safePlay]);

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
    resetCrossfadeState();
    setState((prev) => ({
      ...prev,
      queue: [],
      currentQueueIndex: -1,
    }));
    preloadCache.current.clear();
  }, [resetCrossfadeState]);

  // Setup Media Session API for hardware controls
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const DEFAULT_SEEK_OFFSET = 10; // seconds

    // Basic playback controls
    navigator.mediaSession.setActionHandler("play", () => play());
    navigator.mediaSession.setActionHandler("pause", () => pause());
    navigator.mediaSession.setActionHandler("previoustrack", () => playPrev());
    navigator.mediaSession.setActionHandler("nexttrack", () => playNext());

    // Seek to specific position
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) {
        seek(details.seekTime);
      }
    });

    // Seek forward (10 seconds or custom offset)
    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      const offset = details.seekOffset || DEFAULT_SEEK_OFFSET;
      if (audioRef.current) {
        const newTime = Math.min(
          audioRef.current.currentTime + offset,
          audioRef.current.duration || Infinity
        );
        seek(newTime);
      }
    });

    // Seek backward (10 seconds or custom offset)
    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      const offset = details.seekOffset || DEFAULT_SEEK_OFFSET;
      if (audioRef.current) {
        const newTime = Math.max(audioRef.current.currentTime - offset, 0);
        seek(newTime);
      }
    });

    // Stop playback
    navigator.mediaSession.setActionHandler("stop", () => {
      pause();
      seek(0);
    });

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("seekto", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("stop", null);
      }
    };
  }, [play, pause, playPrev, playNext, seek]);

  // Update Media Session position state for progress display
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    // Update playback state
    navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";

    // Update position state for progress indicator
    if (state.duration > 0 && !isNaN(state.duration) && !isNaN(state.currentTime)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: state.duration,
          playbackRate: 1,
          position: Math.min(state.currentTime, state.duration),
        });
      } catch {
        // Some browsers may not support setPositionState
      }
    }
  }, [state.isPlaying, state.currentTime, state.duration]);

  const getAudioElement = useCallback(() => {
    return audioRef.current;
  }, []);

  const actions = useMemo<AudioPlayerActions>(() => ({
    playTrack,
    addToQueue,
    playNextInQueue,
    setQueue,
    reorderQueue,
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
  }), [
    addToQueue,
    clearQueue,
    getAudioElement,
    pause,
    play,
    playNext,
    playNextInQueue,
    playPrev,
    playTrack,
    removeFromQueue,
    reorderQueue,
    seek,
    setQueue,
    setVolume,
    toggleMute,
    togglePlayPause,
    toggleRepeat,
    toggleShuffle,
  ]);

  return (
    <AudioPlayerActionsContext.Provider value={actions}>
      <AudioPlayerStateContext.Provider value={state}>
        {children}
      </AudioPlayerStateContext.Provider>
    </AudioPlayerActionsContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerActionsContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}

// Convenience hooks for accessing specific parts of the audio player state
// These replace the old split contexts and avoid event-based synchronization
export function usePlaybackState() {
  const context = useContext(AudioPlayerStateContext);
  if (!context) {
    throw new Error("usePlaybackState must be used within AudioPlayerProvider");
  }

  return useMemo(
    () => ({
      isPlaying: context.isPlaying,
      currentTime: context.currentTime,
      duration: context.duration,
      volume: context.volume,
      isMuted: context.isMuted,
    }),
    [
      context.isPlaying,
      context.currentTime,
      context.duration,
      context.volume,
      context.isMuted,
    ]
  );
}

export function useQueue() {
  const context = useContext(AudioPlayerStateContext);
  if (!context) {
    throw new Error("useQueue must be used within AudioPlayerProvider");
  }

  return useMemo(
    () => ({
      currentTrack: context.currentTrack,
      queue: context.queue,
      currentQueueIndex: context.currentQueueIndex,
      shuffleActive: context.shuffleActive,
      repeatMode: context.repeatMode,
      currentQuality: context.currentQuality,
      streamUrl: context.streamUrl,
    }),
    [
      context.currentTrack,
      context.queue,
      context.currentQueueIndex,
      context.shuffleActive,
      context.repeatMode,
      context.currentQuality,
      context.streamUrl,
    ]
  );
}

// Re-export provider aliases for backward compatibility
export const PlaybackStateProvider = AudioPlayerProvider;
export const QueueProvider = AudioPlayerProvider;
