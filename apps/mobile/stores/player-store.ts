import { create } from "zustand";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer, AudioStatus } from "expo-audio";
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
  togglePlayback: () => void;
  skipNext: () => Promise<void>;
  skipPrev: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  toggleLyrics: () => void;
}

type PlayerStore = PlayerState & PlayerActions;

let player: AudioPlayer | null = null;

async function resolveTrackUrl(track: Track): Promise<string | null> {
  return api.getStreamUrl(track.id, track.audioQuality ?? "LOSSLESS");
}

function handleStatus(status: AudioStatus, get: () => PlayerStore, set: (s: Partial<PlayerState>) => void) {
  set({
    isPlaying: status.playing,
    isBuffering: status.isBuffering,
    position: status.currentTime,
    duration: status.duration,
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

  if (player) {
    player.replace({ uri: url });
  } else {
    player = createAudioPlayer({ uri: url }, { updateInterval: 200 });
    player.addListener("playbackStatusUpdate", (status) =>
      handleStatus(status, get, set)
    );
  }

  player.play();
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
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
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

  togglePlayback: () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
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
      await player?.seekTo(0);
      return;
    }

    const prevIndex = state.queueIndex - 1;
    if (prevIndex < 0) {
      await player?.seekTo(0);
      return;
    }

    const prevTrack = state.queue[prevIndex];
    set({ queueIndex: prevIndex, currentTrack: prevTrack });
    await loadAndPlay(prevTrack, get, set);
  },

  seekTo: async (position) => {
    if (!player) return;
    await player.seekTo(position);
  },

  toggleLyrics: () => {
    set((s) => ({ showLyrics: !s.showLyrics }));
  },
}));
