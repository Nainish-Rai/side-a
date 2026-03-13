"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Album, Track, UserPlaylist } from "@/lib/api/types";

interface LibraryState {
  likedTracks: Track[];
  savedAlbums: Album[];
  recentlyPlayed: Track[];
  playlists: UserPlaylist[];
}

interface LibraryContextValue extends LibraryState {
  isTrackLiked: (trackId: number) => boolean;
  toggleTrackLike: (track: Track) => void;
  removeLikedTrack: (trackId: number) => void;
  clearLikedTracks: () => void;
  isAlbumSaved: (albumId: number) => boolean;
  toggleAlbumSave: (album: Album) => void;
  removeSavedAlbum: (albumId: number) => void;
  clearSavedAlbums: () => void;
  addRecentlyPlayed: (track: Track) => void;
  removeRecentlyPlayed: (trackId: number) => void;
  clearRecent: () => void;
  createPlaylist: (input: {
    name: string;
    description?: string;
    initialTracks?: Track[];
  }) => string;
  updatePlaylist: (
    playlistId: string,
    updates: { name?: string; description?: string },
  ) => void;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylists: (track: Track, playlistIds: string[]) => void;
  setTrackPlaylistMemberships: (track: Track, playlistIds: string[]) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: number) => void;
  reorderPlaylistTracks: (
    playlistId: string,
    activeTrackId: number,
    overTrackId: number,
  ) => void;
  replacePlaylistTracks: (playlistId: string, tracks: Track[]) => void;
  isTrackInPlaylist: (playlistId: string, trackId: number) => boolean;
  getPlaylistsForTrack: (trackId: number) => UserPlaylist[];
  getPlaylistById: (playlistId: string) => UserPlaylist | undefined;
}

const STORAGE_KEY = "side-a-library";
const DEVICE_ID_KEY = "side-a-device-id";
const SYNC_DEBOUNCE_MS = 1200;
export const RECENTLY_PLAYED_CAP = 100;
const DEFAULT_SYNC_ENDPOINT = "/api/library/state";

const defaultState: LibraryState = {
  likedTracks: [],
  savedAlbums: [],
  recentlyPlayed: [],
  playlists: [],
};

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

interface LibrarySyncMeta {
  deviceId: string;
  isOnline: boolean;
  isBootstrapped: boolean;
  isSyncing: boolean;
  hasPendingSync: boolean;
  lastBootstrapAt: number | null;
  lastSyncedAt: number | null;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeState(state: Partial<LibraryState> | null | undefined): LibraryState {
  return {
    likedTracks: dedupeById(Array.isArray(state?.likedTracks) ? state.likedTracks : []),
    savedAlbums: dedupeById(Array.isArray(state?.savedAlbums) ? state.savedAlbums : []),
    recentlyPlayed: dedupeById(
      Array.isArray(state?.recentlyPlayed) ? state.recentlyPlayed : [],
    ).slice(0, RECENTLY_PLAYED_CAP),
    playlists: normalizePlaylists(Array.isArray(state?.playlists) ? state.playlists : []),
  };
}

function mergeStates(local: LibraryState, remote: LibraryState): LibraryState {
  return {
    likedTracks: dedupeById([...local.likedTracks, ...remote.likedTracks]),
    savedAlbums: dedupeById([...local.savedAlbums, ...remote.savedAlbums]),
    recentlyPlayed: dedupeById([
      ...local.recentlyPlayed,
      ...remote.recentlyPlayed,
    ]).slice(0, RECENTLY_PLAYED_CAP),
    playlists: mergePlaylists(local.playlists, remote.playlists),
  };
}

function getSyncEndpoint(): string {
  return process.env.NEXT_PUBLIC_LIBRARY_SYNC_ENDPOINT?.trim() || DEFAULT_SYNC_ENDPOINT;
}

function ensureDeviceId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

async function fetchRemoteState(deviceId: string): Promise<LibraryState | null> {
  const endpoint = getSyncEndpoint();
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set("deviceId", deviceId);

  const response = await fetch(url.toString(), { method: "GET" });
  if (!response.ok) return null;

  const data = (await response.json()) as unknown;
  if (!isObjectRecord(data)) return null;

  const remoteState = isObjectRecord(data.state)
    ? (data.state as Partial<LibraryState>)
    : (data as Partial<LibraryState>);
  return normalizeState(remoteState);
}

async function pushRemoteState(deviceId: string, state: LibraryState): Promise<boolean> {
  const endpoint = getSyncEndpoint();
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, state }),
  });

  return response.ok;
}

function loadInitialState(): LibraryState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;

    const parsed = JSON.parse(raw) as Partial<LibraryState>;
    return normalizeState(parsed);
  } catch (error) {
    console.error("Failed to load library state from localStorage:", error);
    return defaultState;
  }
}

function dedupeById<T extends { id: number | string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = String(item.id);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function normalizePlaylist(playlist: Partial<UserPlaylist>): UserPlaylist | null {
  if (!playlist.id || !playlist.name) return null;

  const createdAt = typeof playlist.createdAt === "string" ? playlist.createdAt : new Date().toISOString();
  const updatedAt = typeof playlist.updatedAt === "string" ? playlist.updatedAt : createdAt;

  return {
    id: String(playlist.id),
    name: String(playlist.name).trim() || "Untitled Playlist",
    description: typeof playlist.description === "string" ? playlist.description : "",
    createdAt,
    updatedAt,
    tracks: dedupeById(Array.isArray(playlist.tracks) ? playlist.tracks : []),
  };
}

function normalizePlaylists(playlists: Partial<UserPlaylist>[]): UserPlaylist[] {
  const seen = new Set<string>();
  const result: UserPlaylist[] = [];

  for (const playlist of playlists) {
    const normalized = normalizePlaylist(playlist);
    if (!normalized || seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    result.push(normalized);
  }

  return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function mergePlaylists(local: UserPlaylist[], remote: UserPlaylist[]): UserPlaylist[] {
  const merged = new Map<string, UserPlaylist>();

  for (const playlist of [...local, ...remote]) {
    const normalized = normalizePlaylist(playlist);
    if (!normalized) continue;
    const existing = merged.get(normalized.id);
    if (!existing || normalized.updatedAt >= existing.updatedAt) {
      merged.set(normalized.id, normalized);
    }
  }

  return Array.from(merged.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function generatePlaylistId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `playlist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LibraryState>(loadInitialState);
  const [syncMeta, setSyncMeta] = useState<LibrarySyncMeta>(() => ({
    deviceId: typeof window === "undefined" ? "server" : ensureDeviceId(),
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isBootstrapped: false,
    isSyncing: false,
    hasPendingSync: false,
    lastBootstrapAt: null,
    lastSyncedAt: null,
  }));
  const stateRef = useRef(state);
  const syncMetaRef = useRef(syncMeta);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    syncMetaRef.current = syncMeta;
  }, [syncMeta]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save library state to localStorage:", error);
    }
  }, [state]);

  const runPushSync = useCallback(async () => {
    const meta = syncMetaRef.current;
    if (!meta.isOnline || meta.isSyncing) return;

    setSyncMeta((prev) => ({ ...prev, isSyncing: true }));

    try {
      const ok = await pushRemoteState(meta.deviceId, stateRef.current);
      if (!ok) {
        setSyncMeta((prev) => ({ ...prev, isSyncing: false }));
        return;
      }
      setSyncMeta((prev) => ({
        ...prev,
        hasPendingSync: false,
        isSyncing: false,
        lastSyncedAt: Date.now(),
      }));
    } catch {
      setSyncMeta((prev) => ({ ...prev, isSyncing: false }));
    }
  }, []);

  const schedulePushSync = useCallback(() => {
    if (typeof window === "undefined") return;

    setSyncMeta((prev) => ({ ...prev, hasPendingSync: true }));

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(() => {
      void runPushSync();
    }, SYNC_DEBOUNCE_MS);
  }, [runPushSync]);

  const bootstrapFromRemote = useCallback(async () => {
    if (typeof window === "undefined") return;

    const meta = syncMetaRef.current;
    if (!meta.isOnline || meta.isBootstrapped) return;

    try {
      const remote = await fetchRemoteState(meta.deviceId);
      if (remote) {
        setState((prev) => mergeStates(prev, remote));
      }
    } catch {
      // Keep offline-first behavior if remote bootstrap fails.
    } finally {
      setSyncMeta((prev) => ({
        ...prev,
        isBootstrapped: true,
        lastBootstrapAt: Date.now(),
      }));
    }
  }, []);

  useEffect(() => {
    void bootstrapFromRemote();
  }, [bootstrapFromRemote]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onOnline = () => {
      setSyncMeta((prev) => ({ ...prev, isOnline: true }));
      void bootstrapFromRemote();
      if (syncMetaRef.current.hasPendingSync) {
        schedulePushSync();
      }
    };
    const onOffline = () => {
      setSyncMeta((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [bootstrapFromRemote, schedulePushSync]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!syncMeta.isBootstrapped) return;
    schedulePushSync();
  }, [state, syncMeta.isBootstrapped, schedulePushSync]);

  useEffect(
    () => () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    },
    [],
  );

  const isTrackLiked = useCallback(
    (trackId: number) => state.likedTracks.some((track) => track.id === trackId),
    [state.likedTracks],
  );

  const toggleTrackLike = useCallback((track: Track) => {
    setState((prev) => {
      if (prev.likedTracks.some((item) => item.id === track.id)) {
        return {
          ...prev,
          likedTracks: prev.likedTracks.filter((item) => item.id !== track.id),
        };
      }

      return {
        ...prev,
        likedTracks: dedupeById([track, ...prev.likedTracks]),
      };
    });
  }, []);

  const removeLikedTrack = useCallback((trackId: number) => {
    setState((prev) => ({
      ...prev,
      likedTracks: prev.likedTracks.filter((track) => track.id !== trackId),
    }));
  }, []);

  const clearLikedTracks = useCallback(() => {
    setState((prev) => ({ ...prev, likedTracks: [] }));
  }, []);

  const isAlbumSaved = useCallback(
    (albumId: number) => state.savedAlbums.some((album) => album.id === albumId),
    [state.savedAlbums],
  );

  const toggleAlbumSave = useCallback((album: Album) => {
    setState((prev) => {
      if (prev.savedAlbums.some((item) => item.id === album.id)) {
        return {
          ...prev,
          savedAlbums: prev.savedAlbums.filter((item) => item.id !== album.id),
        };
      }

      return {
        ...prev,
        savedAlbums: dedupeById([album, ...prev.savedAlbums]),
      };
    });
  }, []);

  const removeSavedAlbum = useCallback((albumId: number) => {
    setState((prev) => ({
      ...prev,
      savedAlbums: prev.savedAlbums.filter((album) => album.id !== albumId),
    }));
  }, []);

  const clearSavedAlbums = useCallback(() => {
    setState((prev) => ({ ...prev, savedAlbums: [] }));
  }, []);

  const addRecentlyPlayed = useCallback((track: Track) => {
    setState((prev) => ({
      ...prev,
      recentlyPlayed: dedupeById([track, ...prev.recentlyPlayed]).slice(
        0,
        RECENTLY_PLAYED_CAP,
      ),
    }));
  }, []);

  const removeRecentlyPlayed = useCallback((trackId: number) => {
    setState((prev) => ({
      ...prev,
      recentlyPlayed: prev.recentlyPlayed.filter((track) => track.id !== trackId),
    }));
  }, []);

  const clearRecent = useCallback(() => {
    setState((prev) => ({ ...prev, recentlyPlayed: [] }));
  }, []);

  const createPlaylist = useCallback(
    ({
      name,
      description = "",
      initialTracks = [],
    }: {
      name: string;
      description?: string;
      initialTracks?: Track[];
    }) => {
      const trimmedName = name.trim() || "Untitled Playlist";
      const now = new Date().toISOString();
      const id = generatePlaylistId();

      setState((prev) => ({
        ...prev,
        playlists: [
          {
            id,
            name: trimmedName,
            description: description.trim(),
            createdAt: now,
            updatedAt: now,
            tracks: dedupeById(initialTracks),
          },
          ...prev.playlists,
        ],
      }));

      return id;
    },
    [],
  );

  const updatePlaylist = useCallback(
    (
      playlistId: string,
      updates: {
        name?: string;
        description?: string;
      },
    ) => {
      setState((prev) => ({
        ...prev,
        playlists: prev.playlists.map((playlist) =>
          playlist.id === playlistId
            ? {
                ...playlist,
                name:
                  updates.name !== undefined
                    ? updates.name.trim() || playlist.name
                    : playlist.name,
                description:
                  updates.description !== undefined
                    ? updates.description.trim()
                    : playlist.description,
                updatedAt: new Date().toISOString(),
              }
            : playlist,
        ),
      }));
    },
    [],
  );

  const deletePlaylist = useCallback((playlistId: string) => {
    setState((prev) => ({
      ...prev,
      playlists: prev.playlists.filter((playlist) => playlist.id !== playlistId),
    }));
  }, []);

  const addTrackToPlaylists = useCallback((track: Track, playlistIds: string[]) => {
    if (playlistIds.length === 0) return;

    setState((prev) => ({
      ...prev,
      playlists: prev.playlists.map((playlist) =>
        playlistIds.includes(playlist.id)
          ? {
              ...playlist,
              tracks: dedupeById([track, ...playlist.tracks]),
              updatedAt: new Date().toISOString(),
            }
          : playlist,
      ),
    }));
  }, []);

  const setTrackPlaylistMemberships = useCallback((track: Track, playlistIds: string[]) => {
    setState((prev) => ({
      ...prev,
      playlists: prev.playlists.map((playlist) => {
        const shouldInclude = playlistIds.includes(playlist.id);
        const hasTrack = playlist.tracks.some((item) => item.id === track.id);

        if (shouldInclude && !hasTrack) {
          return {
            ...playlist,
            tracks: dedupeById([track, ...playlist.tracks]),
            updatedAt: new Date().toISOString(),
          };
        }

        if (!shouldInclude && hasTrack) {
          return {
            ...playlist,
            tracks: playlist.tracks.filter((item) => item.id !== track.id),
            updatedAt: new Date().toISOString(),
          };
        }

        return playlist;
      }),
    }));
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: number) => {
    setState((prev) => ({
      ...prev,
      playlists: prev.playlists.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              tracks: playlist.tracks.filter((track) => track.id !== trackId),
              updatedAt: new Date().toISOString(),
            }
          : playlist,
      ),
    }));
  }, []);

  const reorderPlaylistTracks = useCallback(
    (playlistId: string, activeTrackId: number, overTrackId: number) => {
      if (activeTrackId === overTrackId) return;

      setState((prev) => ({
        ...prev,
        playlists: prev.playlists.map((playlist) => {
          if (playlist.id !== playlistId) return playlist;

          const oldIndex = playlist.tracks.findIndex((track) => track.id === activeTrackId);
          const newIndex = playlist.tracks.findIndex((track) => track.id === overTrackId);
          if (oldIndex === -1 || newIndex === -1) return playlist;

          const reordered = [...playlist.tracks];
          const [moved] = reordered.splice(oldIndex, 1);
          reordered.splice(newIndex, 0, moved);

          return {
            ...playlist,
            tracks: reordered,
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    [],
  );

  const replacePlaylistTracks = useCallback((playlistId: string, tracks: Track[]) => {
    setState((prev) => ({
      ...prev,
      playlists: prev.playlists.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              tracks: dedupeById(tracks),
              updatedAt: new Date().toISOString(),
            }
          : playlist,
      ),
    }));
  }, []);

  const isTrackInPlaylist = useCallback(
    (playlistId: string, trackId: number) =>
      state.playlists.some(
        (playlist) =>
          playlist.id === playlistId &&
          playlist.tracks.some((track) => track.id === trackId),
      ),
    [state.playlists],
  );

  const getPlaylistsForTrack = useCallback(
    (trackId: number) =>
      state.playlists.filter((playlist) =>
        playlist.tracks.some((track) => track.id === trackId),
      ),
    [state.playlists],
  );

  const getPlaylistById = useCallback(
    (playlistId: string) => state.playlists.find((playlist) => playlist.id === playlistId),
    [state.playlists],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      ...state,
      isTrackLiked,
      toggleTrackLike,
      removeLikedTrack,
      clearLikedTracks,
      isAlbumSaved,
      toggleAlbumSave,
      removeSavedAlbum,
      clearSavedAlbums,
      addRecentlyPlayed,
      removeRecentlyPlayed,
      clearRecent,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      addTrackToPlaylists,
      setTrackPlaylistMemberships,
      removeTrackFromPlaylist,
      reorderPlaylistTracks,
      replacePlaylistTracks,
      isTrackInPlaylist,
      getPlaylistsForTrack,
      getPlaylistById,
    }),
    [
      state,
      isTrackLiked,
      toggleTrackLike,
      removeLikedTrack,
      clearLikedTracks,
      isAlbumSaved,
      toggleAlbumSave,
      removeSavedAlbum,
      clearSavedAlbums,
      addRecentlyPlayed,
      removeRecentlyPlayed,
      clearRecent,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      addTrackToPlaylists,
      setTrackPlaylistMemberships,
      removeTrackFromPlaylist,
      reorderPlaylistTracks,
      replacePlaylistTracks,
      isTrackInPlaylist,
      getPlaylistsForTrack,
      getPlaylistById,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within LibraryProvider");
  }
  return context;
}
