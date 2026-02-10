import { create } from "zustand";
import { Audio, AVPlaybackStatus } from "expo-av";
import { api } from "@/lib/api";
import { addRecentlyPlayed } from "@/lib/database";
import type { Track } from "@side-a/shared/api/types";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  showLyrics: boolean;
  isPlayerReady: boolean;
}

interface PlayerActions {
  setupPlayer: () => Promise<void>;
  playTrack: (track: Track, context: Track[]) => Promise<void>;
  togglePlayback: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrev: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  toggleLyrics: () => void;
}

type PlayerStore = PlayerState & PlayerActions;

let soundInstance: Audio.Sound | null = null;

async function resolveTrackUrl(track: Track): Promise<string | null> {
  return api.getStreamUrl(track.id, track.audioQuality ?? "LOSSLESS");
}

function handleStatus(status: AVPlaybackStatus, get: () => PlayerStore, set: (s: Partial<PlayerState>) => void) {
  if (!status.isLoaded) return;

  set({
    isPlaying: status.isPlaying,
    isBuffering: status.isBuffering,
    position: status.positionMillis / 1000,
    duration: (status.durationMillis ?? 0) / 1000,
  });

  if (status.didJustFinish) {
    const state = get();
    const nextIndex = state.queueIndex + 1;
    if (nextIndex < state.queue.length) {
      const nextTrack = state.queue[nextIndex];
      set({ queueIndex: nextIndex, currentTrack: nextTrack });
      loadAndPlay(nextTrack, get, set);
    } else {
      set({ isPlaying: false });
    }
  }
}

async function loadAndPlay(track: Track, get: () => PlayerStore, set: (s: Partial<PlayerState>) => void) {
  const url = await resolveTrackUrl(track);
  if (!url) return;

  if (soundInstance) {
    await soundInstance.unloadAsync();
  }

  const { sound } = await Audio.Sound.createAsync(
    { uri: url },
    { shouldPlay: true, progressUpdateIntervalMillis: 200 },
    (status) => handleStatus(status, get, set)
  );

  soundInstance = sound;
  addRecentlyPlayed(track);
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  isBuffering: false,
  position: 0,
  duration: 0,
  showLyrics: false,
  isPlayerReady: false,

  setupPlayer: async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      set({ isPlayerReady: true });
    } catch {
      set({ isPlayerReady: true });
    }
  },

  playTrack: async (track, context) => {
    const trackIndex = context.findIndex((t) => t.id === track.id);
    const orderedQueue = trackIndex >= 0 ? context : [track, ...context];
    const startIndex = trackIndex >= 0 ? trackIndex : 0;

    set({ queue: orderedQueue, queueIndex: startIndex, currentTrack: track });
    await loadAndPlay(track, get, set);
  },

  togglePlayback: async () => {
    if (!soundInstance) return;
    const status = await soundInstance.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await soundInstance.pauseAsync();
    } else {
      await soundInstance.playAsync();
    }
  },

  skipNext: async () => {
    const state = get();
    const nextIndex = state.queueIndex + 1;
    if (nextIndex >= state.queue.length) return;

    const nextTrack = state.queue[nextIndex];
    set({ queueIndex: nextIndex, currentTrack: nextTrack });
    await loadAndPlay(nextTrack, get, set);
  },

  skipPrev: async () => {
    const state = get();

    if (state.position > 3) {
      await soundInstance?.setPositionAsync(0);
      return;
    }

    const prevIndex = state.queueIndex - 1;
    if (prevIndex < 0) {
      await soundInstance?.setPositionAsync(0);
      return;
    }

    const prevTrack = state.queue[prevIndex];
    set({ queueIndex: prevIndex, currentTrack: prevTrack });
    await loadAndPlay(prevTrack, get, set);
  },

  seekTo: async (position) => {
    if (!soundInstance) return;
    await soundInstance.setPositionAsync(position * 1000);
  },

  toggleLyrics: () => {
    set((s) => ({ showLyrics: !s.showLyrics }));
  },
}));
