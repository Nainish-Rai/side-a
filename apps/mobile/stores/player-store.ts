import { create } from "zustand";
import TrackPlayer, {
  State,
  Event,
  RepeatMode,
  Capability,
} from "react-native-track-player";
import { api } from "@/lib/api";
import { addRecentlyPlayed } from "@/lib/database";
import type { Track } from "@side-a/shared/api/types";
import { getTrackTitle, getTrackArtists } from "@side-a/shared";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  isBuffering: boolean;
  repeatMode: RepeatMode;
  shuffled: boolean;
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

async function resolveTrackUrl(track: Track): Promise<string | null> {
  return api.getStreamUrl(track.id, track.audioQuality ?? "LOSSLESS");
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  isBuffering: false,
  repeatMode: RepeatMode.Off,
  shuffled: false,
  showLyrics: false,
  isPlayerReady: false,

  setupPlayer: async () => {
    try {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
          Capability.Stop,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
        ],
      });
      set({ isPlayerReady: true });
    } catch {
      set({ isPlayerReady: true });
    }

    TrackPlayer.addEventListener(Event.PlaybackState, (e) => {
      set({
        isPlaying: e.state === State.Playing,
        isBuffering:
          e.state === State.Buffering || e.state === State.Loading,
      });
    });

    TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (e) => {
      if (e.index != null) {
        const queue = get().queue;
        const track = queue[e.index];
        if (track) {
          set({ currentTrack: track });
          addRecentlyPlayed(track);

          const nextIndex = e.index + 1;
          if (nextIndex < queue.length) {
            const nextTrack = queue[nextIndex];
            resolveTrackUrl(nextTrack);
          }
        }
      }
    });
  },

  playTrack: async (track, context) => {
    const state = get();
    if (!state.isPlayerReady) return;

    await TrackPlayer.reset();

    const trackIndex = context.findIndex((t) => t.id === track.id);
    const orderedQueue = trackIndex >= 0 ? context : [track, ...context];
    const startIndex = trackIndex >= 0 ? trackIndex : 0;

    set({ queue: orderedQueue, currentTrack: track });

    const url = await resolveTrackUrl(track);
    if (!url) return;

    const rnTracks = await Promise.all(
      orderedQueue.map(async (t, i) => {
        let trackUrl: string | undefined;
        if (i === startIndex) {
          trackUrl = url;
        } else if (i === startIndex + 1) {
          trackUrl = (await resolveTrackUrl(t)) ?? undefined;
        }
        return {
          id: String(t.id),
          url: trackUrl ?? "",
          title: getTrackTitle(t),
          artist: getTrackArtists(t),
          artwork: t.album?.cover
            ? api.getCoverUrl(t.album.cover, "640")
            : undefined,
          duration: t.duration,
        };
      })
    );

    await TrackPlayer.add(rnTracks);
    await TrackPlayer.skip(startIndex);
    await TrackPlayer.play();

    addRecentlyPlayed(track);

    for (let i = 0; i < orderedQueue.length; i++) {
      if (i === startIndex || i === startIndex + 1) continue;
      resolveTrackUrl(orderedQueue[i]).then((resolvedUrl) => {
        if (resolvedUrl) {
          TrackPlayer.updateMetadataForTrack(i, {
            // @ts-expect-error - url update via metadata
            url: resolvedUrl,
          });
        }
      });
    }
  },

  togglePlayback: async () => {
    const state = await TrackPlayer.getPlaybackState();
    if (state.state === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  },

  skipNext: async () => {
    await TrackPlayer.skipToNext();
  },

  skipPrev: async () => {
    const position = await TrackPlayer.getPosition();
    if (position > 3) {
      await TrackPlayer.seekTo(0);
    } else {
      await TrackPlayer.skipToPrevious();
    }
  },

  seekTo: async (position) => {
    await TrackPlayer.seekTo(position);
  },

  toggleLyrics: () => {
    set((s) => ({ showLyrics: !s.showLyrics }));
  },
}));
